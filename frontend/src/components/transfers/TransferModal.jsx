import { useState, useEffect } from 'react';
import { X, ArrowRight, AlertTriangle } from 'lucide-react';
import api from '../../api/axiosConfig.js';
import toast from 'react-hot-toast';
import { formatDate, formatCurrency } from '../../utils/formatters.js';

const TransferModal = ({ prefill = null, onClose, onSuccess }) => {
  const [stores, setStores] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [form, setForm] = useState({
    foodItemId: prefill?.foodItemId || '',
    sourceStoreId: prefill?.sourceStoreId || '',
    destinationStoreId: prefill?.destinationStoreId || '',
    quantity: prefill?.quantity || 1,
    reason: 'Expiration Risk',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/stores').then((r) => r.data.data),
      api.get('/inventory/items').then((r) => r.data.data),
    ]).then(([s, f]) => {
      setStores(s);
      setFoodItems(f);
    }).finally(() => setDataLoading(false));
  }, []);

  const selectedItem = foodItems.find((f) => f._id === form.foodItemId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/transfers', form);
      toast.success('Transfer created successfully');
      onSuccess?.();
    } catch {
      // Error shown by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Create Transfer</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={18} />
          </button>
        </div>

        {/* Prefill info banner */}
        {prefill && (
          <div className="mx-5 mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg flex items-start gap-2">
            <AlertTriangle size={16} className="text-orange-500 mt-0.5 shrink-0" />
            <div className="text-xs text-orange-700 dark:text-orange-300">
              <strong>{prefill.foodItemName}</strong> expires in {prefill.daysUntilExpiry} day(s).
              Recommended transfer to avoid {formatCurrency(prefill.potentialWastageAvoided)} in waste.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Food Item</label>
            <select className="input" value={form.foodItemId} onChange={(e) => setForm({ ...form, foodItemId: e.target.value })} required disabled={dataLoading}>
              <option value="">Select food item...</option>
              {foodItems.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name} (SKU: {f.SKU}) — exp: {formatDate(f.expirationDate)}
                </option>
              ))}
            </select>
            {selectedItem && (
              <p className="text-xs text-gray-500 mt-1">
                Price: {formatCurrency(selectedItem.basePrice)} / {selectedItem.unitType}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Source Store</label>
              <select className="input" value={form.sourceStoreId} onChange={(e) => setForm({ ...form, sourceStoreId: e.target.value })} required disabled={dataLoading}>
                <option value="">Source...</option>
                {stores.map((s) => (
                  <option key={s._id} value={s._id} disabled={s._id === form.destinationStoreId}>
                    {s.storeName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Destination Store</label>
              <select className="input" value={form.destinationStoreId} onChange={(e) => setForm({ ...form, destinationStoreId: e.target.value })} required disabled={dataLoading}>
                <option value="">Destination...</option>
                {stores.map((s) => (
                  <option key={s._id} value={s._id} disabled={s._id === form.sourceStoreId}>
                    {s.storeName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Quantity</label>
              <input type="number" className="input" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) })} required />
              {selectedItem && form.quantity > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  Saves ≈ {formatCurrency(form.quantity * selectedItem.basePrice)}
                </p>
              )}
            </div>
            <div>
              <label className="label">Reason</label>
              <select className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
                <option>Expiration Risk</option>
                <option>Stock Optimization</option>
                <option>Emergency Transfer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Notes (optional)</label>
            <textarea className="input h-20 resize-none" placeholder="Additional notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                <span className="flex items-center gap-2"><ArrowRight size={15} /> Create Transfer</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferModal;
