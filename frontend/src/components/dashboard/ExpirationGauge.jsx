import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#dc2626', '#ea580c', '#ca8a04', '#16a34a'];
const LABELS = ['Expired/Today', '1-2 Days', '3-5 Days', '5+ Days'];

const ExpirationGauge = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="card h-72">
        <div className="skeleton h-4 w-36 mb-4" />
        <div className="skeleton h-52 w-full rounded-full" />
      </div>
    );
  }

  const data = [
    { name: LABELS[0], value: summary?.expiredOrToday || 0 },
    { name: LABELS[1], value: summary?.oneTwodays || 0 },
    { name: LABELS[2], value: summary?.threeFiveDays || 0 },
    { name: LABELS[3], value: summary?.fivePlusDays || 0 },
  ].filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Expiration Risk Overview
      </h3>
      {total === 0 ? (
        <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No expiring items</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [v, 'items']} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
      {summary?.totalPotentialLoss > 0 && (
        <p className="text-xs text-center text-red-600 mt-1 font-medium">
          Potential loss: ${summary.totalPotentialLoss.toFixed(2)}
        </p>
      )}
    </div>
  );
};

export default ExpirationGauge;
