import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/axiosConfig.js';
import { formatCurrency } from '../../utils/formatters.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const WasteReductionMetrics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/waste')
      .then(({ data: res }) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="card h-48"><div className="skeleton h-full w-full" /></div>;
  }

  const monthly = (data?.monthlyTrend || []).map((m) => ({
    month: `${MONTHS[m._id.month - 1]} ${m._id.year}`,
    wasteAvoided: m.totalAvoided,
    transfers: m.count,
  }));

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Waste Reduction Over Time
        </h3>
        <div className="flex gap-4 text-xs">
          <span className="text-gray-500">Total avoided: <strong className="text-green-600">{formatCurrency(data?.totalWasteAvoided)}</strong></span>
          <span className="text-gray-500">Completed transfers: <strong>{data?.totalCompletedTransfers}</strong></span>
        </div>
      </div>
      {monthly.length === 0 ? (
        <div className="h-36 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={monthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="wasteGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [formatCurrency(v), 'Waste Avoided']} />
            <Area type="monotone" dataKey="wasteAvoided" stroke="#22c55e" strokeWidth={2} fill="url(#wasteGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default WasteReductionMetrics;
