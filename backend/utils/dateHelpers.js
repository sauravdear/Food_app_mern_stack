/**
 * Returns the number of days between now and a future date.
 * Negative values mean the date has already passed.
 */
export const daysUntil = (date) => {
  const now = new Date();
  const target = new Date(date);
  const diffMs = target - now;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Returns expiration urgency label based on days remaining.
 */
export const getExpirationUrgency = (daysLeft) => {
  if (daysLeft <= 0) return 'expired';
  if (daysLeft <= 1) return 'critical';
  if (daysLeft <= 3) return 'high';
  if (daysLeft <= 7) return 'medium';
  return 'low';
};

/**
 * Returns a date n days from now.
 */
export const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

/**
 * Formats a date to YYYY-MM-DD string.
 */
export const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

/**
 * Returns the start of today (midnight UTC).
 */
export const startOfToday = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * Returns date range array of the last n days.
 */
export const lastNDays = (n) => {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    d.setUTCHours(0, 0, 0, 0);
    return d;
  });
};
