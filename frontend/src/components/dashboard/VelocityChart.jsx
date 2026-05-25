import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../../api/axiosConfig.js';
import { CHART_COLORS } from '../../utils/constants.js';
import { format } from 'date-fns';

const VelocityChart = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/velocity-trends', { params: { days: 14 } })
      .then(({ data: res }) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card h-72">
        <div className="skeleton h-4 w-40 mb-4" />
        <div className="skeleton h-56 w-full" />
      </div>
    );
  }

  if (!data?.dates?.length) {
    return (
      <div className="card h-72 flex items-center justify-center">
        <p className="text-gray-400">No velocity data available</p>
      </div>
    );
  }

  // Build chart data: one entry per date, with a key per series
  const chartData = data.dates.map((date, di) => {
    const entry = { date: format(new Date(date), 'MMM d') };
    data.series.slice(0, 5).forEach((series, si) => {
      entry[`s${si}`] = series.data[di]?.velocity || 0;
    });
    return entry;
  });

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        Sales Velocity Trends (14 Days)
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} unit=" u/d" width={50} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--tw-bg)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: 12,
            }}
            formatter={(v) => [`${v.toFixed(1)} u/day`]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {data.series.slice(0, 5).map((series, i) => (
            <Line
              key={i}
              type="monotone"
              dataKey={`s${i}`}
              name={series.label}
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VelocityChart;
