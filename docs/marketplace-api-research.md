# Marketplace API Research

Researched on May 10, 2026. Use this as implementation guidance, not legal advice. Re-check each platform before launching production integrations.

## Summary

| Marketplace | Current Practical Path | Notes |
| --- | --- | --- |
| eBay | Official API path is viable | Use eBay Sell Inventory API, Account API, OAuth, seller business policies, inventory locations, offers, and publish offer calls. |
| Facebook Marketplace | Treat as limited/manual unless Meta approves a commerce path | Do not scrape or automate Facebook Marketplace. Investigate Meta Commerce/Product Catalog only for eligible business use cases. |
| Depop | Official API exists, but it is private | Depop says the Selling API is not available to the general public and requires contacting Depop for access. |
| Mercari | No public seller-listing API found | Mercari prohibits robots, crawlers, scrapers, and automated interfaces not provided by Mercari. Treat as manual or partner-only. |
| Poshmark | No public seller-listing API found | Poshmark terms prohibit scraping, harvesting, crawling, or automated collection. Use manual exports such as My Inventory Report where appropriate. |

## eBay

Official source: [eBay Inventory API Overview](https://developer.ebay.com/api-docs/sell/inventory/overview.html)

Key findings:

- eBay supports inventory items, inventory locations, offers, and publishing offers.
- A seller must have an inventory location before publishing offers.
- Published offers require payment, fulfillment, and return business policies.
- eBay says listings created through the Inventory API must be revised through the API rather than Seller Hub.

Recommended next implementation:

- Add a backend OAuth flow.
- Store eBay refresh tokens server-side.
- Add SKU generation.
- Add business policy and inventory location setup screens.
- Implement create inventory item, create offer, publish offer, and withdraw offer.

## Facebook Marketplace

Official starting points:

- [Facebook Marketplace Help Center](https://www.facebook.com/help/1713241952104830/)
- [Meta for Developers](https://developers.facebook.com/)

Key findings:

- I did not find a public API for normal person-to-person Facebook Marketplace listing automation.
- Meta commerce/product catalog APIs may apply to approved business commerce surfaces, but that is different from automating consumer Marketplace posting.
- Avoid browser automation, scraping, or unofficial posting bots.

Recommended next implementation:

- Keep Facebook Marketplace in the app as a manual tracking channel for now.
- Add a checklist/export flow that helps the user manually create listings.
- Re-check Meta Commerce Platform requirements before attempting a real integration.

## Depop

Official sources:

- [Depop Selling API Overview](https://partnerapi.depop.com/api-docs/)
- [Depop Authentication](https://partnerapi.depop.com/api-docs/concepts/authentication/)
- [Depop First Listing Guide](https://partnerapi.depop.com/api-docs/getting-started/your-first-listing/)

Key findings:

- Depop has a partner Selling API for inventory, orders, offers, webhooks, and sandbox testing.
- The API is private and not generally available.
- Depop supports API keys for direct partners and OAuth 2.0 with PKCE for third-party cross-listing apps.
- Listing creation uses product endpoints and requires a bearer token.

Recommended next implementation:

- Contact Depop for API access.
- Build OAuth with PKCE only after approval.
- Store Depop tokens server-side.
- Add Depop taxonomy mapping before listing.

## Mercari

Official source: [Mercari Prohibited Conduct](https://www.mercari.com/us/help_center/topics/account/policies/prohibited-conduct/)

Key findings:

- I did not find official public seller-listing API docs for Mercari.
- Mercari prohibits robots, spambots, spiders, crawlers, scrapers, or other automated interfaces not provided by Mercari.

Recommended next implementation:

- Keep Mercari as a manual tracking channel.
- Do not build a scraper or browser automation flow.
- Add export/checklist tooling if manual listing support is useful.

## Poshmark

Official sources:

- [Poshmark Terms](https://www.poshmark.com/terms)
- [Poshmark My Inventory Report](https://blog.poshmark.com/2019/11/01/introducing-my-inventory-report/)

Key findings:

- I did not find official public seller-listing API docs for Poshmark.
- Poshmark terms prohibit scraping, harvesting, crawling, and automated data collection.
- Poshmark provides a manual My Inventory Report export for seller inventory insight.

Recommended next implementation:

- Keep Poshmark as a manual tracking/import channel.
- Support CSV import from My Inventory Report later.
- Do not build scraping or automated closet actions.

## Production Rule

Only implement official APIs or approved partner APIs. For unsupported marketplaces, build manual workflows, exports, imports, reminders, and status tracking instead of scraping or browser automation.
