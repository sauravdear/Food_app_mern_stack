import { useState } from 'react';
import { Search, Plus, Upload, RefreshCw, Filter } from 'lucide-react';
import { useInventory } from '../hooks/useInventory.js';
import { formatDate, formatCurrency, getDaysLeftColor, getUrgencyBadge } from '../utils/formatters.js';
import { FOOD_CATEGORIES } from '../utils/constants.js';
import TransferModal from '../components/transfers/TransferModal.jsx';
import AddFoodItemModal from '../components/inventory/AddFoodItemModal.jsx';

const URGENCY_ROW_COLORS = {
  critical: 'bg-red-50 dark:bg-red-900/10',
  high: 'bg-orange-50 dark:bg-orange-900/10',
  medium: 'bg-yellow-50 dark:bg-yellow-900/10',
  low: '',
  expired: 'bg-red-100 dark:bg-red-900/20',
};

const daysToUrgency = (days) => {
  if (days <= 0) return 'expired';
  if (days <= 1) return 'critical';
  if (days <= 3) return 'high';
  if (days <= 7) return 'medium';
  return 'low';
};

const InventoryPage = () => {
  const { inventory, loading, refetch } = useInventory();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortField, setSortField] = useState('daysLeft');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [transferTarget, setTransferTarget] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const PER_PAGE = 20;

  const filtered = inventory
    .filter((item) => {
      const matchSearch = !search || [item.name, item.SKU, item.batchNumber].some((f) =>
        f?.toLowerCase().includes(search.toLowerCase())
      );
      const matchCat = !category || item.category === category;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'daysLeft') return (a.daysLeft - b.daysLeft) * dir;
      if (sortField === 'name') return a.name.localeCompare(b.name) * dir;
      if (sortField === 'stock') return (a.currentStock - b.currentStock) * dir;
      if (sortField === 'velocity') return (a.salesVelocity - b.salesVelocity) * dir;
      return 0;
    });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => (
    <span className="text-gray-400 ml-1 text-xs">{sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} items across all stores</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <Plus size={15} /> Add Item
          </button>
          <button onClick={refetch} className="btn-secondary" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by name, SKU, batch..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="input w-40" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {FOOD_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                {[
                  { label: 'Item Name', field: 'name' },
                  { label: 'Category', field: null },
                  { label: 'SKU', field: null },
                  { label: 'Exp. Date / Days Left', field: 'daysLeft' },
                  { label: 'Stock', field: 'stock' },
                  { label: 'Velocity', field: 'velocity' },
                  { label: 'Value', field: null },
                  { label: 'Actions', field: null },
                ].map(({ label, field }) => (
                  <th key={label}
                    className={`px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 ${field ? 'cursor-pointer select-none hover:text-gray-900 dark:hover:text-white' : ''}`}
                    onClick={field ? () => toggleSort(field) : undefined}>
                    {label}{field && <SortIcon field={field} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">No items found</td>
                </tr>
              ) : (
                paginated.map((item) => {
                  const urgency = daysToUrgency(item.daysLeft);
                  return (
                    <tr key={item.foodItemId} className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition ${URGENCY_ROW_COLORS[urgency]}`}>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.name}</td>
                      <td className="px-4 py-3">
                        <span className="badge bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">{item.category}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.SKU}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-500">{formatDate(item.expirationDate)}</div>
                        <span className={`badge mt-0.5 ${getUrgencyBadge(urgency)}`}>
                          {item.daysLeft <= 0 ? 'Expired' : `${item.daysLeft}d`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={item.currentStock <= item.minimumStockThreshold ? 'text-red-600 font-semibold' : ''}>
                          {item.currentStock}
                        </span>
                        <span className="text-gray-400 text-xs ml-1">{item.unitType}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {item.salesVelocity?.toFixed(1)} u/d
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {formatCurrency(item.currentStock * item.basePrice)}
                      </td>
                      <td className="px-4 py-3">
                        {(urgency === 'critical' || urgency === 'high' || urgency === 'medium') && (
                          <button
                            onClick={() => setTransferTarget({ foodItemId: item.foodItemId, foodItemName: item.name, daysUntilExpiry: item.daysLeft })}
                            className="text-xs text-blue-600 hover:underline font-medium"
                          >
                            Transfer
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1 px-2 text-xs">←</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary py-1 px-2 text-xs">→</button>
            </div>
          </div>
        )}
      </div>

      {transferTarget && (
        <TransferModal
          prefill={transferTarget}
          onClose={() => setTransferTarget(null)}
          onSuccess={() => { setTransferTarget(null); refetch(); }}
        />
      )}
      {showAddModal && (
        <AddFoodItemModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); refetch(); }}
        />
      )}
    </div>
  );
};

export default InventoryPage;
