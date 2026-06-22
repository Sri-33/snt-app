import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { api } from '../lib/api';
import { formatDateISO } from '../lib/format';
import { useToast } from '../context/ToastContext';
import { enqueueAction } from '../lib/offlineQueue';
import {
  SNT_FROM_ADDRESS, COURIERS, COD_COURIERS, INDIAN_STATES,
} from '../constants';
import AddressLabel from '../components/AddressLabel';
import DualSlip from '../components/DualSlip';
import { PRINT_PAGE_STYLE } from '../components/CourierSlip';
import { isNativePlatform, nativePrintNode } from '../lib/print';

const emptyForm = () => ({
  date: formatDateISO(),
  courier: '',
  cod_prepaid: '',
  from_type: 'snt',
  from_address: SNT_FROM_ADDRESS,
  bundle_weight: '',
  to_name: '',
  to_address: '',
  to_city: '',
  to_district: '',
  to_state: '',
  to_pin: '',
  to_phone: '',
  tracking: '',
  amount: '',
  notes: '',
  save_address: false,
});

export default function NewEntry() {
  const [form, setForm] = useState(emptyForm);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedEntry, setSavedEntry] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const singleRef = useRef(null);
  const dualRef = useRef(null);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const searchTimeout = useRef(null);

  const printSingleWeb = useReactToPrint({
    contentRef: singleRef,
    documentTitle: 'SNT Address - Full A4',
    pageStyle: PRINT_PAGE_STYLE,
  });

  const printDualWeb = useReactToPrint({
    contentRef: dualRef,
    documentTitle: 'SNT Address - Two Slips',
    pageStyle: PRINT_PAGE_STYLE,
  });

  const printSingle = () => {
    if (isNativePlatform) {
      nativePrintNode(singleRef.current).catch((err) => {
        console.error('Native print failed', err);
        showToast('Unable to open the slip for printing.', 'error');
      });
    } else {
      printSingleWeb();
    }
  };

  const printDual = () => {
    if (isNativePlatform) {
      nativePrintNode(dualRef.current).catch((err) => {
        console.error('Native print failed', err);
        showToast('Unable to open the slip for printing.', 'error');
      });
    } else {
      printDualWeb();
    }
  };

  const isVRL = form.courier?.includes('VRL');
  const needsCodPrepaid = COD_COURIERS.includes(form.courier);

  const update = (field, value) => {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === 'from_type') {
        next.from_address = value === 'snt' ? SNT_FROM_ADDRESS : '';
      }
      if (field === 'courier') {
        next.cod_prepaid = '';
        next.bundle_weight = '';
      }
      return next;
    });
  };

  const searchAddresses = (q) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await api.getAddresses(q);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  };

  const selectAddress = (addr) => {
    setForm((f) => ({
      ...f,
      to_name: addr.name,
      to_address: addr.address,
      to_city: addr.city || '',
      to_district: addr.district || '',
      to_state: addr.state || '',
      to_pin: addr.pin || '',
      to_phone: addr.phone || '',
    }));
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.courier || !form.to_name) {
      showToast('Please fill required fields', 'error');
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      bundle_weight: form.bundle_weight ? parseFloat(form.bundle_weight) : null,
      amount: form.amount ? parseFloat(form.amount) : null,
      from_type: form.from_type,
    };
    delete payload.save_address;

    try {
      let entry;
      if (navigator.onLine) {
        entry = await api.createEntry(payload);
        if (form.save_address) {
          await api.createAddress({
            name: form.to_name,
            address: form.to_address,
            city: form.to_city,
            district: form.to_district,
            state: form.to_state,
            pin: form.to_pin,
            phone: form.to_phone,
          }).catch(() => {});
        }
        if (form.tracking) {
          try {
            await api.sendTracking({
              customerPhone: form.to_phone,
              customerName: form.to_name,
              trackingNumber: form.tracking,
              courierService: form.courier,
              orderId: entry.id,
            });
            showToast('Tracking sent ✓');
          } catch {
            showToast('Entry saved. Tracking webhook failed — retry from Log.', 'warning');
          }
        }
      } else {
        enqueueAction({ type: 'createEntry', payload, saveAddress: form.save_address });
        entry = { ...payload, id: `offline-${Date.now()}` };
        showToast('Saved offline — will sync when online', 'warning');
      }

      setSavedEntry(entry);
      setShowPrintModal(true);
      showToast('Entry saved successfully');
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSavedEntry(null);
    setShowPrintModal(false);
    setForm(emptyForm());
  };

  if (savedEntry) {
    return (
      <div className="space-y-4">
        <div className="card p-4 text-center">
          <p className="text-success font-semibold">Entry Saved!</p>
          <p className="text-sm text-muted mt-1">Choose a print option or save for later.</p>
        </div>

        <button
          onClick={() => setShowPrintModal(true)}
          className="w-full py-3 btn-primary"
        >
          Print Options
        </button>

        <div className="flex gap-2">
          <button onClick={resetForm} className="flex-1 py-3 btn-primary">
            New Entry
          </button>
          <button onClick={() => navigate('/log')} className="flex-1 py-3 bg-sand border border-line rounded-md font-medium text-ink hover:border-gold transition-colors">
            View Log
          </button>
        </div>

        <div className="hidden">
          <div ref={singleRef} className="print-area">
            <AddressLabel entry={savedEntry} />
          </div>
          <div ref={dualRef} className="print-area">
            <DualSlip entry={savedEntry} />
          </div>
        </div>

        {showPrintModal && (
          <PrintOptionsModal
            onSingle={() => { setShowPrintModal(false); setTimeout(printSingle, 100); }}
            onDual={() => { setShowPrintModal(false); setTimeout(printDual, 100); }}
            onSaveOnly={() => { setShowPrintModal(false); showToast('Saved. Print later from the Log.'); }}
            onClose={() => setShowPrintModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="page-title">New Courier Entry</h2>

      <Field label="Date *">
        <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)}
          className="input" required />
      </Field>

      <Field label="Courier Service *">
        <select value={form.courier} onChange={(e) => update('courier', e.target.value)} className="input" required>
          <option value="">Select courier</option>
          {COURIERS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>

      {needsCodPrepaid && (
        <Field label="COD or Prepaid? *">
          <div className="flex gap-4">
            {['COD', 'Prepaid'].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="cod_prepaid" value={opt}
                  checked={form.cod_prepaid === opt}
                  onChange={(e) => update('cod_prepaid', e.target.value)} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </Field>
      )}

      {isVRL && (
        <Field label="Bundle weight (kg)">
          <input type="number" step="0.1" min="0" value={form.bundle_weight}
            onChange={(e) => update('bundle_weight', e.target.value)} className="input" placeholder="e.g. 25" />
        </Field>
      )}

      <Field label="From Address">
        <select value={form.from_type} onChange={(e) => update('from_type', e.target.value)} className="input">
          <option value="snt">SNT – Sri Nandhini Tex</option>
          <option value="reseller">Reseller</option>
        </select>
        {form.from_type === 'reseller' && (
          <textarea value={form.from_address} onChange={(e) => update('from_address', e.target.value)}
            className="input mt-2" rows={3} placeholder="Enter reseller from address" />
        )}
        {form.from_type === 'snt' && (
          <pre className="text-xs text-muted mt-2 whitespace-pre-wrap bg-sand border border-line p-2 rounded-md">{SNT_FROM_ADDRESS}</pre>
        )}
      </Field>

      <Field label="To Name *">
        <div className="relative">
          <input type="text" value={form.to_name}
            onChange={(e) => { update('to_name', e.target.value); searchAddresses(e.target.value); }}
            onFocus={() => suggestions.length && setShowSuggestions(true)}
            className="input" required placeholder="Search saved address..." />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-20 w-full bg-white border border-line rounded-md mt-1 max-h-40 overflow-y-auto">
              {suggestions.map((s) => (
                <button key={s.id} type="button"
                  onClick={() => selectAddress(s)}
                  className="w-full text-left px-3 py-2 hover:bg-gold/5 text-sm border-b border-line">
                  <span className="font-medium text-ink">{s.name}</span>
                  <span className="text-subtle ml-2">{s.city}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Field>

      <Field label="To Address">
        <textarea value={form.to_address} onChange={(e) => update('to_address', e.target.value)}
          className="input" rows={3} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="City">
          <input type="text" value={form.to_city} onChange={(e) => update('to_city', e.target.value)} className="input" />
        </Field>
        <Field label="District">
          <input type="text" value={form.to_district} onChange={(e) => update('to_district', e.target.value)} className="input" />
        </Field>
      </div>

      <Field label="State">
        <select value={form.to_state} onChange={(e) => update('to_state', e.target.value)} className="input">
          <option value="">Select state</option>
          {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="PIN Code">
          <input type="text" value={form.to_pin} onChange={(e) => update('to_pin', e.target.value)} className="input" maxLength={6} />
        </Field>
        <Field label="Phone">
          <input type="tel" value={form.to_phone} onChange={(e) => update('to_phone', e.target.value)} className="input" />
        </Field>
      </div>

      <Field label="Tracking Number">
        <input type="text" value={form.tracking} onChange={(e) => update('tracking', e.target.value)} className="input" placeholder="Optional" />
      </Field>

      {form.cod_prepaid === 'COD' && (
        <Field label="Order Amount (₹)">
          <input type="number" step="0.01" min="0" value={form.amount}
            onChange={(e) => update('amount', e.target.value)} className="input" />
        </Field>
      )}

      <Field label="Notes">
        <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} className="input" rows={2} />
      </Field>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.save_address}
          onChange={(e) => update('save_address', e.target.checked)} />
        <span className="text-sm">Save this address for future use</span>
      </label>

      <button type="submit" disabled={saving}
        className="w-full py-3 btn-primary font-semibold disabled:opacity-50 active:scale-[0.98]">
        {saving ? 'Saving...' : 'Save & Print'}
      </button>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1">{label}</label>
      {children}
    </div>
  );
}

function PrintOptionsModal({ onSingle, onDual, onSaveOnly, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white border border-line rounded-md p-5 w-full max-w-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="page-title text-lg">Print Options</h3>
          <button onClick={onClose} className="text-subtle text-2xl leading-none hover:text-gold">&times;</button>
        </div>

        <OptionCard
          title="Single Address (Full A4)"
          desc="One address fills the entire A4 page. Large fonts."
          onClick={onSingle}
        />
        <OptionCard
          title="Two Addresses (Half A4 each)"
          desc="Same address printed on top and bottom halves. Cut along the dotted line for two slips."
          onClick={onDual}
        />
        <OptionCard
          title="Save Only (Print Later)"
          desc="Just save the entry. Print anytime from the Log screen."
          variant="muted"
          onClick={onSaveOnly}
        />
      </div>
    </div>
  );
}

function OptionCard({ title, desc, onClick, variant }) {
  const muted = variant === 'muted';
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-md p-4 border transition-colors ${
        muted
          ? 'border-line bg-sand hover:border-gold'
          : 'border-gold/40 bg-gold/5 hover:bg-gold/10'
      }`}
    >
      <div className={`font-semibold ${muted ? 'text-muted' : 'text-ink'}`}>{title}</div>
      <div className="text-xs text-muted mt-1">{desc}</div>
    </button>
  );
}
