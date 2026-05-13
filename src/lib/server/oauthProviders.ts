import 'server-only';

import crypto from 'node:crypto';
import type { MarketplaceId } from '../types';
import { marketplaceName } from '../marketplaces';
import { consumeOAuthState, getMarketplaceToken, saveMarketplaceToken, saveOAuthState, type StoredMarketplaceToken } from './tokenVault';

type ProviderMode = 'oauth' | 'partner' | 'manual';

interface ProviderDefinition {
  id: MarketplaceId;
  mode: ProviderMode;
  docsUrl: string;
  approvalUrl: string;
  envVars: string[];
  scopes: string[];
  approvalNote: string;
}

export const providerDefinitions: ProviderDefinition[] = [
  {
    id: 'ebay',
    mode: 'oauth',
    docsUrl: 'https://developer.ebay.com/api-docs/static/oauth-authorization-code-grant.html',
    approvalUrl: 'https://developer.ebay.com/',
    envVars: ['EBAY_CLIENT_ID', 'EBAY_CLIENT_SECRET', 'EBAY_REDIRECT_URI'],
    scopes: [
      'https://api.ebay.com/oauth/api_scope/sell.inventory',
      'https://api.ebay.com/oauth/api_scope/sell.account',
      'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
      'https://api.ebay.com/oauth/api_scope/commerce.identity.readonly'
    ],
    approvalNote: 'Create an eBay Developers app, configure the redirect/RuName, and request Sell API scopes.'
  },
  {
    id: 'etsy',
    mode: 'oauth',
    docsUrl: 'https://developers.etsy.com/documentation/essentials/authentication',
    approvalUrl: 'https://developers.etsy.com/',
    envVars: ['ETSY_CLIENT_ID', 'ETSY_REDIRECT_URI'],
    scopes: ['listings_r', 'listings_w', 'transactions_r', 'transactions_w', 'shops_r', 'shops_w'],
    approvalNote: 'Create an Etsy app and register the exact callback URL. Etsy OAuth requires PKCE.'
  },
  {
    id: 'facebook',
    mode: 'partner',
    docsUrl: 'https://developers.facebook.com/',
    approvalUrl: 'https://developers.facebook.com/apps/',
    envVars: ['META_APP_ID', 'META_APP_SECRET', 'META_REDIRECT_URI'],
    scopes: ['catalog_management', 'business_management', 'commerce_account_manage_orders'],
    approvalNote: 'Facebook Marketplace consumer listing is not a public posting API. Only approved Meta commerce surfaces should be connected.'
  },
  {
    id: 'depop',
    mode: 'partner',
    docsUrl: 'https://partnerapi.depop.com/api-docs/concepts/authentication/',
    approvalUrl: 'mailto:partners@depop.com',
    envVars: ['DEPOP_CLIENT_ID', 'DEPOP_CLIENT_SECRET', 'DEPOP_AUTH_URL', 'DEPOP_TOKEN_URL', 'DEPOP_REDIRECT_URI'],
    scopes: ['products_read', 'products_write', 'orders_read', 'orders_write', 'shop_read'],
    approvalNote: 'Depop says API keys/OAuth cannot be configured directly; contact Depop for partner access first.'
  },
  {
    id: 'tiktok',
    mode: 'partner',
    docsUrl: 'https://partner.tiktokshop.com/docv2/page/authorization-via-app-store',
    approvalUrl: 'https://partner.tiktokshop.com/',
    envVars: ['TIKTOK_SHOP_CLIENT_KEY', 'TIKTOK_SHOP_CLIENT_SECRET', 'TIKTOK_SHOP_MERCHANT_ID'],
    scopes: [],
    approvalNote: 'TikTok Shop requires Partner Center approval and seller authorization before merchant tokens are issued.'
  },
  {
    id: 'mercari',
    mode: 'manual',
    docsUrl: 'https://www.mercari.com/us/help_center/topics/account/policies/prohibited-conduct/',
    approvalUrl: 'https://www.mercari.com/',
    envVars: [],
    scopes: [],
    approvalNote: 'No public seller-listing API is wired. Keep Mercari manual unless Mercari grants official access.'
  },
  {
    id: 'poshmark',
    mode: 'manual',
    docsUrl: 'https://www.poshmark.com/terms',
    approvalUrl: 'https://www.poshmark.com/',
    envVars: [],
    scopes: [],
    approvalNote: 'No public seller-listing API is wired. Do not scrape or automate Poshmark.'
  }
];

export function getProviderDefinition(id: MarketplaceId) {
  return providerDefinitions.find((provider) => provider.id === id);
}

function env(name: string) {
  return process.env[name] || '';
}

function configured(provider: ProviderDefinition) {
  return provider.envVars.every((name) => Boolean(env(name)));
}

export async function providerStatus(id: MarketplaceId, userId: string) {
  const provider = getProviderDefinition(id);
  if (!provider) return null;

  const token = await getMarketplaceToken(id, userId);
  const missingEnv = provider.envVars.filter((name) => !env(name));
  return {
    id,
    name: marketplaceName(id),
    mode: provider.mode,
    configured: configured(provider),
    tokenConnected: Boolean(token),
    missingEnv,
    scopes: provider.scopes,
    docsUrl: provider.docsUrl,
    approvalUrl: provider.approvalUrl,
    approvalNote: provider.approvalNote,
    startUrl: provider.mode === 'manual' ? null : `/api/oauth/${id}/start?userId=${encodeURIComponent(userId)}`
  };
}

export function randomState() {
  return crypto.randomBytes(24).toString('base64url');
}

export function pkceVerifier() {
  return crypto.randomBytes(48).toString('base64url');
}

export function pkceChallenge(verifier: string) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

function appUrl() {
  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

function ebayEnvironment() {
  return process.env.EBAY_ENV === 'sandbox' ? 'sandbox' : 'production';
}

export async function createAuthorizationUrl(id: MarketplaceId, userId: string) {
  const provider = getProviderDefinition(id);
  if (!provider) throw new Error('Unsupported marketplace.');
  if (provider.mode === 'manual') throw new Error(`${marketplaceName(id)} does not have a public OAuth listing flow configured.`);
  if (!configured(provider)) {
    throw new Error(`Missing server environment variables: ${provider.envVars.filter((name) => !env(name)).join(', ')}`);
  }

  const state = randomState();
  const redirectUri = provider.id === 'ebay'
    ? env('EBAY_REDIRECT_URI')
    : env(`${provider.id.toUpperCase()}_REDIRECT_URI`) || env('META_REDIRECT_URI') || `${appUrl()}/api/oauth/${id}/callback`;

  if (id === 'ebay') {
    await saveOAuthState({ marketplaceId: id, userId, state, redirectUri, createdAt: new Date().toISOString() });
    const authBase = ebayEnvironment() === 'sandbox'
      ? 'https://auth.sandbox.ebay.com/oauth2/authorize'
      : 'https://auth.ebay.com/oauth2/authorize';
    const params = new URLSearchParams({
      client_id: env('EBAY_CLIENT_ID'),
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: provider.scopes.join(' '),
      state
    });
    return `${authBase}?${params.toString()}`;
  }

  if (id === 'etsy') {
    const verifier = pkceVerifier();
    await saveOAuthState({ marketplaceId: id, userId, state, redirectUri, codeVerifier: verifier, createdAt: new Date().toISOString() });
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: env('ETSY_CLIENT_ID'),
      redirect_uri: redirectUri,
      scope: provider.scopes.join(' '),
      state,
      code_challenge: pkceChallenge(verifier),
      code_challenge_method: 'S256'
    });
    return `https://www.etsy.com/oauth/connect?${params.toString()}`;
  }

  if (id === 'facebook') {
    await saveOAuthState({ marketplaceId: id, userId, state, redirectUri: env('META_REDIRECT_URI'), createdAt: new Date().toISOString() });
    const params = new URLSearchParams({
      client_id: env('META_APP_ID'),
      redirect_uri: env('META_REDIRECT_URI'),
      response_type: 'code',
      scope: provider.scopes.join(','),
      state
    });
    return `https://www.facebook.com/v20.0/dialog/oauth?${params.toString()}`;
  }

  if (id === 'depop') {
    const verifier = pkceVerifier();
    await saveOAuthState({ marketplaceId: id, userId, state, redirectUri: env('DEPOP_REDIRECT_URI'), codeVerifier: verifier, createdAt: new Date().toISOString() });
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: env('DEPOP_CLIENT_ID'),
      redirect_uri: env('DEPOP_REDIRECT_URI'),
      scope: provider.scopes.join(' '),
      state,
      code_challenge: pkceChallenge(verifier),
      code_challenge_method: 'S256'
    });
    return `${env('DEPOP_AUTH_URL')}?${params.toString()}`;
  }

  throw new Error(`${marketplaceName(id)} requires partner approval before an authorization URL can be generated.`);
}

function responseExpiryToIso(id: MarketplaceId, value: unknown) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return undefined;

  // TikTok Shop commonly returns Unix timestamps for token expiry fields, while
  // OAuth providers like eBay, Etsy, and Meta return duration-in-seconds values.
  if (id === 'tiktok' && numeric > 1_000_000_000) {
    return new Date(numeric * 1000).toISOString();
  }

  return new Date(Date.now() + numeric * 1000).toISOString();
}

function tokenResponseToRecord(id: MarketplaceId, userId: string, body: Record<string, unknown>): StoredMarketplaceToken {
  const now = new Date();
  const accessToken = String(body.access_token || '');

  if (!accessToken) throw new Error(`Token response from ${marketplaceName(id)} did not include an access_token.`);

  return {
    marketplaceId: id,
    userId,
    accessToken,
    refreshToken: body.refresh_token ? String(body.refresh_token) : undefined,
    tokenType: body.token_type ? String(body.token_type) : 'Bearer',
    scope: body.scope ? String(body.scope) : undefined,
    expiresAt: responseExpiryToIso(id, body.expires_in),
    refreshExpiresAt: responseExpiryToIso(id, body.refresh_expires_in || body.refresh_token_expires_in),
    merchantId: body.merchant_id ? String(body.merchant_id) : undefined,
    raw: body,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
}

async function postForm(url: string, body: URLSearchParams, headers: HeadersInit = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...headers
    },
    body
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(JSON.stringify(data));
  return data as Record<string, unknown>;
}

export async function exchangeAuthorizationCode(id: MarketplaceId, code: string, state: string) {
  const savedState = await consumeOAuthState(state);
  if (!savedState || savedState.marketplaceId !== id) throw new Error('Invalid or expired OAuth state.');

  if (id === 'ebay') {
    const tokenBase = ebayEnvironment() === 'sandbox'
      ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
      : 'https://api.ebay.com/identity/v1/oauth2/token';
    const credentials = Buffer.from(`${env('EBAY_CLIENT_ID')}:${env('EBAY_CLIENT_SECRET')}`).toString('base64');
    const data = await postForm(tokenBase, new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: savedState.redirectUri || env('EBAY_REDIRECT_URI')
    }), { Authorization: `Basic ${credentials}` });
    const token = tokenResponseToRecord(id, savedState.userId, data);
    await saveMarketplaceToken(token);
    return token;
  }

  if (id === 'etsy') {
    const data = await postForm('https://api.etsy.com/v3/public/oauth/token', new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: env('ETSY_CLIENT_ID'),
      redirect_uri: savedState.redirectUri || env('ETSY_REDIRECT_URI'),
      code,
      code_verifier: savedState.codeVerifier || ''
    }));
    const token = tokenResponseToRecord(id, savedState.userId, data);
    await saveMarketplaceToken(token);
    return token;
  }

  if (id === 'facebook') {
    const params = new URLSearchParams({
      client_id: env('META_APP_ID'),
      client_secret: env('META_APP_SECRET'),
      redirect_uri: savedState.redirectUri || env('META_REDIRECT_URI'),
      code
    });
    const response = await fetch(`https://graph.facebook.com/v20.0/oauth/access_token?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data));
    const token = tokenResponseToRecord(id, savedState.userId, data);
    await saveMarketplaceToken(token);
    return token;
  }

  if (id === 'depop') {
    const data = await postForm(env('DEPOP_TOKEN_URL'), new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: env('DEPOP_CLIENT_ID'),
      client_secret: env('DEPOP_CLIENT_SECRET'),
      redirect_uri: savedState.redirectUri || env('DEPOP_REDIRECT_URI'),
      code,
      code_verifier: savedState.codeVerifier || ''
    }));
    const token = tokenResponseToRecord(id, savedState.userId, data);
    await saveMarketplaceToken(token);
    return token;
  }

  throw new Error(`${marketplaceName(id)} callback handling is not available without partner-specific token docs.`);
}

export async function refreshMarketplaceToken(id: MarketplaceId, userId: string) {
  const current = await getMarketplaceToken(id, userId);
  if (!current?.refreshToken) throw new Error(`No refresh token stored for ${marketplaceName(id)}.`);

  if (id === 'ebay') {
    const tokenBase = ebayEnvironment() === 'sandbox'
      ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
      : 'https://api.ebay.com/identity/v1/oauth2/token';
    const credentials = Buffer.from(`${env('EBAY_CLIENT_ID')}:${env('EBAY_CLIENT_SECRET')}`).toString('base64');
    const data = await postForm(tokenBase, new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: current.refreshToken
    }), { Authorization: `Basic ${credentials}` });
    const token = tokenResponseToRecord(id, userId, { ...data, refresh_token: current.refreshToken });
    await saveMarketplaceToken(token);
    return token;
  }

  if (id === 'etsy') {
    const data = await postForm('https://api.etsy.com/v3/public/oauth/token', new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: env('ETSY_CLIENT_ID'),
      refresh_token: current.refreshToken
    }));
    const token = tokenResponseToRecord(id, userId, data);
    await saveMarketplaceToken(token);
    return token;
  }

  if (id === 'tiktok') {
    const data = await postForm('https://open.tiktokapis.com/merchant/oauth/token/', new URLSearchParams({
      client_key: env('TIKTOK_SHOP_CLIENT_KEY'),
      client_secret: env('TIKTOK_SHOP_CLIENT_SECRET'),
      merchant_id: current.merchantId || env('TIKTOK_SHOP_MERCHANT_ID'),
      grant_type: 'refresh_token',
      refresh_token: current.refreshToken
    }), { 'x-tt-target-idc': process.env.TIKTOK_SHOP_TARGET_IDC || 'alisg' });
    const token = tokenResponseToRecord(id, userId, data);
    await saveMarketplaceToken(token);
    return token;
  }

  throw new Error(`Refresh handling for ${marketplaceName(id)} requires marketplace-specific partner access.`);
}
