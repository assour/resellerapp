import { NextResponse } from 'next/server';
import { exchangeAuthorizationCode } from '@/lib/server/oauthProviders';
import { isMarketplaceId, marketplaceName } from '@/lib/marketplaces';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ marketplace: string }>;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function html(title: string, body: string) {
  return new NextResponse(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: Inter, system-ui, sans-serif; background: #f6f8f7; color: #101820; display: grid; place-items: center; min-height: 100vh; margin: 0; }
      main { max-width: 540px; background: white; border: 1px solid #d8e1dd; border-radius: 18px; padding: 28px; box-shadow: 0 18px 50px rgba(16, 24, 32, .10); }
      a { color: #255f4f; font-weight: 800; }
      pre { white-space: pre-wrap; background: #f1f5f3; padding: 12px; border-radius: 10px; }
    </style>
  </head>
  <body><main>${body}</main></body>
</html>`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

export async function GET(request: Request, context: RouteContext) {
  const { marketplace } = await context.params;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (!isMarketplaceId(marketplace)) {
    return html('Unsupported marketplace', '<h1>Unsupported marketplace</h1><p>This OAuth callback is not configured in ResellSync.</p><p><a href="/">Back to ResellSync</a></p>');
  }

  const providerName = escapeHtml(marketplaceName(marketplace));

  if (error) {
    return html('OAuth cancelled', `<h1>${providerName} authorization was not completed</h1><p>${escapeHtml(error)}</p><p><a href="/">Back to ResellSync</a></p>`);
  }

  if (!code || !state) {
    return html('OAuth callback missing data', `<h1>Missing callback data</h1><p>The marketplace did not return both code and state.</p><p><a href="/">Back to ResellSync</a></p>`);
  }

  try {
    const token = await exchangeAuthorizationCode(marketplace, code, state);
    return html('OAuth connected', `<h1>${providerName} connected</h1><p>Access token stored server-side. Refresh token present: <strong>${Boolean(token.refreshToken)}</strong>.</p><p><a href="/">Back to ResellSync</a></p>`);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Unknown OAuth callback error.';
    return html('OAuth failed', `<h1>${providerName} connection failed</h1><pre>${escapeHtml(message)}</pre><p><a href="/">Back to ResellSync</a></p>`);
  }
}
