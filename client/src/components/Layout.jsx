import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import SNTLogo from './SNTLogo';
import { useAuth } from '../context/AuthContext';
import { useUpdate } from '../context/UpdateContext';

export default function Layout() {
  const { logout, isAdmin } = useAuth();
  const { showBanner, refreshNow, dismissBanner } = useUpdate();

  return (
    <div className="min-h-screen bg-white pb-20">
      {showBanner && (
        <div className="sticky top-0 z-50 bg-[#9A7F2E] text-white">
          <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={refreshNow}
              className="flex-1 text-left text-sm font-medium"
            >
              New update available — tap to refresh
            </button>
            <button
              type="button"
              onClick={dismissBanner}
              aria-label="Dismiss update banner"
              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-white/90 hover:bg-white/20 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white border-b border-[#E0E0E0]">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SNTLogo size="sm" className="ring-1 ring-gold/40" />
            <div>
              <h1 className="text-base leading-tight tracking-wide text-[#111111]">SRI NANDHINI TEX</h1>
              <p className="text-[10px] text-[#888888] tracking-wide">Courier Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-semibold ${
              isAdmin ? 'bg-gold text-white' : 'bg-[#111111] text-white'
            }`}>
              {isAdmin ? 'Admin' : 'Staff'}
            </span>
            <button
              onClick={logout}
              className="text-xs text-[#888888] hover:text-gold transition-colors"
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
