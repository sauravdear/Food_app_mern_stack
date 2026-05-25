import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import api from '../../api/axiosConfig.js';
import toast from 'react-hot-toast';
import { FOOD_CATEGORIES, UNIT_TYPES } from '../../utils/constants.js';

const AddFoodItemModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: '', SKU: '', category: 'Dairy', batchNumber: '', expirationDate: '',
    basePrice: '', unitType: 'pieces', minimumStockThreshold: 10,
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/inventory/items', { ...form, basePrice: parseFloat(form.basePrice) });
      toast.success('Food item created');
      onSuccess?.();
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Add Food Item</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Item Name</label>
              <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div>
              <label className="label">SKU</label>
              <input className="input uppercase" value={form.SKU} onChange={(e) => set('SKU', e.target.value.toUpperCase())} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
                {FOOD_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unit Type</label>
              <select className="input" value={form.unitType} onChange={(e) => set('unitType', e.target.value)}>
                {UNIT_TYPES.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Batch Number</label>
              <input className="input" value={form.batchNumber} onChange={(e) => set('batchNumber', e.target.value)} required />
            </div>
            <div>
              <label className="label">Expiration Date</label>
              <input type="date" className="input" value={form.expirationDate} onChange={(e) => set('expirationDate', e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Base Price ($)</label>
              <input type="number" step="0.01" min="0" className="input" value={form.basePrice} onChange={(e) => set('basePrice', e.target.value)} required />
            </div>
            <div>
              <label className="label">Min. Stock Threshold</label>
              <input type="number" min="0" className="input" value={form.minimumStockThreshold} onChange={(e) => set('minimumStockThreshold', parseInt(e.target.value))} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Plus size={15} /> Add Item</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFoodItemModal;
