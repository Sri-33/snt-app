import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { UpdateProvider } from './context/UpdateContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import NewEntry from './pages/NewEntry';
import Log from './pages/Log';
import PrintPage from './pages/PrintPage';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Sales from './pages/Sales';
import SalesEntry from './pages/SalesEntry';
import SalesList from './pages/SalesList';
import SalesAnalytics from './pages/SalesAnalytics';
import RetailBills from './pages/RetailBills';
import AITools from './pages/AITools';
import { useEffect } from 'react';
import { flushQueue } from './lib/offlineQueue';
import { api } from './lib/api';
import { useToast } from './context/ToastContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-subtle">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function OfflineSync() {
  const { showToast } = useToast();

  useEffect(() => {
    const sync = async () => {
      const { flushed, failed } = await flushQueue(async (item) => {
        if (item.type === 'createEntry') {
          const entry = await api.createEntry(item.payload);
          if (item.saveAddress) {
            await api.createAddress({
              name: item.payload.to_name,
              address: item.payload.to_address,
              city: item.payload.to_city,
              district: item.payload.to_district,
              state: item.payload.to_state,
              pin: item.payload.to_pin,
              phone: item.payload.to_phone,
            });
          }
          if (item.payload.tracking) {
            await api.sendTracking({
              customerPhone: item.payload.to_phone,
              customerName: item.payload.to_name,
              trackingNumber: item.payload.tracking,
              courierService: item.payload.courier,
              orderId: entry.id,
            });
          }
        }
      });
      if (flushed > 0) showToast(`Synced ${flushed} offline action(s)`);
      if (failed > 0) showToast(`${failed} action(s) failed to sync`, 'warning');
    };

    window.addEventListener('online', sync);
    if (navigator.onLine) sync();
    return () => window.removeEventListener('online', sync);
  }, [showToast]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <UpdateProvider>
        <BrowserRouter>
          <OfflineSync />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Home />} />
              <Route path="new" element={<NewEntry />} />
              <Route path="log" element={<Log />} />
              <Route path="print" element={<PrintPage />} />
              <Route path="analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
              <Route path="sales" element={<Sales />}>
                <Route index element={<Navigate to="/sales/new" replace />} />
                <Route path="new" element={<SalesEntry />} />
                <Route path="list" element={<SalesList />} />
                <Route path="analytics" element={<AdminRoute><SalesAnalytics /></AdminRoute>} />
              </Route>
              <Route path="settings" element={<Settings />} />
              <Route path="retail-bills" element={<RetailBills />} />
              <Route path="ai-tools" element={<AITools />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        </UpdateProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
