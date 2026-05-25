import { useState } from 'react';
import { ArrowRight, Zap, AlertTriangle, RefreshCw } from 'lucide-react';
import { useRecommendations } from '../../hooks/useInventory.js';
import { formatCurrency, formatDate, getUrgencyBadge } from '../../utils/formatters.js';
import TransferModal from '../transfers/TransferModal.jsx';

const RecommendationCard = ({ rec, onTransfer }) => (
  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition bg-white dark:bg-gray-800">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`badge ${getUrgencyBadge(rec.urgency)}`}>
            {rec.urgency === 'critical' && <AlertTriangle size={10} className="mr-1" />}
            {rec.urgency}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{rec.category}</span>
        </div>
        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{rec.foodItemName}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {rec.SKU} · Expires: {formatDate(rec.expirationDate)}</p>

        <div className="flex items-center gap-2 mt-2 text-xs text-gray-600 dark:text-gray-300">
          <span className="font-medium">{rec.sourceStoreCode}</span>
          <ArrowRight size={12} className="text-blue-500" />
          <span className="font-medium">{rec.destinationStoreCode}</span>
          <span className="text-gray-400">·</span>
          <span>{rec.quantity} units</span>
          {rec.distanceKm < 9999 && <span className="text-gray-400">{rec.distanceKm} km</span>}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <p className="text-sm font-bold text-green-600">
          {formatCurrency(rec.potentialWastageAvoided)}
        </p>
        <p className="text-xs text-gray-400">{rec.daysUntilExpiry}d left</p>
        <button
          onClick={() => onTransfer(rec)}
          className="btn-primary py-1 px-3 text-xs"
        >
          <Zap size={12} /> Transfer
        </button>
      </div>
    </div>
  </div>
);

const TransferRecommendations = () => {
  const { recommendations, loading, refetch } = useRecommendations({ thresholdDays: 5 });
  const [selected, setSelected] = useState(null);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Transfer Recommendations
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Items expiring within 5 days with redistribution opportunities</p>
        </div>
        <div className="flex items-center gap-2">
          {!loading && (
            <span className="badge badge-high">{recommendations.length} items</span>
          )}
          <button onClick={refetch} className="btn-secondary p-1.5" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No transfer recommendations at this time</p>
          <p className="text-xs mt-1">All items are well-stocked and within safe expiration windows</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {recommendations.slice(0, 10).map((rec, i) => (
            <RecommendationCard key={i} rec={rec} onTransfer={setSelected} />
          ))}
        </div>
      )}

      {selected && (
        <TransferModal
          prefill={selected}
          onClose={() => setSelected(null)}
          onSuccess={() => { setSelected(null); refetch(); }}
        />
      )}
    </div>
  );
};

export default TransferRecommendations;
