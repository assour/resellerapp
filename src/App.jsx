import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Boxes,
  CheckCircle2,
  DollarSign,
  Download,
  Link2,
  PackagePlus,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  ShoppingBag,
  Store,
  XCircle
} from 'lucide-react';
import { demoMode, marketplaceConfig } from './config';
import { marketplaces } from './data/mockData';
import { getDashboardData } from './services/analyticsService';
import { getCurrentUser } from './services/authService';
import { getProducts, markProductSold, resetDemoData, saveProduct } from './services/inventoryService';
import { getConnections, setConnection } from './services/marketplaceService';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'add', label: 'Add Product', icon: PackagePlus },
  { id: 'connections', label: 'Connections', icon: Link2 },
  { id: 'listings', label: 'Listings', icon: Store },
  { id: 'analytics', label: 'Analytics', icon: DollarSign },
  { id: 'settings', label: 'Settings', icon: Settings }
];

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const validPages = new Set(navItems.map((item) => item.id));

function pageFromHash() {
  const page = window.location.hash.replace('#/', '') || 'dashboard';
  return validPages.has(page) ? page : 'dashboard';
}

function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Card({ title, value, helper, icon: Icon }) {
  return (
    <section className="card metric-card">
      <div>
        <p className="card-label">{title}</p>
        <strong>{value}</strong>
        {helper && <span>{helper}</span>}
      </div>
      {Icon && <Icon size={22} />}
    </section>
  );
}

function EmptyState({ title, message }) {
  return (
    <div className="empty-state">
      <ShoppingBag size={32} />
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}

function statusTone(status) {
  return {
    listed: 'success',
    sold: 'purple',
    delisted: 'warning',
    failed: 'danger',
    draft: 'neutral'
  }[status] || 'neutral';
}

function App() {
  const [activePage, setActivePage] = useState(pageFromHash);
  const [editingProduct, setEditingProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [connections, setConnections] = useState({});
  const [dashboard, setDashboard] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function refreshData() {
    setLoading(true);
    setError('');
    try {
      const [nextProducts, nextConnections, nextDashboard, nextUser] = await Promise.all([
        getProducts(),
        getConnections(),
        getDashboardData(),
        getCurrentUser()
      ]);
      setProducts(nextProducts);
      setConnections(nextConnections);
      setDashboard(nextDashboard);
      setUser(nextUser);
    } catch (err) {
      setError(err.message || 'Something went wrong while loading demo data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    function syncRoute() {
      setActivePage(pageFromHash());
    }

    window.addEventListener('hashchange', syncRoute);
    if (!window.location.hash) window.location.hash = '#/dashboard';
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);

  function navigate(page) {
    if (!validPages.has(page)) return;
    if (page === 'add') setEditingProduct(null);
    window.location.hash = `#/${page}`;
    setActivePage(page);
  }

  async function handleConnection(marketplaceId, connected) {
    try {
      const next = await setConnection(marketplaceId, connected);
      setConnections(next);
      setNotice(`${marketplaceConfig[marketplaceId].label} ${connected ? 'connected' : 'disconnected'} locally.`);
      await refreshData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSold(productId, marketplaceId) {
    try {
      const product = products.find((item) => item.id === productId);
      const result = await markProductSold(productId, marketplaceId, product?.listingPrice);
      setNotice(result.message);
      await refreshData();
    } catch (err) {
      setError(err.message || 'Could not mark listing as sold.');
    }
  }

  async function handleSaveProduct(product, publish) {
    try {
      await saveProduct(product, publish);
      setNotice(publish ? 'Product listed in demo mode.' : 'Product saved as a draft.');
      setEditingProduct(null);
      navigate('inventory');
      await refreshData();
    } catch (err) {
      setError(err.message || 'Could not save this product.');
    }
  }

  async function handleReset() {
    await resetDemoData();
    setNotice('Demo data reset.');
    await refreshData();
  }

  const page = useMemo(() => {
    const props = {
      products,
      connections,
      dashboard,
      onSold: handleSold,
      onConnection: handleConnection,
      onSaveProduct: handleSaveProduct,
      onReset: handleReset,
      setActivePage: navigate,
      onEditProduct: (product) => {
        setEditingProduct(product);
        window.location.hash = '#/add';
        setActivePage('add');
      },
      editingProduct,
      user
    };

    return {
      dashboard: <Dashboard {...props} />,
      inventory: <Inventory {...props} />,
      add: <AddProduct {...props} />,
      connections: <Connections {...props} />,
      listings: <Listings {...props} />,
      analytics: <Analytics {...props} />,
      settings: <SettingsPage {...props} />
    }[activePage];
  }, [activePage, products, connections, dashboard, user, editingProduct]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">R</div>
          <div>
            <strong>Reseller</strong>
            <span>Command Center</span>
          </div>
        </div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={activePage === item.id ? 'active' : ''} onClick={() => navigate(item.id)}>
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="content">
        <header className="topbar">
          <div>
            <p>{demoMode ? 'Demo workspace' : 'Production workspace'}</p>
            <h1>{navItems.find((item) => item.id === activePage)?.label}</h1>
          </div>
          <div className="user-pill">
            <span>{user?.name || 'Demo Reseller'}</span>
            <Badge tone={demoMode ? 'success' : 'warning'}>{demoMode ? 'Demo mode' : 'Live mode'}</Badge>
          </div>
        </header>

        {notice && (
          <div className="notice success" role="status">
            <CheckCircle2 size={18} />
            <span>{notice}</span>
            <button onClick={() => setNotice('')}>Dismiss</button>
          </div>
        )}
        {error && (
          <div className="notice error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button onClick={() => setError('')}>Dismiss</button>
          </div>
        )}

        {loading ? <div className="loading">Loading reseller workspace...</div> : page}
      </main>
    </div>
  );
}

function Dashboard({ products, dashboard, setActivePage }) {
  if (!dashboard) return null;
  const alerts = products.filter((product) => product.status === 'draft' || Object.values(product.marketplaceStatus).includes('failed'));
  return (
    <div className="page-grid">
      <div className="metrics-grid">
        <Card title="Inventory Value" value={money.format(dashboard.totalInventoryValue)} icon={Boxes} />
        <Card title="Active Listings" value={dashboard.activeListings} helper={`${dashboard.unsoldInventoryCount} unsold items`} icon={Store} />
        <Card title="Gross Sales" value={money.format(dashboard.grossSales)} icon={DollarSign} />
        <Card title="Estimated Profit" value={money.format(dashboard.estimatedProfit)} helper={`${dashboard.averageProfitMargin}% margin`} icon={BarChart3} />
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Sales and profit</h2>
            <p>Best marketplace: {dashboard.bestMarketplace}</p>
          </div>
          <button onClick={() => setActivePage('add')}><Plus size={16} /> Add product</button>
        </div>
        <div className="summary-row">
          <span>Sold items</span>
          <strong>{dashboard.soldItems}</strong>
        </div>
        <div className="summary-row">
          <span>Average profit margin</span>
          <strong>{dashboard.averageProfitMargin}%</strong>
        </div>
      </section>
      <section className="panel split-panel">
        <div>
          <h2>Recent activity</h2>
          <ActivityList items={dashboard.recentActivity} />
        </div>
        <div>
          <h2>Inventory alerts</h2>
          {alerts.length ? alerts.slice(0, 5).map((product) => (
            <div className="activity-item" key={product.id}>
              <AlertCircle size={16} />
              <span>{product.title} needs attention.</span>
            </div>
          )) : <p className="muted">No inventory alerts right now.</p>}
        </div>
      </section>
    </div>
  );
}

function ActivityList({ items }) {
  if (!items?.length) return <p className="muted">No recent activity yet.</p>;
  return (
    <div className="activity-list">
      {items.slice(0, 6).map((item) => (
        <div className="activity-item" key={item.id}>
          <CheckCircle2 size={16} />
          <span>{item.message}</span>
        </div>
      ))}
    </div>
  );
}

function Inventory({ products, setActivePage, onEditProduct }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const filtered = products.filter((product) => {
    const matchesQuery = `${product.title} ${product.brand} ${product.category}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === 'all' || product.status === status;
    return matchesQuery && matchesStatus;
  });

  return (
    <section className="panel">
      <div className="toolbar">
        <div className="search-box">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search inventory" />
        </div>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="listed">Listed</option>
          <option value="sold">Sold</option>
          <option value="delisted">Delisted</option>
        </select>
        <button onClick={() => setActivePage('add')}><Plus size={16} /> Add product</button>
      </div>
      {filtered.length ? <ProductTable products={filtered} onEditProduct={onEditProduct} /> : <EmptyState title="No products found" message="Try another search or add a product to start building inventory." />}
    </section>
  );
}

function ProductTable({ products, onEditProduct }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Cost</th>
            <th>List price</th>
            <th>Status</th>
            <th>Marketplace status</th>
            <th>Edit</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <div className="product-cell">
                  <div className="photo-placeholder">{product.title.slice(0, 1)}</div>
                  <div>
                    <strong>{product.title}</strong>
                    <span>{product.brand} · {product.size} · {product.condition}</span>
                  </div>
                </div>
              </td>
              <td>{product.category}</td>
              <td>{money.format(product.cost)}</td>
              <td>{money.format(product.listingPrice)}</td>
              <td><Badge tone={statusTone(product.status)}>{product.status}</Badge></td>
              <td className="marketplace-mini">
                {Object.entries(product.marketplaceStatus).map(([id, status]) => (
                  <Badge key={id} tone={statusTone(status)}>{marketplaceConfig[id].label}: {status}</Badge>
                ))}
              </td>
              <td><button className="ghost-button" onClick={() => onEditProduct(product)}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AddProduct({ onSaveProduct, editingProduct }) {
  const blankForm = {
    title: '',
    description: '',
    category: '',
    brand: '',
    size: '',
    condition: 'Good',
    cost: '',
    listingPrice: '',
    selectedMarketplaces: ['ebay', 'depop', 'poshmark']
  };
  const [form, setForm] = useState(blankForm);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!editingProduct) {
      setForm(blankForm);
      return;
    }

    setForm({
      ...editingProduct,
      cost: String(editingProduct.cost ?? ''),
      listingPrice: String(editingProduct.listingPrice ?? ''),
      selectedMarketplaces: Object.entries(editingProduct.marketplaceStatus)
        .filter(([, status]) => status === 'listed')
        .map(([id]) => id)
    });
  }, [editingProduct]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleMarketplace(id) {
    setForm((current) => ({
      ...current,
      selectedMarketplaces: current.selectedMarketplaces.includes(id)
        ? current.selectedMarketplaces.filter((item) => item !== id)
        : [...current.selectedMarketplaces, id]
    }));
  }

  function submit(publish) {
    if (!form.title.trim() || !form.category.trim()) {
      setFormError('Please add at least a title and category.');
      return;
    }
    if (Number(form.cost) < 0 || Number(form.listingPrice) < 0) {
      setFormError('Costs and prices cannot be negative.');
      return;
    }
    setFormError('');
    onSaveProduct(form, publish);
  }

  return (
    <section className="panel form-panel">
      <h2>{editingProduct ? 'Edit product' : 'Create listing'}</h2>
      {formError && <div className="inline-error">{formError}</div>}
      <div className="form-grid">
        <label>Title<input value={form.title} onChange={(event) => update('title', event.target.value)} /></label>
        <label>Category<input value={form.category} onChange={(event) => update('category', event.target.value)} /></label>
        <label>Brand<input value={form.brand} onChange={(event) => update('brand', event.target.value)} /></label>
        <label>Size<input value={form.size} onChange={(event) => update('size', event.target.value)} /></label>
        <label>Condition<select value={form.condition} onChange={(event) => update('condition', event.target.value)}><option>New</option><option>Excellent</option><option>Very Good</option><option>Good</option><option>Fair</option></select></label>
        <label>Cost<input type="number" value={form.cost} onChange={(event) => update('cost', event.target.value)} /></label>
        <label>Listing price<input type="number" value={form.listingPrice} onChange={(event) => update('listingPrice', event.target.value)} /></label>
        <label className="span-2">Description<textarea value={form.description} onChange={(event) => update('description', event.target.value)} /></label>
      </div>
      <div className="photo-drop">Photos placeholder: add real upload storage later with Supabase or another backend.</div>
      <div className="marketplace-checks">
        {marketplaces.map((marketplace) => (
          <label key={marketplace.id}>
            <input type="checkbox" checked={form.selectedMarketplaces.includes(marketplace.id)} onChange={() => toggleMarketplace(marketplace.id)} />
            {marketplace.name}
          </label>
        ))}
      </div>
      <div className="actions">
        <button className="secondary" onClick={() => submit(false)}>Save as draft</button>
        <button onClick={() => submit(true)}>Publish listing</button>
      </div>
    </section>
  );
}

function Connections({ connections, onConnection }) {
  return (
    <div className="connection-grid">
      {marketplaces.map((marketplace) => {
        const connected = connections[marketplace.id]?.connected;
        return (
          <section className="card connection-card" key={marketplace.id}>
            <div>
              <h2>{marketplace.name}</h2>
              <Badge tone={connected ? 'success' : 'neutral'}>{connected ? 'Connected' : 'Disconnected'}</Badge>
              <p>{connected ? 'Ready for demo listings and local sync.' : 'Connect locally to test the UI state.'}</p>
            </div>
            <button className={connected ? 'secondary' : ''} onClick={() => onConnection(marketplace.id, !connected)}>
              {connected ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
              {connected ? 'Disconnect' : 'Connect'}
            </button>
          </section>
        );
      })}
    </div>
  );
}

function Listings({ products, onSold }) {
  const rows = products.flatMap((product) =>
    Object.entries(product.marketplaceStatus).map(([marketplaceId, status]) => ({ product, marketplaceId, status }))
  );

  return (
    <section className="panel">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Listing</th>
              <th>Marketplace</th>
              <th>Status</th>
              <th>Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ product, marketplaceId, status }) => (
              <tr key={`${product.id}-${marketplaceId}`}>
                <td>{product.title}</td>
                <td>{marketplaceConfig[marketplaceId].label}</td>
                <td><Badge tone={statusTone(status)}>{status}</Badge></td>
                <td>{money.format(product.listingPrice)}</td>
                <td>
                  {status === 'listed'
                    ? <button onClick={() => onSold(product.id, marketplaceId)}>Mark as sold</button>
                    : <span className="muted">No action</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Analytics({ dashboard }) {
  if (!dashboard) return null;
  const totalMarketplaceSales = Object.values(dashboard.marketplaceSales).reduce((sum, value) => sum + value, 0) || 1;
  return (
    <div className="page-grid">
      <div className="metrics-grid">
        <Card title="Gross Sales" value={money.format(dashboard.grossSales)} />
        <Card title="Estimated Profit" value={money.format(dashboard.estimatedProfit)} />
        <Card title="Inventory Value" value={money.format(dashboard.totalInventoryValue)} />
        <Card title="Best Category" value={dashboard.bestCategory} />
      </div>
      <section className="panel">
        <h2>Sales by marketplace</h2>
        {marketplaces.map((marketplace) => {
          const value = dashboard.marketplaceSales[marketplace.id] || 0;
          return (
            <div className="bar-row" key={marketplace.id}>
              <span>{marketplace.name}</span>
              <div><span style={{ width: `${Math.max(5, (value / totalMarketplaceSales) * 100)}%` }} /></div>
              <strong>{money.format(value)}</strong>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function SettingsPage({ user, onReset }) {
  return (
    <div className="page-grid">
      <section className="panel">
        <h2>Workspace</h2>
        <div className="settings-row"><span>Mode</span><Badge tone="success">{demoMode ? 'Demo mode active' : 'Live mode'}</Badge></div>
        <div className="settings-row"><span>Name</span><strong>{user?.name}</strong></div>
        <div className="settings-row"><span>Email</span><strong>{user?.email}</strong></div>
        <button className="secondary" onClick={onReset}><RefreshCcw size={16} /> Reset demo data</button>
      </section>
      <section className="panel">
        <h2>API placeholders</h2>
        <p className="muted">Add Vite environment variables when you are ready to connect real services.</p>
        <div className="settings-row"><span>Supabase</span><Badge>Placeholder</Badge></div>
        <div className="settings-row"><span>Stripe</span><Badge>Placeholder</Badge></div>
        <div className="settings-row"><span>Marketplace APIs</span><Badge>Official APIs only</Badge></div>
      </section>
      <section className="panel">
        <h2>Data and policies</h2>
        <button className="secondary"><Download size={16} /> Export data</button>
        <p className="muted">Privacy policy and terms links are placeholders until production launch.</p>
      </section>
    </div>
  );
}

export default App;
