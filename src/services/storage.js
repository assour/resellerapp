import { demoActivity, demoConnections, demoProducts, demoUser } from '../data/mockData';

const keys = {
  products: 'rcc.products',
  connections: 'rcc.connections',
  activity: 'rcc.activity',
  settings: 'rcc.settings',
  user: 'rcc.user'
};

const defaults = {
  [keys.products]: demoProducts,
  [keys.connections]: demoConnections,
  [keys.activity]: demoActivity,
  [keys.settings]: { demoModeAcknowledged: true },
  [keys.user]: demoUser
};

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaults[key]));
      return structuredClone(defaults[key]);
    }
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Could not read ${key}; using demo defaults.`, error);
    return structuredClone(defaults[key]);
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

export const demoStore = {
  getProducts: () => read(keys.products),
  setProducts: (products) => write(keys.products, products),
  getConnections: () => read(keys.connections),
  setConnections: (connections) => write(keys.connections, connections),
  getActivity: () => read(keys.activity),
  addActivity: (message, type = 'info') => {
    const activity = read(keys.activity);
    const entry = { id: `act-${Date.now()}`, message, date: new Date().toISOString(), type };
    return write(keys.activity, [entry, ...activity].slice(0, 20));
  },
  getSettings: () => read(keys.settings),
  setSettings: (settings) => write(keys.settings, settings),
  getUser: () => read(keys.user),
  reset: () => {
    Object.entries(defaults).forEach(([key, value]) => localStorage.setItem(key, JSON.stringify(value)));
  }
};
