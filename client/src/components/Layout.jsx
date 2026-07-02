import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import SNTLogo from './SNTLogo';
import { useAuth } from '../context/AuthContext';
import { useUpdate } from '../context/UpdateContext';

export default function Layout() {
  const { logout, isAdmin } = useAuth();
  const { showBanner, refreshNow, dismissBanner } = useUpdate();

  return (
    <div className="min-h-screen bg-sand pb-20">
      {showBanner && (
        <div className="sticky top-0 z-50 bg-ink text-gold-light border-b border-gold/30">
          <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={refreshNow}
              className="flex-1 text-left text-sm font-medium text-white"
            >
              New update available — tap to refresh
            </button>
            <button
              type="button"
              onClick={dismissBanner}
              aria-label="Dismiss update banner"
              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-dim hover:bg-white/10 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-gradient-to-r from-amber-50 via-white to-violet-50 border-b border-gold/20 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SNTLogo size="sm" className="ring-2 ring-gold/40" />
            <div>
              <h1 className="font-brand text-base leading-tight text-ink">SRI NANDHINI TEX</h1>
              <p className="text-[10px] text-orange-600/80 tracking-[0.15em] uppercase font-semibold">Courier Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-0.5 rounded-full capitalize font-bold tracking-wide shadow-sm ${
              isAdmin
                ? 'bg-gradient-to-r from-gold to-amber-500 text-white'
                : 'bg-gradient-to-r from-ink to-gray-700 text-white'
            }`}>
              {isAdmin ? 'Admin' : 'Staff'}
            </span>
            <button
              onClick={logout}
              className="text-xs text-subtle hover:text-gold transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
