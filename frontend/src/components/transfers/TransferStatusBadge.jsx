import { getStatusColor } from '../../utils/formatters.js';

const TransferStatusBadge = ({ status }) => (
  <span className={`badge ${getStatusColor(status)}`}>{status}</span>
);

export default TransferStatusBadge;
