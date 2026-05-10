const env = import.meta.env || {};

export const marketplaceConfig = {
  ebay: {
    label: 'eBay',
    clientId: env.VITE_EBAY_CLIENT_ID,
    redirectUri: env.VITE_EBAY_REDIRECT_URI
  },
  facebook: {
    label: 'Facebook Marketplace',
    clientId: env.VITE_FACEBOOK_CLIENT_ID,
    redirectUri: env.VITE_FACEBOOK_REDIRECT_URI
  },
  depop: {
    label: 'Depop',
    clientId: env.VITE_DEPOP_CLIENT_ID,
    redirectUri: env.VITE_DEPOP_REDIRECT_URI
  },
  mercari: {
    label: 'Mercari',
    clientId: env.VITE_MERCARI_CLIENT_ID,
    redirectUri: env.VITE_MERCARI_REDIRECT_URI
  },
  poshmark: {
    label: 'Poshmark',
    clientId: env.VITE_POSHMARK_CLIENT_ID,
    redirectUri: env.VITE_POSHMARK_REDIRECT_URI
  }
};

export function isDemoMode() {
  const explicitDemo = String(env.VITE_DEMO_MODE ?? 'true').toLowerCase() === 'true';
  const missingMarketplaceKeys = Object.values(marketplaceConfig).some((marketplace) => !marketplace.clientId);

  if (!explicitDemo && missingMarketplaceKeys) {
    console.warn('Marketplace API keys are missing. Falling back to demo mode.');
  }

  return explicitDemo || missingMarketplaceKeys;
}

export const demoMode = isDemoMode();
