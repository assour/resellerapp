import { NextResponse } from 'next/server';
import { marketplaceIds } from '@/lib/marketplaces';
import { providerStatus } from '@/lib/server/oauthProviders';
import { listMarketplaceTokenMetadata, tokenVaultEncryptionStatus } from '@/lib/server/tokenVault';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'demo';
  const providers = await Promise.all(marketplaceIds.map((id) => providerStatus(id, userId)));
  const tokens = await listMarketplaceTokenMetadata(userId);

  return NextResponse.json({
    ok: true,
    userId,
    tokenVaultEncryption: tokenVaultEncryptionStatus(),
    providers: providers.filter(Boolean),
    tokens
  });
}
