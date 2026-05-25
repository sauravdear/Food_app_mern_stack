import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../api/axiosConfig.js';
import { categoryColors } from '../../utils/formatters.js';
import { formatCurrency } from '../../utils/formatters.js';

const CategoryBreakdown = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/categories')
      .then(({ data: res }) => setData(res.data.inventoryByCategory || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="card h-64"><div className="skeleton h-full w-full" /></div>;
  }

  const chartData = data.map((d) => ({ name: d._id, value: Math.round(d.totalValue) }));

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Inventory by Category
      </h3>
      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={categoryColors[entry.name] || '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [formatCurrency(v), 'Value']} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default CategoryBreakdown;
