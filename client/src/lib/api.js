const API_BASE = '/api';

function getHeaders() {
  const session = localStorage.getItem('snt_session');
  const role = session ? JSON.parse(session).role : null;
  return {
    'Content-Type': 'application/json',
    ...(role ? { 'X-User-Role': role } : {}),
  };
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

async function requestRaw(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: getHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res;
}

function buildQuery(params) {
  return new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
  ).toString();
}

export const api = {
  health: () => request('/health'),
  getVersion: () => request('/version'),
  getEntries: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/entries${qs ? `?${qs}` : ''}`);
  },
  getEntry: (id) => request(`/entries/${id}`),
  createEntry: (data) => request('/entries', { method: 'POST', body: JSON.stringify(data) }),
  updateEntry: (id, data) => request(`/entries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEntry: (id) => request(`/entries/${id}`, { method: 'DELETE' }),
  getAddresses: (q) => request(`/addresses${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  createAddress: (data) => request('/addresses', { method: 'POST', body: JSON.stringify(data) }),
  deleteAddress: (id) => request(`/addresses/${id}`, { method: 'DELETE' }),
  getAnalytics: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/analytics${qs ? `?${qs}` : ''}`);
  },
  exportData: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/analytics/export${qs ? `?${qs}` : ''}`);
  },
  sendTracking: (data) => request('/webhook/tracking', { method: 'POST', body: JSON.stringify(data) }),
  sendEmailReport: (data) => request('/webhook/email-report', { method: 'POST', body: JSON.stringify(data) }),
  getSettings: () => request('/webhook/settings'),

  getSales: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
    ).toString();
    return request(`/sales${qs ? `?${qs}` : ''}`);
  },
  getSale: (id) => request(`/sales/${id}`),
  createSale: (data) => request('/sales', { method: 'POST', body: JSON.stringify(data) }),
  deleteSale: (id) => request(`/sales/${id}`, { method: 'DELETE' }),
  checkSaleUnique: (field, value) =>
    request(`/sales/check?field=${encodeURIComponent(field)}&value=${encodeURIComponent(value)}`),
  getSalePlaces: () => request('/sales/places'),
  getSalesAnalytics: (params = {}) => {
    const qs = buildQuery(params);
    return request(`/sales/analytics${qs ? `?${qs}` : ''}`);
  },
  exportSales: (format, params = {}) => {
    const qs = buildQuery(params);
    return requestRaw(`/sales/export/${format}${qs ? `?${qs}` : ''}`);
  },
  dispatchSheet: (format, params = {}) => {
    const qs = buildQuery(params);
    return requestRaw(`/sales/dispatch/${format}${qs ? `?${qs}` : ''}`);
  },

  getRetailBills: (params = {}) => {
    const qs = buildQuery(params);
    return request(`/retail-bills${qs ? `?${qs}` : ''}`);
  },
  getRetailBillsSummary: () => request('/retail-bills/summary'),
};
