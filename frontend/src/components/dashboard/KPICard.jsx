const colorMap = {
  blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
  green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
};

const KPICard = ({ title, value, icon: Icon, color = 'blue', loading, alert }) => {
  return (
    <div className={`card flex items-center gap-4 ${alert ? 'ring-2 ring-red-400 dark:ring-red-500' : ''}`}>
      <div className={`p-3 rounded-xl ${colorMap[color]}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{title}</p>
        {loading ? (
          <div className="skeleton h-6 w-24 mt-1" />
        ) : (
          <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        )}
      </div>
    </div>
  );
};

export default KPICard;
