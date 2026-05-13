import { NextResponse } from 'next/server';
import { isMarketplaceId } from '@/lib/marketplaces';
import { refreshMarketplaceToken } from '@/lib/server/oauthProviders';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ marketplace: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { marketplace } = await context.params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'demo';

  if (!isMarketplaceId(marketplace)) {
    return NextResponse.json({ ok: false, error: 'Unsupported marketplace.' }, { status: 404 });
  }

  try {
    const token = await refreshMarketplaceToken(marketplace, userId);
    return NextResponse.json({
      ok: true,
      marketplace,
      expiresAt: token.expiresAt,
      refreshExpiresAt: token.refreshExpiresAt
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      marketplace,
      error: error instanceof Error ? error.message : 'Could not refresh token.'
    }, { status: 400 });
  }
}
