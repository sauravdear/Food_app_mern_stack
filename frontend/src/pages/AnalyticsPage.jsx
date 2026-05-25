import { useState, useEffect } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell,
} from 'recharts';
import api from '../api/axiosConfig.js';
import { formatCurrency, categoryColors } from '../utils/formatters.js';
import { useAuth } from '../context/AuthContext.jsx';

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const AnalyticsPage = () => {
  const { hasRole } = useAuth();
  const [wasteData, setWasteData] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [storeData, setStoreData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [waste, cat, stores] = await Promise.all([
        api.get('/analytics/waste').then((r) => r.data.data),
        api.get('/analytics/categories').then((r) => r.data.data),
        api.get('/analytics/store-performance').then((r) => r.data.data),
      ]);
      setWasteData(waste);
      setCategoryData(cat);
      setStoreData(stores);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleExport = async () => {
    try {
      const response = await api.get('/analytics/export', { params: { format: 'csv' }, responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transfers-report.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* handled */ }
  };

  const monthlyData = (wasteData?.monthlyTrend || []).map((m) => ({
    month: `${MONTHS[m._id.month]} ${m._id.year}`,
    wasteAvoided: m.totalAvoided,
    count: m.count,
  }));

  const categoryInventory = (categoryData?.inventoryByCategory || []).map((c) => ({
    name: c._id,
    value: Math.round(c.totalValue),
  }));

  const categoryTransfers = (categoryData?.transfersByCategory || []).map((c) => ({
    category: c._id,
    transfers: c.transferCount,
    wasteAvoided: c.wasteAvoided,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Comprehensive waste reduction and transfer insights</p>
        </div>
        <div className="flex gap-2">
          {hasRole('admin', 'regional_manager') && (
            <button onClick={handleExport} className="btn-secondary">
              <Download size={15} /> Export CSV
            </button>
          )}
          <button onClick={fetchAll} className="btn-secondary" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Waste Avoided', value: formatCurrency(wasteData?.totalWasteAvoided), color: 'text-green-600' },
          { label: 'Completed Transfers', value: wasteData?.totalCompletedTransfers || 0, color: 'text-blue-600' },
          { label: 'Category Count', value: categoryData?.inventoryByCategory?.length || 0, color: '' },
          { label: 'Stores Tracked', value: storeData.length, color: '' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-xl font-bold mt-1 ${color}`}>
              {loading ? <span className="skeleton h-6 w-24 block" /> : value}
            </p>
          </div>
        ))}
      </div>

      {/* Monthly waste trend */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Monthly Waste Avoided ($)</h3>
        {loading ? <div className="skeleton h-48 w-full" /> : monthlyData.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-12">No completed transfers yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, n) => [n === 'wasteAvoided' ? formatCurrency(v) : v, n === 'wasteAvoided' ? 'Waste Avoided' : 'Transfers']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="wasteAvoided" name="Waste Avoided" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="count" name="Transfers" fill="#60a5fa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Inventory Value by Category</h3>
          {loading ? <div className="skeleton h-48 w-full" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryInventory} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                  {categoryInventory.map((e) => (
                    <Cell key={e.name} fill={categoryColors[e.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [formatCurrency(v), 'Value']} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Transfers by Category</h3>
          {loading ? <div className="skeleton h-48 w-full" /> : categoryTransfers.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-12">No transfer data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryTransfers} margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="transfers" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Store performance ranking */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Store Performance Ranking</h3>
        {loading ? <div className="skeleton h-36 w-full" /> : (
          <div className="space-y-3">
            {storeData.map((store, i) => (
              <div key={store.storeId} className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-300 w-6 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{store.storeName}</span>
                    <span className="text-sm font-bold text-blue-600 ml-2 shrink-0">{store.transferEfficiency}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${store.transferEfficiency}%` }}
                    />
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    <span>{store.completedTransfers}/{store.totalTransfers} transfers</span>
                    <span className="text-green-600">{formatCurrency(store.wasteAvoided)} saved</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
