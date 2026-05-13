'use client';

import {
  AlertTriangle,
  Apple,
  ArrowRight,
  BarChart3,
  Boxes,
  Calculator,
  CheckCircle2,
  ClipboardList,
  Copy,
  CreditCard,
  DollarSign,
  ExternalLink,
  Facebook,
  FilePlus2,
  FileSpreadsheet,
  Gauge,
  Github,
  Globe2,
  ImagePlus,
  Link2,
  MapPin,
  Loader2,
  LockKeyhole,
  LogOut,
  Menu,
  PackageCheck,
  PackagePlus,
  ReceiptText,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Tags,
  TrendingUp,
  Unlink,
  UploadCloud,
  Wand2,
  X
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { AuthProvider } from '@/auth/AuthProvider';
import { validateMarketplaceCredentials } from '@/lib/environment';
import { generateDescription, suggestPrice } from '@/lib/listingHelpers';
import { getMarketplaceMeta, marketplaceMeta, marketplaceName } from '@/lib/marketplaces';
import {
  autoSyncMarketplaces,
  demoImportRows,
  estimateListingFee,
  expectedCsvColumns,
  generateHashtags,
  generateMockTitle,
  generateSeoKeywords,
  getMarketplaceMissingFields,
  isManualOnlyMarketplace,
  listingTemplates
} from '@/lib/resellerFeatures';
import { StoreProvider, useResellSync } from '@/lib/store';
import { analyticsService } from '@/services/analyticsService';
import { inventoryService } from '@/services/inventoryService';
import type { Listing, ListingFormInput, MarketplaceId, MarketplaceListing, SyncIssueStatus } from '@/lib/types';
import { money, shortDate, statusTone } from '@/lib/utils';

type PageId = 'dashboard' | 'connections' | 'create' | 'listings' | 'sync' | 'bulkImport' | 'checkout' | 'orders' | 'analytics' | 'inventory' | 'activity' | 'settings';

interface RealProviderStatus {
  id: MarketplaceId;
  name: string;
  mode: 'oauth' | 'partner' | 'manual';
  configured: boolean;
  tokenConnected: boolean;
  missingEnv: string[];
  scopes: string[];
  docsUrl: string;
  approvalUrl: string;
  approvalNote: string;
  startUrl: string | null;
}

const navItems: Array<{ id: PageId; label: string; icon: typeof Gauge }> = [
  { id: 'dashboard', label: 'Dashboard', icon: Gauge },
  { id: 'connections', label: 'Connect Accounts', icon: Link2 },
  { id: 'create', label: 'Create Listing', icon: FilePlus2 },
  { id: 'listings', label: 'Listings', icon: Store },
  { id: 'sync', label: 'Sync Status', icon: AlertTriangle },
  { id: 'bulkImport', label: 'Bulk Import', icon: FileSpreadsheet },
  { id: 'checkout', label: 'Demo Checkout', icon: CreditCard },
  { id: 'orders', label: 'Orders', icon: ReceiptText },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'activity', label: 'Activity Log', icon: ClipboardList },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export function ResellSyncApp() {
  return (
    <AuthProvider>
      <StoreProvider>
        <AppShell />
      </StoreProvider>
    </AuthProvider>
  );
}

function AppShell() {
  const store = useResellSync();
  const [page, setPage] = useState<PageId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!store.user) return <LoginPage />;

  return (
    <div className="min-h-screen bg-cloud text-ink">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        {sidebarOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-ink/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <aside className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-ink p-4 text-white transition-transform lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-auto lg:translate-x-0 lg:overflow-y-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="mb-6 flex items-center gap-3 px-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber text-lg font-black text-ink">R</div>
            <div>
              <p className="text-lg font-black leading-tight">ResellSync</p>
              <p className="text-xs font-semibold text-slate-300">Cross-listing command center</p>
            </div>
          </div>
          <nav className="grid gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = page === item.id;
              return (
                <button
                  key={item.id}
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold transition ${
                    active ? 'bg-white text-ink' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => {
                    setPage(item.id);
                    setSidebarOpen(false);
                  }}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-black">Demo Mode</p>
            <p className="mt-1 text-xs leading-5 text-slate-300">
              OAuth, payments, sync, and marketplace APIs are sandboxed. The UI behaves like production without real credentials.
            </p>
          </div>
        </aside>

        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          <header className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-3">
                <button className="btn-secondary px-3 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={18} /></button>
                <div>
                  <p className="text-sm font-bold text-slate-500">Welcome back, {store.user.name}</p>
                  <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{navItems.find((item) => item.id === page)?.label}</h1>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge bg-emerald-100 text-emerald-700"><ShieldCheck size={14} /> Demo secure</span>
              <span className="badge bg-amber-100 text-amber-700">{store.notifications.filter((notification) => !notification.read).length} alerts</span>
              <button className="btn-secondary" onClick={store.logout}><LogOut size={16} /> Sign out</button>
            </div>
          </header>

          {!store.ready && <SkeletonGrid />}
          {store.toast && <Toast />}
          {store.loading && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-mint px-4 py-3 text-sm font-bold text-emerald-800">
              <Loader2 className="animate-spin" size={18} /> Syncing marketplace sandbox...
            </div>
          )}

          {page === 'dashboard' && <DashboardPage onNavigate={setPage} />}
          {page === 'connections' && <ConnectionsPage />}
          {page === 'create' && <CreateListingPage onPublished={() => setPage('listings')} />}
          {page === 'listings' && <ListingsPage />}
          {page === 'sync' && <SyncStatusPage />}
          {page === 'bulkImport' && <BulkImportPage />}
          {page === 'checkout' && <CheckoutPage />}
          {page === 'orders' && <OrdersPage />}
          {page === 'analytics' && <AnalyticsPage />}
          {page === 'inventory' && <InventoryPage />}
          {page === 'activity' && <ActivityLogPage />}
          {page === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

function LoginPage() {
  const store = useResellSync();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('Demo Reseller');
  const [email, setEmail] = useState('demo@resellsync.app');
  const [password, setPassword] = useState('demo1234');

  function submit(event: FormEvent) {
    event.preventDefault();
    if (mode === 'signup') store.signUp(name, email);
    else store.loginWithPassword(email);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e6f5ef,transparent_34%),linear-gradient(135deg,#101820,#173b34)] p-4 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_.9fr]">
        <section>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm font-bold backdrop-blur">
            <Sparkles size={16} /> Startup-quality reseller demo
          </div>
          <h1 className="max-w-2xl text-5xl font-black tracking-tight sm:text-6xl">List once. Sell anywhere. Sync instantly.</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-200">
            ResellSync is a polished MVP demo for cross-posting inventory, simulating marketplace OAuth, running fake checkout, and auto-deactivating sold listings.
          </p>
          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            {['7 marketplaces', 'DemoPay checkout', 'Auto delist logic'].map((item) => (
              <div key={item} className="rounded-xl border border-white/15 bg-white/10 p-4 font-black backdrop-blur">{item}</div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/20 bg-white p-5 text-ink shadow-soft">
          <div className="mb-4 flex rounded-xl bg-slate-100 p-1">
            <button className={`min-h-10 flex-1 rounded-lg text-sm font-black ${mode === 'login' ? 'bg-white shadow' : ''}`} onClick={() => setMode('login')}>Log in</button>
            <button className={`min-h-10 flex-1 rounded-lg text-sm font-black ${mode === 'signup' ? 'bg-white shadow' : ''}`} onClick={() => setMode('signup')}>Sign up</button>
          </div>
          <form className="grid gap-3" onSubmit={submit}>
            {mode === 'signup' && <label className="label">Name<input className="field" value={name} onChange={(event) => setName(event.target.value)} /></label>}
            <label className="label">Email<input className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label className="label">Password<input className="field" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            <button className="btn-primary w-full" type="submit"><LockKeyhole size={16} /> {mode === 'signup' ? 'Create account' : 'Log in'}</button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs font-bold text-slate-400">
            <span className="h-px flex-1 bg-slate-200" /> or continue with <span className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <button className="btn-secondary" onClick={() => store.mockSocialLogin('Google')}><Github size={16} /> Google</button>
            <button className="btn-secondary" onClick={() => store.mockSocialLogin('Facebook')}><Facebook size={16} /> Facebook</button>
            <button className="btn-secondary" onClick={() => store.mockSocialLogin('Apple')}><Apple size={16} /> Apple</button>
          </div>
          <button className="btn-primary mt-3 w-full bg-coral hover:bg-rose-700" onClick={store.loginDemo}>
            <Sparkles size={16} /> Demo login
          </button>
          <p className="mt-4 text-center text-xs font-semibold text-slate-500">Demo credentials: demo@resellsync.app / demo1234</p>
        </section>
      </div>
    </div>
  );
}

function DashboardPage({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const store = useResellSync();
  const metrics = analyticsService.dashboard(store);
  const pendingTasks = store.syncLogs.filter((log) => log.level === 'warning' || log.level === 'info').length;
  const lowInventoryItems = inventoryService.getLowStockItems(store.inventoryItems);
  const failedSyncs = store.syncIssues.filter((issue) => issue.status === 'failed').length;
  const manualActions = store.syncIssues.filter((issue) => issue.status === 'manual_required').length;
  const unreadNotifications = store.notifications.filter((notification) => !notification.read);

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric title="Active listings" value={metrics.activeListings.toString()} icon={Store} />
        <Metric title="Sold items" value={metrics.soldItems.toString()} icon={PackageCheck} />
        <Metric title="Revenue" value={money(metrics.revenue)} icon={DollarSign} />
        <Metric title="Connected" value={`${metrics.connected}/7`} icon={Globe2} />
        <Metric title="Pending sync" value={pendingTasks.toString()} icon={RefreshCcw} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <section className="card p-5">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-black">Marketplace health</h2>
              <p className="text-sm font-semibold text-slate-500">Mock OAuth status, last sync, and adapter readiness.</p>
            </div>
            <button className="btn-primary" onClick={() => onNavigate('create')}><PackagePlus size={16} /> Create listing</button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {store.marketplaceAccounts.map((account) => (
              <div key={account.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black">{account.name}</p>
                    <p className="text-xs font-bold text-slate-500">Last sync: {shortDate(account.lastSyncedAt)}</p>
                  </div>
                  <StatusBadge active={account.connected} label={account.connected ? 'Connected' : 'Disconnected'} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-xl font-black">Alerts</h2>
          <div className="mt-4 grid gap-3">
            <AlertLine tone="warning" title="Low inventory" value={`${lowInventoryItems.length} item(s) at or below threshold`} />
            <AlertLine tone="warning" title="Sync attention" value={`${failedSyncs} failed sync(s), ${manualActions} manual channel action(s)`} />
            <AlertLine tone="info" title="Manual channels" value="Facebook, Mercari, and Poshmark are demo/manual-safe." />
            <AlertLine tone="success" title="Auto-delisting" value="Sold items deactivate on every other marketplace." />
          </div>
        </section>
      </div>

      {lowInventoryItems.length > 0 && (
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Low-stock watchlist</h2>
              <p className="text-sm font-semibold text-slate-500">Inventory locations make it easier to find and restock items quickly.</p>
            </div>
            <button className="btn-secondary" onClick={() => onNavigate('inventory')}><Boxes size={16} /> View inventory</button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {lowInventoryItems.slice(0, 3).map((item) => (
              <div key={item.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-black">{item.title}</p>
                <p className="mt-1 text-sm font-semibold text-slate-600">Qty {item.quantity} / threshold {item.lowStockThreshold}</p>
                <p className="mt-2 text-xs font-bold text-slate-500">SKU {item.sku} - Bin {item.bin} - Rack {item.rack} - Shelf {item.shelf}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card p-5">
        <h2 className="text-xl font-black">Recent sync log</h2>
        <div className="mt-4 grid gap-3">
          {store.syncLogs.length ? store.syncLogs.slice(0, 6).map((log) => (
            <div key={log.id} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
              <CheckCircle2 className={log.level === 'success' ? 'text-emerald-600' : 'text-amber-600'} size={18} />
              <div>
                <p className="text-sm font-bold">{log.message}</p>
                <p className="text-xs font-semibold text-slate-500">{shortDate(log.createdAt)}</p>
              </div>
            </div>
          )) : <EmptyState title="No sync history" message="Publish a listing to start filling the activity stream." />}
        </div>
      </section>

      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Notification center</h2>
            <p className="text-sm font-semibold text-slate-500">Sync completed, failed sync, low inventory, and sold item alerts.</p>
          </div>
          <span className="badge bg-amber-100 text-amber-700">{unreadNotifications.length} unread</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {store.notifications.length ? store.notifications.slice(0, 6).map((notification) => (
            <button
              key={notification.id}
              className={`rounded-xl border p-4 text-left transition hover:border-moss ${notification.read ? 'border-slate-200 bg-white' : 'border-amber-200 bg-amber-50'}`}
              onClick={() => store.markNotificationRead(notification.id)}
            >
              <span className={`badge ${notification.tone === 'success' ? 'bg-emerald-100 text-emerald-700' : notification.tone === 'warning' ? 'bg-amber-100 text-amber-700' : notification.tone === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>{notification.type.replace('_', ' ')}</span>
              <p className="mt-3 font-black">{notification.title}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{notification.message}</p>
              <p className="mt-2 text-xs font-bold text-slate-500">{shortDate(notification.createdAt)}</p>
            </button>
          )) : <EmptyState title="No notifications" message="Alerts will appear here after sync, sales, and inventory events." />}
        </div>
      </section>
    </div>
  );
}

function ConnectionsPage() {
  const store = useResellSync();
  const [oauthTarget, setOauthTarget] = useState<MarketplaceId | null>(null);
  const [realStatus, setRealStatus] = useState<RealProviderStatus[]>([]);
  const target = oauthTarget ? store.marketplaceAccounts.find((account) => account.id === oauthTarget) : null;

  useEffect(() => {
    fetch('/api/integrations/status?userId=demo')
      .then((response) => response.json())
      .then((payload: { providers?: RealProviderStatus[] }) => setRealStatus(payload.providers || []))
      .catch(() => setRealStatus([]));
  }, []);

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {store.marketplaceAccounts.map((account) => {
          const meta = getMarketplaceMeta(account.id);
          return (
            <section key={account.id} className="card flex flex-col justify-between p-5">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black">{account.name}</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{meta.productionNote}</p>
                  </div>
                  <span className={`badge border ${meta.color}`}>{meta.officialApiPath}</span>
                </div>
                <div className="mt-5 grid gap-2 text-sm font-semibold text-slate-600">
                  <p>Status: <strong className="text-ink">{account.status}</strong></p>
                  <p>Last synced: <strong className="text-ink">{shortDate(account.lastSyncedAt)}</strong></p>
                  <p>Token: <strong className="text-ink">{account.accessTokenPreview || 'Not connected'}</strong></p>
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                {account.connected ? (
                  <button className="btn-secondary flex-1" disabled={store.loading} onClick={() => store.disconnectMarketplace(account.id)}><Unlink size={16} /> Disconnect</button>
                ) : (
                  <button className="btn-primary flex-1" disabled={store.loading} onClick={() => setOauthTarget(account.id)}><Link2 size={16} /> Connect</button>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {target && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-4 backdrop-blur">
          <section className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-500">Mock OAuth authorization</p>
                <h2 className="text-2xl font-black">Connect {target.name}</h2>
              </div>
              <button className="btn-secondary px-3" onClick={() => setOauthTarget(null)}><X size={16} /></button>
            </div>
            <div className="my-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-black">ResellSync is requesting permission to:</p>
              <ul className="mt-3 grid gap-2 text-sm font-semibold text-slate-600">
                {target.permissions.map((permission) => <li key={permission}>- {permission}</li>)}
              </ul>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary flex-1" onClick={() => setOauthTarget(null)}>Cancel</button>
              <button
                className="btn-primary flex-1"
                disabled={store.loading}
                onClick={async () => {
                  await store.connectMarketplace(target.id);
                  setOauthTarget(null);
                }}
              >
                Authorize sandbox
              </button>
            </div>
          </section>
        </div>
      )}

      <section className="card p-5">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-black">Production API readiness</h2>
            <p className="text-sm font-semibold text-slate-500">Server-side OAuth and token storage are wired. Add approved credentials to turn these on.</p>
          </div>
          <a className="btn-secondary" href="/api/integrations/status?userId=demo" target="_blank">
            View API status
          </a>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {realStatus.map((provider) => (
            <div key={provider.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{provider.name}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{provider.approvalNote}</p>
                </div>
                <span className={`badge ${provider.tokenConnected ? 'bg-emerald-100 text-emerald-700' : provider.configured ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                  {provider.tokenConnected ? 'token stored' : provider.configured ? 'ready' : provider.mode}
                </span>
              </div>
              <div className="mt-3 text-xs font-semibold text-slate-500">
                {provider.missingEnv.length ? `Missing: ${provider.missingEnv.join(', ')}` : 'Required server credentials are present.'}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {provider.startUrl && (
                  <a className="btn-primary" href={provider.startUrl} target="_blank">
                    Start real OAuth
                  </a>
                )}
                <a className="btn-secondary" href={provider.docsUrl} target="_blank">
                  Official docs
                </a>
                <a className="btn-secondary" href={provider.approvalUrl} target="_blank">
                  Approval path
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function CreateListingPage({ onPublished }: { onPublished: () => void }) {
  const store = useResellSync();
  const [aiOutput, setAiOutput] = useState('Choose an AI helper action to generate demo copy.');
  const [form, setForm] = useState<ListingFormInput>({
    title: 'Carhartt Detroit Jacket',
    description: '',
    category: 'Outerwear',
    brand: 'Carhartt',
    size: 'M',
    condition: 'Very Good',
    price: 145,
    quantity: 1,
    shippingPrice: 10.95,
    cost: 48,
    sku: 'OUT-CARHARTT-DETROIT-M',
    bin: 'A08',
    rack: 'R2',
    shelf: 'S3',
    lowStockThreshold: 1,
    etsyClassification: '',
    marketplaceOverrides: [
      { marketplaceId: 'etsy', customCategory: 'Vintage Clothing' },
      { marketplaceId: 'facebook', excluded: false }
    ],
    images: [],
    marketplaces: ['ebay', 'depop', 'tiktok', 'etsy']
  });

  function update<Key extends keyof ListingFormInput>(key: Key, value: ListingFormInput[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleMarketplace(id: MarketplaceId) {
    setForm((current) => ({
      ...current,
      marketplaces: current.marketplaces.includes(id)
        ? current.marketplaces.filter((marketplaceId) => marketplaceId !== id)
        : [...current.marketplaces, id]
    }));
  }

  function updateMarketplaceOverride(
    marketplaceId: MarketplaceId,
    key: 'customTitle' | 'customPrice' | 'customCategory' | 'excluded',
    value: string | number | boolean
  ) {
    setForm((current) => {
      const existing = current.marketplaceOverrides.find((item) => item.marketplaceId === marketplaceId);
      const nextOverride = { marketplaceId, ...(existing || {}), [key]: value };
      return {
        ...current,
        marketplaceOverrides: existing
          ? current.marketplaceOverrides.map((item) => item.marketplaceId === marketplaceId ? nextOverride : item)
          : [...current.marketplaceOverrides, nextOverride]
      };
    });
  }

  async function submit(publish: boolean) {
    await store.createListing(form, publish);
    onPublished();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <section className="card p-5">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-black">Create once, cross-post everywhere</h2>
            <p className="text-sm font-semibold text-slate-500">Templates, AI helper actions, location fields, and sync preview are wired.</p>
          </div>
          <button className="btn-secondary" onClick={() => update('description', generateDescription(form))}><Wand2 size={16} /> Quick description</button>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-4">
          {[
            ['1', 'Photos'],
            ['2', 'AI suggestions'],
            ['3', 'Item details'],
            ['4', 'Preview sync']
          ].map(([step, label]) => (
            <div key={step} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <span className="badge bg-mint text-moss">Step {step}</span>
              <p className="mt-2 text-sm font-black">{label}</p>
            </div>
          ))}
        </div>

        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Copy size={18} className="text-moss" />
            <p className="font-black">Start from a template</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {listingTemplates.map((template) => (
              <button
                key={template.name}
                className="rounded-lg border border-slate-200 bg-white p-3 text-left text-sm transition hover:border-moss hover:bg-mint"
                onClick={() => setForm((current) => ({ ...current, ...template.values }))}
              >
                <span className="font-black">{template.name}</span>
                <span className="mt-1 block text-xs font-semibold text-slate-500">{template.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="label">Title<input className="field" value={form.title} onChange={(event) => update('title', event.target.value)} /></label>
          <label className="label">Brand<input className="field" value={form.brand} onChange={(event) => update('brand', event.target.value)} /></label>
          <label className="label">Category<input className="field" value={form.category} onChange={(event) => update('category', event.target.value)} /></label>
          <label className="label">Size<input className="field" value={form.size} onChange={(event) => update('size', event.target.value)} /></label>
          <label className="label">Condition<select className="field" value={form.condition} onChange={(event) => update('condition', event.target.value)}><option>New</option><option>Excellent</option><option>Very Good</option><option>Good</option><option>Fair</option></select></label>
          <label className="label">Etsy classification<select className="field" value={form.etsyClassification} onChange={(event) => update('etsyClassification', event.target.value)}><option value="">Needs classification</option><option value="handmade">Handmade</option><option value="vintage">Vintage</option><option value="supply">Craft supply</option></select></label>
          <label className="label">Price<input className="field" type="number" value={form.price} onChange={(event) => update('price', Number(event.target.value))} /></label>
          <label className="label">Quantity<input className="field" type="number" value={form.quantity} onChange={(event) => update('quantity', Number(event.target.value))} /></label>
          <label className="label">Shipping price<input className="field" type="number" value={form.shippingPrice} onChange={(event) => update('shippingPrice', Number(event.target.value))} /></label>
          <label className="label">Cost<input className="field" type="number" value={form.cost} onChange={(event) => update('cost', Number(event.target.value))} /></label>
          <label className="label">SKU<input className="field" value={form.sku} onChange={(event) => update('sku', event.target.value)} /></label>
          <label className="label">Low-stock threshold<input className="field" type="number" value={form.lowStockThreshold} onChange={(event) => update('lowStockThreshold', Number(event.target.value))} /></label>
          <label className="label">Bin<input className="field" value={form.bin} onChange={(event) => update('bin', event.target.value)} /></label>
          <label className="label">Rack<input className="field" value={form.rack} onChange={(event) => update('rack', event.target.value)} /></label>
          <label className="label">Shelf<input className="field" value={form.shelf} onChange={(event) => update('shelf', event.target.value)} /></label>
          <label className="label lg:col-span-2">Description<textarea className="field min-h-32" value={form.description} onChange={(event) => update('description', event.target.value)} /></label>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
          <div className="flex items-center gap-3">
            <ImagePlus className="text-moss" />
            <div>
              <p className="font-black">Mock upload</p>
              <p className="text-sm font-semibold text-slate-500">{form.images.length ? `${form.images.length} image name(s) staged` : 'Choose files to stage image names for the demo.'}</p>
            </div>
          </div>
          <input className="mt-4 block text-sm font-semibold" type="file" accept="image/*" multiple onChange={(event) => update('images', Array.from(event.target.files || []).map((file) => file.name))} />
        </div>

        <div className="mt-5">
          <p className="mb-3 text-sm font-black text-slate-700">Marketplaces</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {marketplaceMeta.map((marketplace) => (
              <label key={marketplace.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold">
                <input type="checkbox" checked={form.marketplaces.includes(marketplace.id)} onChange={() => toggleMarketplace(marketplace.id)} />
                <span>
                  {marketplace.name}
                  {isManualOnlyMarketplace(marketplace.id) && <span className="block text-xs font-bold text-orange-600">manual-safe</span>}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Globe2 size={18} className="text-moss" />
            <p className="font-black">Marketplace overrides</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="label">eBay custom title<input className="field" value={form.marketplaceOverrides.find((item) => item.marketplaceId === 'ebay')?.customTitle || ''} onChange={(event) => updateMarketplaceOverride('ebay', 'customTitle', event.target.value)} /></label>
            <label className="label">Etsy custom category<input className="field" value={form.marketplaceOverrides.find((item) => item.marketplaceId === 'etsy')?.customCategory || ''} onChange={(event) => updateMarketplaceOverride('etsy', 'customCategory', event.target.value)} /></label>
            <label className="label">Depop custom price<input className="field" type="number" value={form.marketplaceOverrides.find((item) => item.marketplaceId === 'depop')?.customPrice || ''} onChange={(event) => updateMarketplaceOverride('depop', 'customPrice', Number(event.target.value))} /></label>
            <label className="flex items-center gap-3 rounded-lg bg-white p-3 text-sm font-bold">
              <input type="checkbox" checked={Boolean(form.marketplaceOverrides.find((item) => item.marketplaceId === 'etsy')?.excluded)} onChange={(event) => updateMarketplaceOverride('etsy', 'excluded', event.target.checked)} />
              Exclude Etsy for this listing
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button className="btn-secondary" disabled={store.loading} onClick={() => submit(false)}>Save draft</button>
        </div>
      </section>

      <aside className="grid content-start gap-5">
        <AIListingHelper form={form} update={update} aiOutput={aiOutput} setAiOutput={setAiOutput} />
        <ProfitCalculator form={form} />
        <SyncPreview form={form} onPublish={() => submit(true)} />
      </aside>
    </div>
  );
}

function AIListingHelper({
  form,
  update,
  aiOutput,
  setAiOutput
}: {
  form: ListingFormInput;
  update: <Key extends keyof ListingFormInput>(key: Key, value: ListingFormInput[Key]) => void;
  aiOutput: string;
  setAiOutput: (value: string) => void;
}) {
  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="text-moss" size={20} />
        <div>
          <h2 className="text-xl font-black">AI listing helper</h2>
          <p className="text-sm font-semibold text-slate-500">Mock generation tools for faster listing prep.</p>
        </div>
      </div>
      <div className="grid gap-2">
        <button
          className="btn-secondary justify-start"
          onClick={() => {
            const title = generateMockTitle(form);
            update('title', title);
            setAiOutput(`Generated title: ${title}`);
          }}
        >
          <Tags size={16} /> Generate title
        </button>
        <button
          className="btn-secondary justify-start"
          onClick={() => {
            const description = generateDescription(form);
            update('description', description);
            setAiOutput('Generated a buyer-friendly description with condition and resale keywords.');
          }}
        >
          <Wand2 size={16} /> Generate description
        </button>
        <button
          className="btn-secondary justify-start"
          onClick={() => {
            const price = suggestPrice(form);
            update('price', price);
            setAiOutput(`Suggested price: ${money(price)} based on brand, category, and condition.`);
          }}
        >
          <DollarSign size={16} /> Suggest price
        </button>
        <button className="btn-secondary justify-start" onClick={() => setAiOutput(generateHashtags(form))}>
          <Sparkles size={16} /> Suggest hashtags
        </button>
        <button className="btn-secondary justify-start" onClick={() => setAiOutput(generateSeoKeywords(form))}>
          <Search size={16} /> Improve SEO keywords
        </button>
      </div>
      <div className="mt-4 rounded-xl bg-mint p-4 text-sm font-bold text-emerald-900">{aiOutput}</div>
    </section>
  );
}

function ProfitCalculator({ form }: { form: ListingFormInput }) {
  const [salePrice, setSalePrice] = useState(form.price);
  const [cost, setCost] = useState(form.cost);
  const [shippingCost, setShippingCost] = useState(7.5);
  const [feePercent, setFeePercent] = useState(13.25);
  const [adFee, setAdFee] = useState(0);

  useEffect(() => {
    setSalePrice(form.price);
    setCost(form.cost);
  }, [form.price, form.cost]);

  const marketplaceFees = salePrice * (feePercent / 100);
  const netProfit = salePrice - cost - shippingCost - marketplaceFees - adFee;
  const margin = salePrice > 0 ? (netProfit / salePrice) * 100 : 0;

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Calculator className="text-moss" size={20} />
        <div>
          <h2 className="text-xl font-black">Profit calculator</h2>
          <p className="text-sm font-semibold text-slate-500">Live estimate before you publish.</p>
        </div>
      </div>
      <div className="grid gap-3">
        <label className="label">Sale price<input className="field" type="number" value={salePrice} onChange={(event) => setSalePrice(Number(event.target.value))} /></label>
        <label className="label">Cost of goods<input className="field" type="number" value={cost} onChange={(event) => setCost(Number(event.target.value))} /></label>
        <label className="label">Shipping cost<input className="field" type="number" value={shippingCost} onChange={(event) => setShippingCost(Number(event.target.value))} /></label>
        <label className="label">Marketplace fee %<input className="field" type="number" value={feePercent} onChange={(event) => setFeePercent(Number(event.target.value))} /></label>
        <label className="label">Promoted/ad fee<input className="field" type="number" value={adFee} onChange={(event) => setAdFee(Number(event.target.value))} /></label>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase text-slate-500">Net profit</p>
          <p className={`mt-1 text-2xl font-black ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{money(netProfit)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase text-slate-500">Margin</p>
          <p className={`mt-1 text-2xl font-black ${margin >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{Math.round(margin)}%</p>
        </div>
      </div>
    </section>
  );
}

function SyncPreview({ form, onPublish }: { form: ListingFormInput; onPublish: () => void }) {
  const store = useResellSync();
  const selected = form.marketplaces;
  const autoSelected = selected.filter((id) => autoSyncMarketplaces.includes(id) && !isManualOnlyMarketplace(id));
  const manualSelected = selected.filter(isManualOnlyMarketplace);
  const readyAuto = autoSelected.filter((id) => getMarketplaceMissingFields(form, id).length === 0);

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center gap-2">
        <RefreshCcw className="text-moss" size={20} />
        <div>
          <h2 className="text-xl font-black">Sync preview</h2>
          <p className="text-sm font-semibold text-slate-500">Review supported automation before publishing.</p>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="rounded-xl border border-emerald-200 bg-mint p-4">
          <p className="font-black">Auto-synced</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">{autoSelected.length ? autoSelected.map(marketplaceName).join(', ') : 'No supported auto-sync channels selected.'}</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
          <p className="font-black">Manual-only</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">{manualSelected.length ? manualSelected.map(marketplaceName).join(', ') : 'No manual channels selected.'}</p>
          <p className="mt-2 text-xs font-bold text-orange-700">Facebook Marketplace, Mercari, and Poshmark stay manual-safe unless official API access exists.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {selected.map((id) => {
          const missing = getMarketplaceMissingFields(form, id);
          return (
            <div key={id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-black">{marketplaceName(id)}</p>
                <span className={`badge ${isManualOnlyMarketplace(id) ? 'bg-orange-100 text-orange-700' : missing.length ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {isManualOnlyMarketplace(id) ? 'Manual Required' : missing.length ? 'Needs fields' : 'Ready'}
                </span>
              </div>
              <p className="mt-2 text-xs font-bold text-slate-500">
                Fee estimate: {money(estimateListingFee(form.price, id))}
              </p>
              {missing.length > 0 && <p className="mt-1 text-xs font-bold text-rose-600">Missing: {missing.join(', ')}</p>}
            </div>
          );
        })}
      </div>

      <button className="btn-primary mt-5 w-full" disabled={!readyAuto.length || store.loading} onClick={onPublish}>
        Publish to supported marketplaces <ArrowRight size={16} />
      </button>
      <p className="mt-2 text-center text-xs font-semibold text-slate-500">{readyAuto.length} auto-sync channel(s) ready; manual channels become export tasks.</p>
    </section>
  );
}

function ListingsPage() {
  const store = useResellSync();
  const [query, setQuery] = useState('');
  const rows = store.marketplaceListings
    .map((marketplaceListing) => ({
      marketplaceListing,
      listing: store.listings.find((listing) => listing.id === marketplaceListing.listingId)
    }))
    .filter((row): row is { marketplaceListing: MarketplaceListing; listing: Listing } => Boolean(row.listing))
    .filter((row) => row.listing.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <section className="card p-5">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-xl font-black">Marketplace listings</h2>
        <div className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-3">
          <Search size={16} />
          <input className="outline-none" placeholder="Search listings" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="border-t border-slate-200 py-3">Product</th>
              <th className="border-t border-slate-200 py-3">Marketplace</th>
              <th className="border-t border-slate-200 py-3">Status</th>
              <th className="border-t border-slate-200 py-3">Price</th>
              <th className="border-t border-slate-200 py-3">Last sync</th>
              <th className="border-t border-slate-200 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ marketplaceListing, listing }) => (
              <tr key={marketplaceListing.id}>
                <td className="border-t border-slate-200 py-3 font-black">{listing.title}</td>
                <td className="border-t border-slate-200 py-3">{marketplaceName(marketplaceListing.marketplaceId)}</td>
                <td className="border-t border-slate-200 py-3"><span className={`badge ${statusTone(marketplaceListing.status)}`}>{marketplaceListing.status}</span></td>
                <td className="border-t border-slate-200 py-3">{money(listing.price)}</td>
                <td className="border-t border-slate-200 py-3">{shortDate(marketplaceListing.lastSyncedAt)}</td>
                <td className="border-t border-slate-200 py-3">
                  <div className="flex gap-2">
                    <a className="btn-secondary" href={marketplaceListing.url} target="_blank"><ExternalLink size={14} /> View</a>
                    <button className="btn-secondary" disabled={store.loading} onClick={() => store.duplicateListing(listing.id)}><Copy size={14} /> Duplicate</button>
                    {marketplaceListing.status === 'listed' && (
                      <button className="btn-primary" disabled={store.loading} onClick={() => store.markListingSold(listing.id, marketplaceListing.marketplaceId)}>Mark sold</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <div className="mt-4"><EmptyState title="No listings found" message="Create or publish a listing to populate marketplace rows." /></div>}
      </div>
    </section>
  );
}

function SyncStatusPage() {
  const store = useResellSync();
  const counts = {
    success: store.syncIssues.filter((issue) => issue.status === 'success').length,
    failed: store.syncIssues.filter((issue) => issue.status === 'failed').length,
    pending: store.syncIssues.filter((issue) => issue.status === 'pending').length,
    manual_required: store.syncIssues.filter((issue) => issue.status === 'manual_required').length
  };

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Success" value={counts.success.toString()} icon={CheckCircle2} />
        <Metric title="Failed" value={counts.failed.toString()} icon={AlertTriangle} />
        <Metric title="Pending" value={counts.pending.toString()} icon={RefreshCcw} />
        <Metric title="Manual required" value={counts.manual_required.toString()} icon={ClipboardList} />
      </div>

      <section className="card p-5">
        <h2 className="text-xl font-black">Sync queue</h2>
        <div className="mt-4 grid gap-3">
          {store.syncQueue.length ? store.syncQueue.slice(0, 8).map((job) => (
            <div key={job.id} className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[150px_150px_1fr_120px] md:items-center">
              <p className="font-black">{marketplaceName(job.marketplaceId)}</p>
              <span className={`badge justify-center ${job.status === 'succeeded' ? 'bg-emerald-100 text-emerald-700' : job.status === 'failed' ? 'bg-rose-100 text-rose-700' : job.status === 'manual_required' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{job.status.replace('_', ' ')}</span>
              <div>
                <p className="text-sm font-bold">{job.action.replace('_', ' ')} - {job.listingTitle}</p>
                <p className="text-xs font-semibold text-slate-500">{job.error || job.resultMessage || `Attempt ${job.attempt}/${job.maxAttempts}`}</p>
              </div>
              <p className="text-xs font-bold text-slate-500">{shortDate(job.updatedAt)}</p>
            </div>
          )) : <EmptyState title="No sync jobs" message="Queue activity appears when listings publish, retry, or auto-delist." />}
        </div>
      </section>

      <section className="card p-5">
        <div className="mb-4">
          <h2 className="text-xl font-black">Error Center</h2>
          <p className="text-sm font-semibold text-slate-500">Marketplace sync attempts, suggested fixes, and manual-safe channels.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="border-t border-slate-200 py-3">Marketplace</th>
                <th className="border-t border-slate-200 py-3">Listing</th>
                <th className="border-t border-slate-200 py-3">Status</th>
                <th className="border-t border-slate-200 py-3">Reason</th>
                <th className="border-t border-slate-200 py-3">Suggested fix</th>
                <th className="border-t border-slate-200 py-3">Updated</th>
                <th className="border-t border-slate-200 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {store.syncIssues.map((issue) => (
                <tr key={issue.id}>
                  <td className="border-t border-slate-200 py-3 font-black">{marketplaceName(issue.marketplaceId)}</td>
                  <td className="border-t border-slate-200 py-3">{issue.listingTitle}</td>
                  <td className="border-t border-slate-200 py-3"><SyncIssueBadge status={issue.status} /></td>
                  <td className="border-t border-slate-200 py-3">{issue.errorReason}</td>
                  <td className="border-t border-slate-200 py-3">{issue.suggestedFix}</td>
                  <td className="border-t border-slate-200 py-3">{shortDate(issue.updatedAt)}</td>
                  <td className="border-t border-slate-200 py-3">
                    <button className="btn-secondary" disabled={store.loading || issue.status === 'success'} onClick={() => store.retrySyncIssue(issue.id)}>
                      <RefreshCcw size={14} /> Retry
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!store.syncIssues.length && <div className="mt-4"><EmptyState title="No sync issues" message="Failed sync attempts and manual actions will appear here." /></div>}
        </div>
      </section>
    </div>
  );
}

function BulkImportPage() {
  const [uploaded, setUploaded] = useState(false);
  const [mapping, setMapping] = useState<Record<string, string>>({
    title: 'title',
    price: 'price',
    brand: 'brand',
    size: 'size',
    condition: 'condition',
    sku: 'sku',
    quantity: 'quantity',
    cost: 'cost'
  });

  return (
    <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
      <section className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <UploadCloud className="text-moss" size={22} />
          <div>
            <h2 className="text-xl font-black">Bulk import CSV</h2>
            <p className="text-sm font-semibold text-slate-500">Demo upload flow with sample rows and column mapping.</p>
          </div>
        </div>
        <label className="grid cursor-pointer place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-moss hover:bg-mint">
          <UploadCloud className="mb-3 text-moss" size={34} />
          <span className="font-black">Drop a CSV or choose a file</span>
          <span className="mt-1 text-sm font-semibold text-slate-500">The demo will load realistic sample rows.</span>
          <input className="sr-only" type="file" accept=".csv,text/csv" onChange={() => setUploaded(true)} />
        </label>
        <button className="btn-primary mt-4 w-full" onClick={() => setUploaded(true)}>
          Load demo CSV
        </button>
        <div className="mt-5 rounded-xl border border-slate-200 p-4">
          <p className="font-black">Expected columns</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {expectedCsvColumns.map((column) => <span key={column} className="badge bg-slate-100 text-slate-700">{column}</span>)}
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-black">Column mapping</h2>
        <p className="text-sm font-semibold text-slate-500">Map imported columns before creating inventory drafts.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {expectedCsvColumns.map((field) => (
            <label key={field} className="label capitalize">
              {field}
              <select className="field" value={mapping[field]} onChange={(event) => setMapping((current) => ({ ...current, [field]: event.target.value }))}>
                {expectedCsvColumns.map((column) => <option key={column} value={column}>{column}</option>)}
              </select>
            </label>
          ))}
        </div>

        <div className="mt-5 overflow-x-auto">
          {uploaded ? (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>{expectedCsvColumns.map((column) => <th key={column} className="border-t border-slate-200 py-3">{column}</th>)}</tr>
              </thead>
              <tbody>
                {demoImportRows.map((row) => (
                  <tr key={row.sku}>
                    {expectedCsvColumns.map((column) => <td key={column} className="border-t border-slate-200 py-3">{row[column as keyof typeof row]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="No CSV loaded" message="Use the demo upload to preview imported rows and mapping." />
          )}
        </div>
      </section>
    </div>
  );
}

function CheckoutPage() {
  const store = useResellSync();
  const activeRows = store.marketplaceListings
    .filter((marketplaceListing) => marketplaceListing.status === 'listed')
    .map((marketplaceListing) => ({ marketplaceListing, listing: store.listings.find((listing) => listing.id === marketplaceListing.listingId) }))
    .filter((row): row is { marketplaceListing: MarketplaceListing; listing: Listing } => Boolean(row.listing));
  const [selected, setSelected] = useState(activeRows[0]?.marketplaceListing.id || '');
  const [buyerName, setBuyerName] = useState('Jordan Buyer');
  const selectedRow = activeRows.find((row) => row.marketplaceListing.id === selected) || activeRows[0];

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <section className="card p-5">
        <h2 className="text-xl font-black">Buyer storefront</h2>
        <p className="mb-4 text-sm font-semibold text-slate-500">Pick an active listing and run a fake buyer checkout.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {activeRows.map(({ marketplaceListing, listing }) => (
            <button
              key={marketplaceListing.id}
              className={`rounded-xl border p-4 text-left transition hover:border-moss ${selected === marketplaceListing.id ? 'border-moss bg-mint' : 'border-slate-200 bg-white'}`}
              onClick={() => setSelected(marketplaceListing.id)}
            >
              <p className="font-black">{listing.title}</p>
              <p className="text-sm font-semibold text-slate-500">{marketplaceName(marketplaceListing.marketplaceId)} - {money(listing.price)}</p>
            </button>
          ))}
        </div>
      </section>
      <section className="card p-5">
        <h2 className="text-xl font-black">Checkout</h2>
        {selectedRow ? (
          <div className="mt-4 grid gap-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="font-black">{selectedRow.listing.title}</p>
              <p className="text-sm font-semibold text-slate-500">{marketplaceName(selectedRow.marketplaceListing.marketplaceId)}</p>
              <div className="mt-3 flex justify-between font-black"><span>Total</span><span>{money(selectedRow.listing.price + selectedRow.listing.shippingPrice)}</span></div>
            </div>
            <label className="label">Buyer name<input className="field" value={buyerName} onChange={(event) => setBuyerName(event.target.value)} /></label>
            <label className="label">Fake card<input className="field" value="4242 4242 4242 4242" readOnly /></label>
            <div className="grid grid-cols-2 gap-3">
              <input className="field" value="12/34" readOnly />
              <input className="field" value="123" readOnly />
            </div>
            <button className="btn-primary w-full" disabled={store.loading} onClick={() => store.demoCheckout(selectedRow.listing.id, selectedRow.marketplaceListing.marketplaceId, buyerName)}>
              <CreditCard size={16} /> Demo Pay
            </button>
            <p className="text-xs font-semibold text-slate-500">Stripe Test Mode Ready: replace DemoPay with a server-created Stripe Checkout Session when credentials are available.</p>
          </div>
        ) : (
          <EmptyState title="No active listings" message="Publish a listing first, then come back to run checkout." />
        )}
      </section>
    </div>
  );
}

function OrdersPage() {
  const store = useResellSync();
  return (
    <section className="card p-5">
      <h2 className="text-xl font-black">Orders</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr><th className="border-t py-3">Buyer</th><th className="border-t py-3">Marketplace</th><th className="border-t py-3">Product</th><th className="border-t py-3">Sale</th><th className="border-t py-3">Fees</th><th className="border-t py-3">Net profit</th><th className="border-t py-3">Shipping</th><th className="border-t py-3">Status</th><th className="border-t py-3">Date</th></tr>
          </thead>
          <tbody>
            {store.orders.map((order) => (
              <tr key={order.id}>
                <td className="border-t py-3 font-black">{order.buyerName}</td>
                <td className="border-t py-3">{marketplaceName(order.marketplaceId)}</td>
                <td className="border-t py-3">{order.productTitle}</td>
                <td className="border-t py-3">{money(order.salePrice)}</td>
                <td className="border-t py-3">{money(order.fees)}</td>
                <td className="border-t py-3 font-black text-emerald-700">{money(order.netProfit)}</td>
                <td className="border-t py-3">{order.shippingStatus.replace('_', ' ')}</td>
                <td className="border-t py-3"><span className="badge bg-emerald-100 text-emerald-700">{order.orderStatus}</span></td>
                <td className="border-t py-3">{shortDate(order.soldAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!store.orders.length && <div className="mt-4"><EmptyState title="No orders yet" message="Use Demo Checkout or mark a listing sold to create orders." /></div>}
      </div>
    </section>
  );
}

function AnalyticsPage() {
  const store = useResellSync();
  const analytics = analyticsService.advanced(store);
  const byMarketplace = analytics.byMarketplace;
  const maxRevenue = Math.max(1, ...byMarketplace.map((item) => item.revenue));
  const maxTrend = Math.max(1, ...analytics.revenueTrend.map((item) => item.value));

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric title="Revenue" value={money(analytics.revenue)} icon={TrendingUp} />
        <Metric title="Average sale" value={money(analytics.avgSale)} icon={DollarSign} />
        <Metric title="Sell-through" value={`${analytics.sellThrough}%`} icon={Gauge} />
        <Metric title="Stale inventory" value={analytics.staleInventory.toString()} icon={Boxes} />
        <Metric title="Sync success" value={`${analytics.syncSuccessRate}%`} icon={RefreshCcw} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-xl font-black">Revenue over time</h2>
          <div className="mt-5 grid h-56 grid-cols-4 items-end gap-3">
            {analytics.revenueTrend.map((item) => (
              <div key={item.label} className="grid h-full content-end gap-2">
                <div className="rounded-t-xl bg-moss" style={{ height: `${Math.max(12, (item.value / maxTrend) * 100)}%` }} />
                <p className="text-center text-xs font-black text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="card p-5">
          <h2 className="text-xl font-black">Profit trends</h2>
          <div className="mt-5 grid gap-4">
            {analytics.profitTrend.map((item) => (
              <div key={item.label} className="grid gap-2 sm:grid-cols-[80px_1fr_90px] sm:items-center">
                <span className="text-sm font-black">{item.label}</span>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(5, (item.value / maxTrend) * 100)}%` }} /></div>
                <span className="text-sm font-black">{money(item.value)}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm font-bold text-slate-600">Total net profit: <span className="text-emerald-700">{money(analytics.profit)}</span></p>
        </section>
      </div>
      <section className="card p-5">
        <h2 className="text-xl font-black">Sales by marketplace</h2>
        <div className="mt-5 grid gap-4">
          {byMarketplace.map((marketplace) => (
            <div key={marketplace.id} className="grid gap-2 sm:grid-cols-[180px_1fr_100px] sm:items-center">
              <span className="text-sm font-black">{marketplace.name}</span>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-moss" style={{ width: `${Math.max(4, (marketplace.revenue / maxRevenue) * 100)}%` }} /></div>
              <span className="text-sm font-black">{money(marketplace.revenue)}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="card p-5">
        <h2 className="text-xl font-black">Top products</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {store.listings.length ? store.listings.slice(0, 3).map((listing) => (
            <div key={listing.id} className="rounded-xl border border-slate-200 p-4">
              <p className="font-black">{listing.title}</p>
              <p className="text-sm font-semibold text-slate-500">{money(listing.price)} - {listing.status}</p>
            </div>
          )) : <EmptyState title="No analytics yet" message="Create and sell listings to populate product analytics." />}
        </div>
      </section>
    </div>
  );
}

function InventoryPage() {
  const store = useResellSync();
  return (
    <section className="card p-5">
      <h2 className="text-xl font-black">Inventory</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {store.inventoryItems.length ? store.inventoryItems.map((item) => (
          <article key={item.id} className="rounded-xl border border-slate-200 p-4">
            <div className="mb-3 flex h-28 items-center justify-center rounded-xl bg-gradient-to-br from-mint to-amber/40 text-4xl font-black text-moss">{item.title.slice(0, 1)}</div>
            <h3 className="font-black">{item.title}</h3>
            <p className="text-sm font-semibold text-slate-500">{item.brand} - {item.category} - {item.size} - {item.condition}</p>
            <div className="mt-3 flex justify-between text-sm font-black"><span>{money(item.price)}</span><span className={item.quantity <= item.lowStockThreshold ? 'text-amber-700' : ''}>Qty {item.quantity}</span></div>
            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs font-bold text-slate-600">
              <p className="flex items-center gap-1"><MapPin size={13} /> SKU {item.sku}</p>
              <p className="mt-1">Bin {item.bin} - Rack {item.rack} - Shelf {item.shelf}</p>
              {item.quantity <= item.lowStockThreshold && <p className="mt-2 text-amber-700">Low stock threshold reached.</p>}
            </div>
          </article>
        )) : <EmptyState title="No inventory" message="Create a listing or import a CSV to build inventory." />}
      </div>
    </section>
  );
}

function ActivityLogPage() {
  const store = useResellSync();
  return (
    <section className="card p-5">
      <div className="mb-4">
        <h2 className="text-xl font-black">Activity Log</h2>
        <p className="text-sm font-semibold text-slate-500">Audit trail for listing creation, sync attempts, sales, auto-delisting, and manual exports.</p>
      </div>
      <div className="grid gap-3">
        {store.syncLogs.length ? store.syncLogs.map((log) => {
          const listing = log.listingId ? store.listings.find((item) => item.id === log.listingId) : null;
          return (
            <div key={log.id} className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[170px_180px_1fr_120px] md:items-center">
              <p className="text-sm font-bold text-slate-500">{shortDate(log.createdAt)}</p>
              <p className="font-black">{log.marketplaceId ? marketplaceName(log.marketplaceId) : 'ResellSync'}</p>
              <div>
                <p className="text-sm font-bold">{log.message}</p>
                <p className="text-xs font-semibold text-slate-500">{listing?.title || 'System event'}</p>
              </div>
              <span className={`badge justify-center ${log.level === 'success' ? 'bg-emerald-100 text-emerald-700' : log.level === 'warning' ? 'bg-amber-100 text-amber-700' : log.level === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                {log.level}
              </span>
            </div>
          );
        }) : <EmptyState title="No activity yet" message="Activity will appear when listings sync, sell, or trigger manual exports." />}
      </div>
    </section>
  );
}

function SettingsPage() {
  const store = useResellSync();
  const credentialStatus = validateMarketplaceCredentials();
  return (
    <div className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
      <section className="card p-5">
        <h2 className="text-xl font-black">Demo account</h2>
        <div className="mt-4 grid gap-3 text-sm font-semibold text-slate-600">
          <p>Name: <strong className="text-ink">{store.user?.name}</strong></p>
          <p>Email: <strong className="text-ink">{store.user?.email}</strong></p>
          <p>Session: <strong className="text-ink">{store.authSession?.provider || 'mock'}</strong></p>
          <p>Mode: <strong className="text-emerald-700">Local mock database</strong></p>
        </div>
        <button className="btn-secondary mt-5" disabled={store.loading} onClick={store.resetDemo}><RefreshCcw size={16} /> Reset demo data</button>
      </section>
      <section className="card p-5">
        <h2 className="text-xl font-black">Billing</h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">Subscription billing is a demo placeholder until Stripe Checkout is connected server-side.</p>
        <div className="mt-4 rounded-xl bg-mint p-4">
          <p className="text-sm font-bold text-slate-600">Current plan</p>
          <p className="mt-1 text-2xl font-black capitalize">{store.settings.billingPlan}</p>
        </div>
      </section>
      </div>

      <section className="card p-5">
        <h2 className="text-xl font-black">Sync preferences</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 text-sm font-bold">
            Auto-delist after sale
            <input type="checkbox" checked={store.settings.autoDelistEnabled} onChange={(event) => store.updateSettings({ autoDelistEnabled: event.target.checked })} />
          </label>
          <label className="label">Retry attempts<input className="field" type="number" value={store.settings.syncRetries} onChange={(event) => store.updateSettings({ syncRetries: Number(event.target.value) })} /></label>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 text-sm font-bold">
            Sync completed alerts
            <input type="checkbox" checked={store.settings.notifySyncComplete} onChange={(event) => store.updateSettings({ notifySyncComplete: event.target.checked })} />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 text-sm font-bold">
            Failed sync alerts
            <input type="checkbox" checked={store.settings.notifyFailedSync} onChange={(event) => store.updateSettings({ notifyFailedSync: event.target.checked })} />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 text-sm font-bold">
            Low inventory alerts
            <input type="checkbox" checked={store.settings.notifyLowInventory} onChange={(event) => store.updateSettings({ notifyLowInventory: event.target.checked })} />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 text-sm font-bold">
            Sold item alerts
            <input type="checkbox" checked={store.settings.notifySoldItems} onChange={(event) => store.updateSettings({ notifySoldItems: event.target.checked })} />
          </label>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-black">Marketplace connections</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {store.marketplaceAccounts.map((account) => (
            <div key={account.id} className="rounded-xl border border-slate-200 p-4">
              <p className="font-black">{account.name}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">{account.connected ? 'Connected in demo' : 'Disconnected'}</p>
              <span className={`badge mt-3 ${account.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{account.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-black">API credentials</h2>
        <div className="mt-4 grid gap-3 text-sm font-semibold text-slate-600">
          <p>Supabase: <strong>NEXT_PUBLIC_SUPABASE_URL</strong></p>
          <p>Stripe: <strong>NEXT_PUBLIC_STRIPE_PUBLIC_KEY</strong></p>
          <p>Marketplace OAuth: server-only marketplace credential variables plus public redirect hints.</p>
        </div>
        <p className="mt-4 rounded-xl bg-amber/30 p-3 text-sm font-bold text-slate-700">
          Production OAuth token exchange, Stripe payments, and sensitive marketplace credentials belong on server routes or Edge Functions.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {credentialStatus.map((status) => (
            <div key={status.marketplaceId} className="rounded-xl border border-slate-200 p-4">
              <p className="font-black">{marketplaceName(status.marketplaceId)}</p>
              <span className={`badge mt-2 ${status.configured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{status.mode}</span>
              <p className="mt-2 text-xs font-bold text-slate-500">{status.missing.length ? `Missing: ${status.missing.join(', ')}` : 'Credentials present or not required.'}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Toast() {
  const store = useResellSync();
  if (!store.toast) return null;
  const tone = {
    success: 'border-emerald-200 bg-mint text-emerald-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    error: 'border-rose-200 bg-rose-50 text-rose-800'
  }[store.toast.tone];

  return (
    <div className={`mb-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-bold ${tone}`}>
      <span>{store.toast.message}</span>
      <button onClick={store.dismissToast}><X size={16} /></button>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="mb-4 grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="card p-5">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-8 w-32 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-3 w-full animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: string; icon: typeof Gauge }) {
  return (
    <section className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
        </div>
        <div className="rounded-xl bg-mint p-2 text-moss"><Icon size={20} /></div>
      </div>
    </section>
  );
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return <span className={`badge ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{label}</span>;
}

function SyncIssueBadge({ status }: { status: SyncIssueStatus }) {
  const label: Record<SyncIssueStatus, string> = {
    success: 'Success',
    failed: 'Failed',
    pending: 'Pending',
    manual_required: 'Manual Required'
  };
  const color: Record<SyncIssueStatus, string> = {
    success: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-rose-100 text-rose-700',
    pending: 'bg-blue-100 text-blue-700',
    manual_required: 'bg-orange-100 text-orange-700'
  };

  return <span className={`badge ${color[status]}`}>{label[status]}</span>;
}

function AlertLine({ title, value, tone }: { title: string; value: string; tone: 'success' | 'info' | 'warning' }) {
  const color = tone === 'success' ? 'bg-emerald-100 text-emerald-700' : tone === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700';
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <span className={`badge ${color}`}>{title}</span>
      <p className="mt-2 text-sm font-bold text-slate-600">{value}</p>
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-slate-300 p-8 text-center">
      <ShoppingBag className="text-slate-400" size={36} />
      <h3 className="mt-3 font-black">{title}</h3>
      <p className="mt-1 text-sm font-semibold text-slate-500">{message}</p>
    </div>
  );
}
