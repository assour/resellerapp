import { NextResponse } from 'next/server';
import { isMarketplaceId } from '@/lib/marketplaces';
import { deleteMarketplaceToken, getMarketplaceToken } from '@/lib/server/tokenVault';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ marketplace: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { marketplace } = await context.params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'demo';

  if (!isMarketplaceId(marketplace)) {
    return NextResponse.json({ ok: false, error: 'Unsupported marketplace.' }, { status: 404 });
  }

  const token = await getMarketplaceToken(marketplace, userId);

  if (!token) return NextResponse.json({ ok: true, connected: false });

  const { accessToken: _accessToken, refreshToken: _refreshToken, raw: _raw, ...metadata } = token;
  return NextResponse.json({
    ok: true,
    connected: true,
    token: {
      ...metadata,
      hasAccessToken: true,
      hasRefreshToken: Boolean(_refreshToken)
    }
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { marketplace } = await context.params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'demo';

  if (!isMarketplaceId(marketplace)) {
    return NextResponse.json({ ok: false, error: 'Unsupported marketplace.' }, { status: 404 });
  }

  await deleteMarketplaceToken(marketplace, userId);
  return NextResponse.json({ ok: true, connected: false });
}
