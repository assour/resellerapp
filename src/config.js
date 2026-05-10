const env = import.meta.env || {};

export const supabaseConfig = {
  url: env.VITE_SUPABASE_URL,
  anonKey: env.VITE_SUPABASE_ANON_KEY,
  storageBucket: env.VITE_SUPABASE_STORAGE_BUCKET || 'product-photos'
};

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

export const explicitDemoMode = String(env.VITE_DEMO_MODE ?? 'true').toLowerCase() === 'true';
export const supabaseConfigured = Boolean(supabaseConfig.url && supabaseConfig.anonKey);
export const useSupabaseData = !explicitDemoMode && supabaseConfigured;

export function isDemoMode() {
  if (!explicitDemoMode && !supabaseConfigured) {
    console.warn('Supabase keys are missing. Falling back to demo mode.');
  }

  return explicitDemoMode || !supabaseConfigured;
}

export function isMarketplaceConfigured(marketplaceId) {
  const config = marketplaceConfig[marketplaceId];
  return Boolean(config?.clientId && config?.redirectUri);
}

export function getMissingMarketplaceKeys() {
  return Object.entries(marketplaceConfig)
    .filter(([, config]) => !config.clientId || !config.redirectUri)
    .map(([id, config]) => ({ id, label: config.label }));
}

export const demoMode = isDemoMode();
