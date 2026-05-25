import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, ChevronRight, Plus, TrendingUp } from 'lucide-react';
import api from '../api/axiosConfig.js';
import { formatCurrency } from '../utils/formatters.js';
import { useAuth } from '../context/AuthContext.jsx';

const StoreCard = ({ store, onSelect }) => (
  <div
    className="card cursor-pointer hover:shadow-md transition group"
    onClick={() => onSelect(store)}
  >
    <div className="flex items-start justify-between">
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition">
          {store.storeName}
        </h3>
        <span className="font-mono text-xs text-gray-400">{store.storeCode}</span>
      </div>
      <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-500 transition" />
    </div>
    <div className="mt-3 space-y-1.5">
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <MapPin size={12} />
        <span>{store.location?.city}, {store.location?.state}</span>
      </div>
      {store.contactInfo?.phone && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Phone size={12} />
          <span>{store.contactInfo.phone}</span>
        </div>
      )}
      {store.contactInfo?.managerName && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="text-gray-400">Manager:</span>
          <span className="font-medium">{store.contactInfo.managerName}</span>
        </div>
      )}
    </div>
    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-1 text-xs text-blue-600">
      <TrendingUp size={12} />
      View Performance
    </div>
  </div>
);

const StoreDetail = ({ storeId, onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/stores/${storeId}/performance`)
      .then((r) => setData(r.data.data))
      .finally(() => setLoading(false));
  }, [storeId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="btn-secondary">← Back to Stores</button>
        <div className="card"><div className="skeleton h-48 w-full" /></div>
      </div>
    );
  }

  const { store, metrics } = data || {};

  return (
    <div className="space-y-5 animate-fade-in">
      <button onClick={onBack} className="btn-secondary">← Back to Stores</button>

      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{store?.storeName}</h2>
        <p className="text-gray-500 text-sm">{store?.location?.address}, {store?.location?.city}, {store?.location?.state} {store?.location?.zipCode}</p>
        {store?.contactInfo?.email && <p className="text-sm text-gray-500 mt-1">📧 {store.contactInfo.email}</p>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Transfer Efficiency', value: `${metrics?.transferEfficiency}%`, color: 'text-blue-600' },
          { label: 'Waste Avoided', value: formatCurrency(metrics?.wasteAvoided), color: 'text-green-600' },
          { label: 'Total Stock Value', value: formatCurrency(metrics?.totalStockValue), color: 'text-purple-600' },
          { label: 'Total Transfers', value: metrics?.totalTransfers, color: '' },
          { label: 'Completed Transfers', value: metrics?.completedTransfers, color: 'text-green-600' },
          { label: 'Expiring Items', value: (metrics?.inventoryHealth?.critical || 0) + (metrics?.inventoryHealth?.high || 0), color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Inventory health */}
      {metrics?.inventoryHealth && (
        <div className="card">
          <h3 className="text-sm font-semibold mb-3">Inventory Health</h3>
          <div className="flex gap-4 flex-wrap">
            {[
              { label: 'Critical', count: metrics.inventoryHealth.critical, color: 'bg-red-500' },
              { label: 'High Risk', count: metrics.inventoryHealth.high, color: 'bg-orange-500' },
              { label: 'Medium', count: metrics.inventoryHealth.medium, color: 'bg-yellow-500' },
              { label: 'Healthy', count: metrics.inventoryHealth.healthy, color: 'bg-green-500' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="text-sm text-gray-600 dark:text-gray-300">{label}: <strong>{count}</strong></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StoresPage = () => {
  const { hasRole } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStore, setNewStore] = useState({ storeName: '', storeCode: '', location: { city: '', state: '' }, contactInfo: { managerName: '' } });

  useEffect(() => {
    api.get('/stores')
      .then((r) => setStores(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/stores', newStore);
      setStores((s) => [...s, data.data]);
      setShowAddForm(false);
    } catch { /* handled */ }
  };

  if (selected) {
    return <StoreDetail storeId={selected._id} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stores</h1>
          <p className="text-sm text-gray-500 mt-1">{stores.length} active locations</p>
        </div>
        {hasRole('admin', 'regional_manager') && (
          <button onClick={() => setShowAddForm((s) => !s)} className="btn-primary">
            <Plus size={15} /> Add Store
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="card">
          <h3 className="text-sm font-semibold mb-3">New Store</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
            <div><label className="label">Store Name</label><input className="input" required value={newStore.storeName} onChange={(e) => setNewStore({ ...newStore, storeName: e.target.value })} /></div>
            <div><label className="label">Store Code</label><input className="input uppercase" required value={newStore.storeCode} onChange={(e) => setNewStore({ ...newStore, storeCode: e.target.value.toUpperCase() })} /></div>
            <div><label className="label">City</label><input className="input" required value={newStore.location.city} onChange={(e) => setNewStore({ ...newStore, location: { ...newStore.location, city: e.target.value } })} /></div>
            <div><label className="label">State</label><input className="input" required value={newStore.location.state} onChange={(e) => setNewStore({ ...newStore, location: { ...newStore.location, state: e.target.value } })} /></div>
            <div><label className="label">Manager Name</label><input className="input" value={newStore.contactInfo.managerName} onChange={(e) => setNewStore({ ...newStore, contactInfo: { ...newStore.contactInfo, managerName: e.target.value } })} /></div>
            <div className="flex items-end gap-2">
              <button type="submit" className="btn-primary flex-1">Create</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-44 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((s) => <StoreCard key={s._id} store={s} onSelect={setSelected} />)}
        </div>
      )}
    </div>
  );
};

export default StoresPage;
