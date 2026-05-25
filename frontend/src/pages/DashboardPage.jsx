import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { useOverview } from '../hooks/useInventory.js';
import KPICard from '../components/dashboard/KPICard.jsx';
import VelocityChart from '../components/dashboard/VelocityChart.jsx';
import ExpirationGauge from '../components/dashboard/ExpirationGauge.jsx';
import TransferRecommendations from '../components/dashboard/TransferRecommendations.jsx';
import StoreComparison from '../components/dashboard/StoreComparison.jsx';
import WasteReductionMetrics from '../components/dashboard/WasteReductionMetrics.jsx';
import CategoryBreakdown from '../components/dashboard/CategoryBreakdown.jsx';
import TransferPipeline from '../components/dashboard/TransferPipeline.jsx';
import { formatCurrency, formatNumber } from '../utils/formatters.js';
import { Package, AlertTriangle, ArrowRightLeft, TrendingDown } from 'lucide-react';

const DashboardPage = () => {
  const { t } = useTranslation();
  const { overview, loading, refetch } = useOverview();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time food redistribution overview
          </p>
        </div>
        <button onClick={refetch} className="btn-secondary" disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('totalInventoryValue')}
          value={formatCurrency(overview?.totalInventoryValue)}
          icon={Package}
          color="blue"
          loading={loading}
        />
        <KPICard
          title={t('expiringToday')}
          value={formatNumber(overview?.expiringToday)}
          icon={AlertTriangle}
          color="red"
          loading={loading}
          alert={overview?.expiringToday > 0}
        />
        <KPICard
          title={t('pendingTransfers')}
          value={formatNumber(overview?.pendingTransfers)}
          icon={ArrowRightLeft}
          color="yellow"
          loading={loading}
        />
        <KPICard
          title={t('wasteAvoided')}
          value={formatCurrency(overview?.wasteAvoided)}
          icon={TrendingDown}
          color="green"
          loading={loading}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <VelocityChart />
        </div>
        <ExpirationGauge summary={overview?.expirationSummary} loading={loading} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoryBreakdown />
        <TransferPipeline />
      </div>

      {/* Store Comparison */}
      <StoreComparison />

      {/* Recommendations */}
      <TransferRecommendations />

      {/* Waste metrics */}
      <WasteReductionMetrics />
    </div>
  );
};

export default DashboardPage;
