import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const subTabs = [
  { to: '/sales/new', label: 'New Sale' },
  { to: '/sales/list', label: 'Sales List' },
  { to: '/sales/analytics', label: 'Analytics', adminOnly: true },
];

export default function Sales() {
  const { isAdmin } = useAuth();

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-sand border border-line rounded-md p-1">
        {subTabs.map((tab) => {
          if (tab.adminOnly && !isAdmin) return null;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex-1 text-center py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-ink text-white' : 'text-ink hover:text-gold'
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
