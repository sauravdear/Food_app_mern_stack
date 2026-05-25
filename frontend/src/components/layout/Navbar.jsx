import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Sun, Moon, Globe, Menu, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { ROLE_LABELS } from '../../utils/constants.js';

const Navbar = ({ onToggleSidebar }) => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const toggleLang = () => {
    const next = i18n.language.startsWith('es') ? 'en' : 'es';
    i18n.changeLanguage(next);
    setLangOpen(false);
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-3 sticky top-0 z-30 shadow-sm">
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2 flex-1">
        <span className="text-xl font-bold text-blue-600">🥬 FoodFlow</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Connection indicator */}
        <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${connected ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-500'}`}>
          {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span className="hidden sm:inline">{connected ? 'Live' : 'Offline'}</span>
        </div>

        {/* Language toggle */}
        <button
          onClick={toggleLang}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          title={t('language')}
        >
          <Globe size={18} />
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setDark((d) => !d)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          title={dark ? t('lightMode') : t('darkMode')}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User menu */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-600">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium leading-none">{user?.fullName}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{ROLE_LABELS[user?.role]}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
            {user?.fullName?.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={logout}
            className="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition"
          >
            {t('logout')}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
