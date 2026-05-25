import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-center p-6">
    <div className="text-8xl mb-4">🥬</div>
    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
    <p className="text-gray-500 dark:text-gray-400 mb-8">This page seems to have expired.</p>
    <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
  </div>
);

export default NotFoundPage;
