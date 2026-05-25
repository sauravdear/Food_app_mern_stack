import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../api/axiosConfig.js';

const STATUS_COLORS = {
  Pending: '#fbbf24',
  Approved: '#60a5fa',
  'In Transit': '#a78bfa',
  Completed: '#4ade80',
  Cancelled: '#9ca3af',
};

const TransferPipeline = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/transfers/analytics')
      .then(({ data: res }) => setData(res.data.statusBreakdown || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="card h-64"><div className="skeleton h-full w-full" /></div>;
  }

  const chartData = data.map((d) => ({
    status: d._id,
    count: d.count,
    value: d.totalValue?.toFixed(2),
  }));

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Transfer Pipeline
      </h3>
      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No transfers</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="status" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v, name) => [v, name === 'count' ? 'Transfers' : 'Value ($)']} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((d) => (
                <Cell key={d.status} fill={STATUS_COLORS[d.status] || '#94a3b8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default TransferPipeline;
