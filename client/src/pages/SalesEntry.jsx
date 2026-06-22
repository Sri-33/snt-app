import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { SALES_COURIERS } from '../constants';

const emptyForm = () => ({
  customer_name: '',
  place: '',
  saree_name: '',
  weight: '',
  worth: '',
  phone: '',
  payment_type: 'PREPAID',
  cod_amount: '',
  payment_ref: '',
  courier: '',
  tracking_number: '',
});

export default function SalesEntry() {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [places, setPlaces] = useState([]);
  const [showPlaces, setShowPlaces] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const { showToast } = useToast();

  useEffect(() => {
    api.getSalePlaces().then(setPlaces).catch(() => setPlaces([]));
  }, []);

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((e) => ({ ...e, [field]: null }));
  };

  const DUP_MESSAGES = {
    payment_ref: 'This UTR already used',
    tracking_number: 'This tracking number already used',
  };

  const checkUnique = async (field) => {
    const value = form[field]?.trim();
    if (!value) return;
    try {
      const { exists } = await api.checkSaleUnique(field, value);
      setFieldErrors((e) => ({
        ...e,
        [field]: exists ? DUP_MESSAGES[field] : null,
      }));
    } catch {
      /* ignore network errors on blur */
    }
  };

  const placeMatches = form.place.trim()
    ? places.filter((p) => p.toLowerCase().includes(form.place.trim().toLowerCase()) && p.toLowerCase() !== form.place.trim().toLowerCase())
    : [];

  const isCod = form.payment_type === 'COD';

  const handleSubmit = async (e) => {
    e.preventDefault();

    const required = [
      ['customer_name', 'Customer Name'],
      ['place', 'Place / Destination'],
      ['saree_name', 'Saree Name'],
      ['weight', 'Weight'],
      ['worth', 'Amount'],
      ['phone', 'Phone Number'],
      ['courier', 'Courier'],
      ['tracking_number', 'Courier Tracking Number'],
    ];
    if (isCod) {
      required.push(['cod_amount', 'COD Amount']);
    } else {
      required.push(['payment_ref', 'Payment UTR Number']);
    }

    const missing = required.find(([key]) => !String(form[key]).trim());
    if (missing) {
      showToast(`${missing[1]} is required`, 'error');
      return;
    }
    if (fieldErrors.payment_ref || fieldErrors.tracking_number) {
      showToast('Fix the duplicate UTR / tracking number', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.createSale({
        ...form,
        weight: form.weight ? Number(form.weight) : null,
        worth: form.worth ? Number(form.worth) : null,
        cod_amount: isCod && form.cod_amount ? Number(form.cod_amount) : null,
      });
      showToast('Sale saved successfully');
      setForm(emptyForm());
      setFieldErrors({});
      api.getSalePlaces().then(setPlaces).catch(() => {});
    } catch (err) {
      if (err.data?.field) {
        setFieldErrors((fe) => ({ ...fe, [err.data.field]: err.message }));
      }
      showToast(err.message || 'Failed to save sale', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="page-title">Sales Entry</h2>

      <div>
        <label className="block text-sm font-medium mb-1 text-ink">Customer Name *</label>
        <input
          type="text"
          value={form.customer_name}
          onChange={(e) => update('customer_name', e.target.value)}
          className="input"
          placeholder="Customer name"
        />
      </div>

      <div className="relative">
        <label className="block text-sm font-medium mb-1 text-ink">Place / Destination *</label>
        <input
          type="text"
          value={form.place}
          onChange={(e) => { update('place', e.target.value); setShowPlaces(true); }}
          onFocus={() => setShowPlaces(true)}
          onBlur={() => setTimeout(() => setShowPlaces(false), 150)}
          className="input"
          placeholder="City / town"
          autoComplete="off"
        />
        {showPlaces && placeMatches.length > 0 && (
          <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-line rounded-md shadow-lg max-h-44 overflow-y-auto">
            {placeMatches.slice(0, 8).map((p) => (
              <button
                type="button"
                key={p}
                onMouseDown={() => { update('place', p); setShowPlaces(false); }}
                className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-sand"
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-ink">Saree Name *</label>
        <input
          type="text"
          value={form.saree_name}
          onChange={(e) => update('saree_name', e.target.value)}
          className="input"
          placeholder="Saree / product name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-ink">Weight (kg) *</label>
        <input
          type="number"
          inputMode="decimal"
          value={form.weight}
          onChange={(e) => update('weight', e.target.value)}
          className="input"
          placeholder="0"
          min="0"
          step="0.01"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-ink">Amount (₹) *</label>
        <input
          type="number"
          inputMode="decimal"
          value={form.worth}
          onChange={(e) => update('worth', e.target.value)}
          className="input"
          placeholder="0"
          min="0"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-ink">Phone Number *</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
          className="input"
          placeholder="Phone"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-ink">Payment Type *</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => update('payment_type', 'PREPAID')}
            className={`py-3 rounded-md text-sm font-semibold border-[1.5px] transition-colors ${
              !isCod
                ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
                : 'bg-white text-[#2E7D32] border-[#2E7D32]'
            }`}
          >
            PREPAID
          </button>
          <button
            type="button"
            onClick={() => update('payment_type', 'COD')}
            className={`py-3 rounded-md text-sm font-semibold border-[1.5px] transition-colors ${
              isCod
                ? 'bg-[#9A7F2E] text-white border-[#9A7F2E]'
                : 'bg-white text-[#9A7F2E] border-[#9A7F2E]'
            }`}
          >
            COD
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          isCod ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <label className="block text-sm font-medium mb-1 text-ink">COD Amount (₹) *</label>
        <input
          type="number"
          inputMode="decimal"
          value={form.cod_amount}
          onChange={(e) => update('cod_amount', e.target.value)}
          className="input"
          placeholder="0"
          min="0"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-ink">
          Payment UTR Number {isCod ? <span className="text-subtle font-normal">(optional)</span> : '*'}
        </label>
        <input
          type="text"
          value={form.payment_ref}
          onChange={(e) => update('payment_ref', e.target.value)}
          onBlur={() => checkUnique('payment_ref')}
          className={`input ${fieldErrors.payment_ref ? 'border-[#D32F2F]' : ''}`}
          placeholder="UTR / payment reference"
        />
        {fieldErrors.payment_ref && (
          <p className="text-[#D32F2F] text-xs mt-1 font-medium">{fieldErrors.payment_ref}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-ink">Courier *</label>
        <select
          value={form.courier}
          onChange={(e) => update('courier', e.target.value)}
          className="input"
        >
          <option value="">Select courier</option>
          {SALES_COURIERS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-ink">Courier Tracking Number *</label>
        <input
          type="text"
          value={form.tracking_number}
          onChange={(e) => update('tracking_number', e.target.value)}
          onBlur={() => checkUnique('tracking_number')}
          className={`input ${fieldErrors.tracking_number ? 'border-[#D32F2F]' : ''}`}
          placeholder="Tracking number"
        />
        {fieldErrors.tracking_number && (
          <p className="text-[#D32F2F] text-xs mt-1 font-medium">{fieldErrors.tracking_number}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 btn-primary disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Sale'}
      </button>
    </form>
  );
}
