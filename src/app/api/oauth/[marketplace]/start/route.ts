import { NextResponse } from 'next/server';
import { isMarketplaceId } from '@/lib/marketplaces';
import { createAuthorizationUrl, getProviderDefinition, providerStatus } from '@/lib/server/oauthProviders';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ marketplace: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { marketplace } = await context.params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'demo';
  const mode = searchParams.get('mode');

  if (!isMarketplaceId(marketplace)) {
    return NextResponse.json({ ok: false, error: 'Unsupported marketplace.' }, { status: 404 });
  }

  const provider = getProviderDefinition(marketplace);

  if (!provider) {
    return NextResponse.json({ ok: false, error: 'Unsupported marketplace.' }, { status: 404 });
  }

  try {
    const authorizationUrl = await createAuthorizationUrl(marketplace, userId);
    if (mode === 'json') {
      return NextResponse.json({ ok: true, authorizationUrl });
    }
    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    const status = await providerStatus(marketplace, userId);
    return NextResponse.json({
      ok: false,
      marketplace,
      error: error instanceof Error ? error.message : 'Could not start OAuth.',
      status
    }, { status: provider.mode === 'manual' ? 501 : 400 });
  }
}
