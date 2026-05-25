import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Filter } from 'lucide-react';
import api from '../api/axiosConfig.js';
import TransferModal from '../components/transfers/TransferModal.jsx';
import TransferStatusBadge from '../components/transfers/TransferStatusBadge.jsx';
import { formatDate, formatDatetime, formatCurrency } from '../utils/formatters.js';
import { TRANSFER_STATUSES } from '../utils/constants.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import toast from 'react-hot-toast';

const TransfersPage = () => {
  const { user, hasRole } = useAuth();
  const { socket } = useSocket();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/transfers', { params });
      setTransfers(data.data);
      setTotal(data.total);
    } catch {
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchTransfers(); }, [fetchTransfers]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchTransfers();
    socket.on('transfer:created', handler);
    socket.on('transfer:statusUpdate', handler);
    return () => { socket.off('transfer:created', handler); socket.off('transfer:statusUpdate', handler); };
  }, [socket, fetchTransfers]);

  const handleApprove = async (id) => {
    try {
      await api.put(`/transfers/${id}/approve`);
      toast.success('Transfer approved');
      fetchTransfers();
    } catch { /* handled */ }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/transfers/${id}/status`, { status });
      toast.success(`Status updated to ${status}`);
      fetchTransfers();
    } catch { /* handled */ }
  };

  const totalPages = Math.ceil(total / 15);
  const canApprove = hasRole('admin', 'regional_manager', 'store_manager');

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transfers</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total transfer(s)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={15} /> New Transfer
          </button>
          <button onClick={fetchTransfers} className="btn-secondary" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => { setStatusFilter(''); setPage(1); }}
          className={statusFilter === '' ? 'btn-primary py-1 px-3 text-xs' : 'btn-secondary py-1 px-3 text-xs'}
        >All</button>
        {TRANSFER_STATUSES.map((s) => (
          <button key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={statusFilter === s ? 'btn-primary py-1 px-3 text-xs' : 'btn-secondary py-1 px-3 text-xs'}
          >{s}</button>
        ))}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Transfer ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Item</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">From → To</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Qty</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Waste Avoided</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Created</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : transfers.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No transfers found</td></tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t._id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">{t.transferId}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{t.foodItemName}</div>
                      <div className="text-xs text-gray-500">{t.reason}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="text-gray-600 dark:text-gray-300">{t.sourceStoreName}</div>
                      <div className="text-gray-400">→ {t.destinationStoreName}</div>
                    </td>
                    <td className="px-4 py-3 font-medium">{t.quantity}</td>
                    <td className="px-4 py-3"><TransferStatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-green-600 font-medium">{formatCurrency(t.wastageAvoided)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(t.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {t.status === 'Pending' && canApprove && (
                          <button onClick={() => handleApprove(t._id)} className="text-xs text-green-600 hover:underline font-medium">Approve</button>
                        )}
                        {t.status === 'Approved' && (
                          <button onClick={() => handleStatusUpdate(t._id, 'In Transit')} className="text-xs text-purple-600 hover:underline font-medium">Transit</button>
                        )}
                        {t.status === 'In Transit' && (
                          <button onClick={() => handleStatusUpdate(t._id, 'Completed')} className="text-xs text-blue-600 hover:underline font-medium">Complete</button>
                        )}
                        {['Pending', 'Approved'].includes(t.status) && (
                          <button onClick={() => handleStatusUpdate(t._id, 'Cancelled')} className="text-xs text-red-500 hover:underline">Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500">Page {page} of {totalPages} ({total} results)</span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1 px-2 text-xs">←</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary py-1 px-2 text-xs">→</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <TransferModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); fetchTransfers(); }} />
      )}
    </div>
  );
};

export default TransfersPage;
