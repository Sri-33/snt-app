import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { useUpdate } from '../context/UpdateContext';

export default function Settings() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { current, checking, updateAvailable, check, refreshNow } = useUpdate();
  const [checkedOnce, setCheckedOnce] = useState(false);

  const handleCheck = async () => {
    await check();
    setCheckedOnce(true);
  };

  const load = async () => {
    setLoading(true);
    try {
      setAddresses(await api.getAddresses());
    } catch {
      showToast('Failed to load addresses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this saved address?')) return;
    try {
      await api.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      showToast('Address deleted');
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="page-title">Settings</h2>

      <div className="card p-4">
        <h3 className="section-label mb-3">Saved Addresses</h3>
        {loading ? (
          <p className="text-subtle text-sm">Loading...</p>
        ) : addresses.length === 0 ? (
          <p className="text-subtle text-sm">No saved addresses yet. Save addresses when creating new entries.</p>
        ) : (
          <div className="space-y-2">
            {addresses.map((a) => (
              <div key={a.id} className="flex items-start justify-between border-b border-line pb-2">
                <div className="text-sm flex-1">
                  <div className="font-medium text-ink">{a.name}</div>
                  <div className="text-muted text-xs">{a.address}</div>
                  <div className="text-subtle text-xs">{a.city}, {a.state} {a.pin}</div>
                </div>
                <button onClick={() => handleDelete(a.id)} className="text-warning text-xs ml-2 shrink-0">
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-4">
        <h3 className="section-label mb-3">App Version</h3>
        <p className="text-[12px] text-[#888888]">Current: v{current}</p>

        <button
          type="button"
          onClick={handleCheck}
          disabled={checking}
          className={`mt-3 w-full py-2.5 rounded-md text-sm font-medium bg-[#111111] text-white transition-opacity ${checking ? 'opacity-60' : 'hover:opacity-90'}`}
        >
          {checking ? 'Checking...' : 'Check for Updates'}
        </button>

        {checkedOnce && !checking && (
          updateAvailable ? (
            <div className="mt-3">
              <p className="text-sm font-medium text-[#9A7F2E]">
                ⚡ Update available! Tap to refresh and get the latest version.
              </p>
              <button
                type="button"
                onClick={refreshNow}
                className="mt-2 w-full py-2.5 rounded-md text-sm font-semibold bg-[#9A7F2E] text-white hover:opacity-90 transition-opacity"
              >
                Refresh Now
              </button>
            </div>
          ) : (
            <p className="mt-3 text-sm font-medium text-[#2E7D32]">✓ You are on the latest version</p>
          )
        )}
      </div>

      <div className="card p-4 text-sm text-muted">
        <p><strong className="text-ink">App:</strong> SNT Courier Manager v{current}</p>
        <p className="mt-1"><strong className="text-ink">Company:</strong> Sri Nandhini Tex</p>
      </div>
    </div>
  );
}
