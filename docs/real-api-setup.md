# Real API Approval And Token Handling

ResellSync now includes server-side OAuth/token handling routes. The app cannot automatically obtain marketplace approval because each platform requires your own developer account, business/seller identity, redirect URI, and review process.

## What Is Implemented

- Server-side OAuth start routes.
- Server-side OAuth callback routes.
- Server-side token exchange for eBay.
- Server-side token exchange for Etsy with PKCE.
- Meta commerce OAuth structure for approved Meta commerce use cases.
- Depop partner OAuth structure once Depop gives you auth and token URLs.
- TikTok Shop refresh-token structure once Partner Center approval and merchant authorization exist.
- Encrypted local token vault for development.
- Token metadata, deletion, and refresh routes.
- Production API readiness panel in the Connect Accounts page.

## Token Vault

Local tokens are stored in:

```text
.resellsync-token-vault.json
```

This file is ignored by Git. Set a strong key before storing real tokens:

```text
RESELLSYNC_TOKEN_ENCRYPTION_KEY=your_long_random_secret
```

For production, replace the local vault with Supabase, Postgres, or another database-backed encrypted token store.

## eBay

Official docs:

- https://developer.ebay.com/api-docs/static/oauth-authorization-code-grant.html
- https://developer.ebay.com/api-docs/static/oauth-auth-code-grant-request.html
- https://developer.ebay.com/api-docs/sell/inventory/overview.html

Add:

```text
EBAY_ENV=sandbox
EBAY_CLIENT_ID=
EBAY_CLIENT_SECRET=
EBAY_REDIRECT_URI=
```

Then open:

```text
/api/oauth/ebay/start?userId=demo
```

## Etsy

Official docs:

- https://developers.etsy.com/documentation/essentials/authentication

Add:

```text
ETSY_CLIENT_ID=
ETSY_REDIRECT_URI=
```

Then open:

```text
/api/oauth/etsy/start?userId=demo
```

## Facebook Marketplace / Meta

Meta commerce APIs may apply to approved business commerce use cases. Consumer Facebook Marketplace listing automation is not a general public API path.

Add only after Meta approval:

```text
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=
```

## Depop

Official docs:

- https://partnerapi.depop.com/api-docs/concepts/authentication/

Depop says API keys and OAuth cannot be configured directly. Contact Depop first. After approval, fill:

```text
DEPOP_CLIENT_ID=
DEPOP_CLIENT_SECRET=
DEPOP_AUTH_URL=
DEPOP_TOKEN_URL=
DEPOP_REDIRECT_URI=
```

## TikTok Shop

Official docs:

- https://partner.tiktokshop.com/
- https://developers.tiktok.com/doc/obtain-access-token-for-apis

TikTok Shop requires Partner Center approval and merchant authorization. After approval, fill:

```text
TIKTOK_SHOP_CLIENT_KEY=
TIKTOK_SHOP_CLIENT_SECRET=
TIKTOK_SHOP_MERCHANT_ID=
TIKTOK_SHOP_TARGET_IDC=alisg
```

## Mercari And Poshmark

No public seller-listing API is wired. Keep these as manual/import-export channels unless the platform grants official access.

Do not scrape or automate unsupported marketplaces.
