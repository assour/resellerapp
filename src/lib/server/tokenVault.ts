import 'server-only';

import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { MarketplaceId } from '../types';

export interface StoredMarketplaceToken {
  marketplaceId: MarketplaceId;
  userId: string;
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  scope?: string;
  expiresAt?: string;
  refreshExpiresAt?: string;
  merchantId?: string;
  raw?: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface OAuthStateRecord {
  marketplaceId: MarketplaceId;
  userId: string;
  state: string;
  codeVerifier?: string;
  redirectUri?: string;
  createdAt: string;
}

interface VaultPayload {
  tokens: Record<string, StoredMarketplaceToken>;
  states: Record<string, OAuthStateRecord>;
}

type EncryptedVault = {
  version: 1;
  encrypted: true;
  iv: string;
  tag: string;
  data: string;
};

const VAULT_PATH = path.join(process.cwd(), '.resellsync-token-vault.json');

function isEncryptedVault(value: EncryptedVault | VaultPayload): value is EncryptedVault {
  return 'encrypted' in value && value.encrypted === true;
}

function blankVault(): VaultPayload {
  return { tokens: {}, states: {} };
}

function tokenKey(marketplaceId: MarketplaceId, userId: string) {
  return `${userId}:${marketplaceId}`;
}

function encryptionKey() {
  const configured = process.env.RESELLSYNC_TOKEN_ENCRYPTION_KEY || process.env.TOKEN_ENCRYPTION_KEY;
  if (!configured && process.env.NODE_ENV === 'production') {
    throw new Error('RESELLSYNC_TOKEN_ENCRYPTION_KEY is required in production before storing marketplace tokens.');
  }

  const value = configured || 'resellsync-local-dev-token-key-change-before-production';
  return crypto.createHash('sha256').update(value).digest();
}

export function tokenVaultEncryptionStatus() {
  return process.env.RESELLSYNC_TOKEN_ENCRYPTION_KEY || process.env.TOKEN_ENCRYPTION_KEY
    ? 'configured'
    : 'local-dev-fallback';
}

async function readVault(): Promise<VaultPayload> {
  try {
    const raw = await fs.readFile(VAULT_PATH, 'utf8');
    const parsed = JSON.parse(raw) as EncryptedVault | VaultPayload;

    if (isEncryptedVault(parsed)) {
      const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(parsed.iv, 'base64url'));
      decipher.setAuthTag(Buffer.from(parsed.tag, 'base64url'));
      const plaintext = Buffer.concat([
        decipher.update(Buffer.from(parsed.data, 'base64url')),
        decipher.final()
      ]).toString('utf8');
      return JSON.parse(plaintext) as VaultPayload;
    }

    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return blankVault();
    throw error;
  }
}

async function writeVault(payload: VaultPayload) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final()
  ]);

  const vault: EncryptedVault = {
    version: 1,
    encrypted: true,
    iv: iv.toString('base64url'),
    tag: cipher.getAuthTag().toString('base64url'),
    data: encrypted.toString('base64url')
  };

  await fs.writeFile(VAULT_PATH, `${JSON.stringify(vault, null, 2)}\n`, 'utf8');
}

export async function saveOAuthState(record: OAuthStateRecord) {
  const vault = await readVault();
  vault.states[record.state] = record;
  await writeVault(vault);
}

export async function consumeOAuthState(state: string) {
  const vault = await readVault();
  const record = vault.states[state];
  if (!record) return null;

  delete vault.states[state];
  await writeVault(vault);
  return record;
}

export async function saveMarketplaceToken(token: StoredMarketplaceToken) {
  const vault = await readVault();
  vault.tokens[tokenKey(token.marketplaceId, token.userId)] = token;
  await writeVault(vault);
}

export async function getMarketplaceToken(marketplaceId: MarketplaceId, userId: string) {
  const vault = await readVault();
  return vault.tokens[tokenKey(marketplaceId, userId)] || null;
}

export async function deleteMarketplaceToken(marketplaceId: MarketplaceId, userId: string) {
  const vault = await readVault();
  delete vault.tokens[tokenKey(marketplaceId, userId)];
  await writeVault(vault);
}

export async function listMarketplaceTokenMetadata(userId: string) {
  const vault = await readVault();
  return Object.values(vault.tokens)
    .filter((token) => token.userId === userId)
    .map(({ accessToken: _accessToken, refreshToken: _refreshToken, raw: _raw, ...metadata }) => ({
      ...metadata,
      hasAccessToken: true,
      hasRefreshToken: Boolean(_refreshToken)
    }));
}
