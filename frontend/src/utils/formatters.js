import { format, formatDistanceToNow } from 'date-fns';

export const formatCurrency = (value, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value || 0);
};

export const formatDate = (date, fmt = 'MMM d, yyyy') => {
  if (!date) return 'N/A';
  return format(new Date(date), fmt);
};

export const formatDatetime = (date) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'MMM d, yyyy HH:mm');
};

export const formatRelative = (date) => {
  if (!date) return 'N/A';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatNumber = (n) => {
  if (n === null || n === undefined) return '0';
  return new Intl.NumberFormat('en-US').format(n);
};

export const formatVelocity = (v) => `${(v || 0).toFixed(1)} units/day`;

export const getDaysLeftColor = (daysLeft) => {
  if (daysLeft <= 0) return 'text-red-700 bg-red-100';
  if (daysLeft <= 1) return 'text-red-600 bg-red-50';
  if (daysLeft <= 3) return 'text-orange-600 bg-orange-50';
  if (daysLeft <= 7) return 'text-yellow-600 bg-yellow-50';
  return 'text-green-600 bg-green-50';
};

export const getUrgencyBadge = (urgency) => {
  const map = {
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
    expired: 'badge-critical',
  };
  return map[urgency] || 'badge-low';
};

export const getStatusColor = (status) => {
  const map = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Approved: 'bg-blue-100 text-blue-800',
    'In Transit': 'bg-purple-100 text-purple-800',
    Completed: 'bg-green-100 text-green-800',
    Cancelled: 'bg-gray-100 text-gray-600',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};

export const categoryColors = {
  Dairy: '#60a5fa',
  Meat: '#f87171',
  Produce: '#4ade80',
  Bakery: '#fbbf24',
  Seafood: '#38bdf8',
  Prepared: '#a78bfa',
};
