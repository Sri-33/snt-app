import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PAGE_ACCENTS } from '../components/PageHeader';

const subTabs = [
  { to: '/sales/new', label: 'New Sale' },
  { to: '/sales/list', label: 'Sales List' },
  { to: '/sales/analytics', label: 'Analytics', adminOnly: true },
];

export default function Sales() {
  const { isAdmin } = useAuth();
  const tabActive = PAGE_ACCENTS.emerald.tab;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-emerald-50 border border-emerald-200 rounded-lg p-1">
        {subTabs.map((tab) => {
          if (tab.adminOnly && !isAdmin) return null;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex-1 text-center py-2 rounded-md text-sm font-semibold transition-all ${
                  isActive
                    ? tabActive
                    : 'text-emerald-800 hover:bg-white/70'
                }`
              }
            >
              {tab.label}
            </NavLink>
          );
        })}
      </div>

      <Outlet />
    </div>
  );
}
