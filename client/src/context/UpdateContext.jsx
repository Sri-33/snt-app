import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { APP_VERSION } from '../version';

const UpdateContext = createContext(null);

function compareVersions(a, b) {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

export function UpdateProvider({ children }) {
  const [latest, setLatest] = useState(APP_VERSION);
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [dismissedVersion, setDismissedVersion] = useState(null);

  const updateAvailable = compareVersions(latest, APP_VERSION) > 0;
  const showBanner = updateAvailable && dismissedVersion !== latest;

  const check = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setChecking(true);
    try {
      const data = await api.getVersion();
      if (data?.version) setLatest(data.version);
      setLastChecked(Date.now());
      return data?.version || null;
    } catch {
      return null;
    } finally {
      if (!silent) setChecking(false);
    }
  }, []);

  const dismissBanner = useCallback(() => setDismissedVersion(latest), [latest]);

  const refreshNow = useCallback(() => {
    // Force reload from server (clears cached app shell)
    window.location.reload(true);
  }, []);

  useEffect(() => {
    check({ silent: true });
    const onFocus = () => check({ silent: true });
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [check]);

  return (
    <UpdateContext.Provider
      value={{
        current: APP_VERSION,
        latest,
        checking,
        lastChecked,
        updateAvailable,
        showBanner,
        check,
        dismissBanner,
        refreshNow,
      }}
    >
      {children}
    </UpdateContext.Provider>
  );
}

export function useUpdate() {
  const ctx = useContext(UpdateContext);
  if (!ctx) throw new Error('useUpdate must be used within UpdateProvider');
  return ctx;
}
