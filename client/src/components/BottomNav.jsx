import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const tabs = [
  { to: '/', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', active: 'text-amber-400' },
  { to: '/new', label: 'New Entry', icon: 'M12 4v16m8-8H4', active: 'text-gold-light' },
  { to: '/log', label: 'Log', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', active: 'text-blue-400' },
  { to: '/print', label: 'Print', icon: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z', active: 'text-violet-400' },
  { to: '/sales/new', label: 'Sales', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z', active: 'text-emerald-400' },
  { to: '/retail-bills', label: 'Bills', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z', active: 'text-rose-400' },
  {
    to: '/ai-tools',
    label: 'AI Tools',
    active: 'text-fuchsia-400',
    paths: [
      'm21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72',
      'm14 7 3 3',
      'M5 6v4',
      'M19 14v4',
      'M10 2v2',
      'M7 8H3',
      'M21 16h-4',
      'M11 3H9',
    ],
  },
  { to: '/analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', adminOnly: true, active: 'text-orange-400' },
];

const TabIcon = ({ tab }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {(tab.paths || [tab.icon]).map((d) => (
      <path key={d} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    ))}
  </svg>
);

export default function BottomNav() {
  const { isAdmin } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-ink via-[#1a1a1a] to-[#222] border-t border-gold/30 z-50 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.25)]">
      <div className="flex justify-around items-center h-16 w-full max-w-2xl mx-auto px-1">
        {tabs.map((tab) => {
          if (tab.adminOnly && !isAdmin) {
            return (
              <div
                key={tab.to}
                className="flex flex-col items-center justify-center flex-1 min-w-0 h-full text-white/30 cursor-not-allowed"
                title="Admin only"
              >
                <TabIcon tab={tab} />
                <span className="text-[10px] mt-0.5">{tab.label}</span>
              </div>
            );
          }

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 min-w-0 h-full transition-colors ${
                  isActive ? tab.active : 'text-white/55 hover:text-white/80'
                }`
              }
            >
              <TabIcon tab={tab} />
              <span className="text-[9px] mt-0.5 font-medium truncate max-w-full px-0.5">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
