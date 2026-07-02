import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import {
  Truck, MapPin, Package, FileText, CheckCircle2, Eye, Scissors, Bookmark,
  ChevronLeft, ChevronRight, Search, Users,
} from 'lucide-react';
import { api } from '../lib/api';
import { formatDateISO } from '../lib/format';
import PageHeader, { CardHead } from '../components/PageHeader';
import { useToast } from '../context/ToastContext';
import { enqueueAction } from '../lib/offlineQueue';
import {
  SNT_FROM_ADDRESS, COURIERS, COD_COURIERS, INDIAN_STATES,
} from '../constants';
import AddressLabel from '../components/AddressLabel';
import DualSlip from '../components/DualSlip';
import LabelPreview from '../components/LabelPreview';
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

function formToEntry(form) {
  return {
    ...form,
    bundle_weight: form.bundle_weight ? parseFloat(form.bundle_weight) : null,
    amount: form.amount ? parseFloat(form.amount) : null,
  };
}

function addressToEntry(addr, form) {
  return formToEntry({
    ...form,
    to_name: addr.name,
    to_address: addr.address || '',
    to_city: addr.city || '',
    to_district: addr.district || '',
    to_state: addr.state || '',
    to_pin: addr.pin || '',
    to_phone: addr.phone || '',
  });
}

export default function NewEntry() {
  const [form, setForm] = useState(emptyForm);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedEntry, setSavedEntry] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [previewMode, setPreviewMode] = useState('single');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressFilter, setAddressFilter] = useState('');
  const [selectedPreviewIds, setSelectedPreviewIds] = useState(new Set());
  const [activePreviewId, setActivePreviewId] = useState(null);
  const singleRef = useRef(null);
  const dualRef = useRef(null);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const searchTimeout = useRef(null);

  useEffect(() => {
    api.getAddresses()
      .then(setSavedAddresses)
      .catch(() => setSavedAddresses([]))
      .finally(() => setAddressesLoading(false));
  }, []);

  const filteredAddresses = useMemo(() => {
    const q = addressFilter.trim().toLowerCase();
    if (!q) return savedAddresses;
    return savedAddresses.filter((a) => {
      const hay = [a.name, a.address, a.city, a.district, a.state, a.pin, a.phone]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [savedAddresses, addressFilter]);

  const selectedPreviewList = useMemo(
    () => savedAddresses.filter((a) => selectedPreviewIds.has(a.id)),
    [savedAddresses, selectedPreviewIds],
  );

  const activePreviewAddress = savedAddresses.find((a) => a.id === activePreviewId) || null;
  const activePreviewIndex = selectedPreviewList.findIndex((a) => a.id === activePreviewId);

  const previewEntry = savedEntry
    || (activePreviewAddress ? addressToEntry(activePreviewAddress, form) : formToEntry(form));

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
    if (['to_name', 'to_address', 'to_city', 'to_district', 'to_state', 'to_pin', 'to_phone'].includes(field)) {
      setActivePreviewId(null);
    }
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

  const applyAddressToForm = (addr) => {
    setForm((f) => ({
      ...f,
      to_name: addr.name,
      to_address: addr.address || '',
      to_city: addr.city || '',
      to_district: addr.district || '',
      to_state: addr.state || '',
      to_pin: addr.pin || '',
      to_phone: addr.phone || '',
    }));
  };

  const selectAddress = (addr) => {
    applyAddressToForm(addr);
    setSelectedPreviewIds((prev) => new Set(prev).add(addr.id));
    setActivePreviewId(addr.id);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const activatePreviewAddress = (addr) => {
    setSelectedPreviewIds((prev) => new Set(prev).add(addr.id));
    setActivePreviewId(addr.id);
    applyAddressToForm(addr);
  };

  const togglePreviewAddress = (addr) => {
    if (selectedPreviewIds.has(addr.id)) {
      const next = new Set(selectedPreviewIds);
      next.delete(addr.id);
      setSelectedPreviewIds(next);
      if (activePreviewId === addr.id) {
        const remaining = savedAddresses.filter((a) => next.has(a.id));
        if (remaining[0]) activatePreviewAddress(remaining[0]);
        else setActivePreviewId(null);
      }
    } else {
      activatePreviewAddress(addr);
    }
  };

  const stepPreviewAddress = (delta) => {
    if (selectedPreviewList.length < 2) return;
    const idx = activePreviewIndex >= 0 ? activePreviewIndex : 0;
    const next = selectedPreviewList[(idx + delta + selectedPreviewList.length) % selectedPreviewList.length];
    if (next) activatePreviewAddress(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.courier || !form.to_name) {
      showToast('Please fill required fields', 'error');
      return;
    }

    setSaving(true);
    const payload = formToEntry(form);
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
    setPreviewMode('single');
    setSelectedPreviewIds(new Set());
    setActivePreviewId(null);
    setAddressFilter('');
  };

  const printHidden = (
    <div className="hidden">
      <div ref={singleRef} className="print-area">
        <AddressLabel entry={previewEntry} />
      </div>
      <div ref={dualRef} className="print-area">
        <DualSlip entry={previewEntry} />
      </div>
    </div>
  );

  if (savedEntry) {
    return (
      <div className="space-y-4">
        <div className="card overflow-hidden">
          <div className="px-4 py-5 text-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-b border-emerald-100">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200 mb-3">
              <CheckCircle2 className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <p className="font-display text-lg text-ink">Entry Saved</p>
            <p className="text-sm text-muted mt-1">{savedEntry.to_name} · {savedEntry.courier}</p>
          </div>
        </div>

        <PreviewPanel
          entry={previewEntry}
          mode={previewMode}
          onModeChange={setPreviewMode}
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setPreviewMode('single');
              setTimeout(printSingle, 100);
            }}
            className="flex flex-col items-center gap-2 py-4 rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 hover:border-amber-400 transition-colors active:scale-[0.98]"
          >
            <Eye className="w-5 h-5 text-amber-700" />
            <span className="text-xs font-bold text-ink uppercase tracking-wide">Print Full A4</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPreviewMode('dual');
              setTimeout(printDual, 100);
            }}
            className="flex flex-col items-center gap-2 py-4 rounded-lg border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 hover:border-violet-400 transition-colors active:scale-[0.98]"
          >
            <Scissors className="w-5 h-5 text-violet-700" />
            <span className="text-xs font-bold text-ink uppercase tracking-wide">Print 2 Slips</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowPrintModal(true)}
          className="w-full py-3 btn-primary font-semibold"
        >
          More Print Options
        </button>

        <div className="flex gap-2">
          <button type="button" onClick={resetForm} className="flex-1 py-3 btn-primary">
            New Entry
          </button>
          <button
            type="button"
            onClick={() => navigate('/log')}
            className="flex-1 py-3 bg-white border border-line rounded-md font-medium text-ink hover:border-gold transition-colors"
          >
            View Log
          </button>
        </div>

        {printHidden}

        {showPrintModal && (
          <PrintOptionsModal
            entry={previewEntry}
            previewMode={previewMode}
            onPreviewModeChange={setPreviewMode}
            onSingle={() => { setShowPrintModal(false); setPreviewMode('single'); setTimeout(printSingle, 100); }}
            onDual={() => { setShowPrintModal(false); setPreviewMode('dual'); setTimeout(printDual, 100); }}
            onSaveOnly={() => { setShowPrintModal(false); showToast('Saved. Print later from the Log.'); }}
            onClose={() => setShowPrintModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-2">
      <PageHeader title="New Courier Entry" subtitle="Select saved address, preview label & dispatch" accent="amber" />

      {/* Dispatch */}
      <section className="card overflow-hidden">
        <CardHead title="Dispatch Details" accent="amber" />
        <div className="p-4 space-y-4">
          <Field label="Date *" icon={Truck}>
            <input
              type="date"
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
              className="input"
              required
            />
          </Field>

          <Field label="Courier Service *" icon={Truck}>
            <select
              value={form.courier}
              onChange={(e) => update('courier', e.target.value)}
              className="input"
              required
            >
              <option value="">Select courier</option>
              {COURIERS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          {needsCodPrepaid && (
            <div>
              <label className="section-label block mb-2">COD or Prepaid? *</label>
              <div className="grid grid-cols-2 gap-2">
                {['COD', 'Prepaid'].map((opt) => {
                  const isCod = opt === 'COD';
                  const active = form.cod_prepaid === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => update('cod_prepaid', opt)}
                      className={`py-3 rounded-lg text-sm font-bold border-[1.5px] transition-all active:scale-[0.98] ${
                        active
                          ? isCod
                            ? 'bg-[#E65100] text-white border-[#E65100] shadow-md shadow-orange-200'
                            : 'bg-[#2E7D32] text-white border-[#2E7D32] shadow-md shadow-emerald-200'
                          : isCod
                            ? 'bg-orange-50 text-[#E65100] border-orange-200 hover:border-orange-400'
                            : 'bg-emerald-50 text-[#2E7D32] border-emerald-200 hover:border-emerald-400'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isVRL && (
            <Field label="Bundle weight (kg)">
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.bundle_weight}
                onChange={(e) => update('bundle_weight', e.target.value)}
                className="input"
                placeholder="e.g. 25"
              />
            </Field>
          )}
        </div>
      </section>

      {/* From */}
      <section className="card overflow-hidden">
        <CardHead title="From Address" accent="blue" />
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'snt', label: 'SNT', sub: 'Sri Nandhini Tex' },
              { value: 'reseller', label: 'Reseller', sub: 'Custom address' },
            ].map(({ value, label, sub }) => (
              <button
                key={value}
                type="button"
                onClick={() => update('from_type', value)}
                className={`text-left p-3 rounded-lg border-[1.5px] transition-all active:scale-[0.98] ${
                  form.from_type === value
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm'
                    : 'border-line bg-white hover:border-blue-200'
                }`}
              >
                <span className={`block text-sm font-bold ${form.from_type === value ? 'text-blue-700' : 'text-ink'}`}>{label}</span>
                <span className="block text-[10px] text-muted mt-0.5">{sub}</span>
              </button>
            ))}
          </div>
          {form.from_type === 'reseller' ? (
            <textarea
              value={form.from_address}
              onChange={(e) => update('from_address', e.target.value)}
              className="input"
              rows={3}
              placeholder="Enter reseller from address"
            />
          ) : (
            <div className="rounded-lg bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-100 p-3">
              <pre className="text-xs text-ink/80 whitespace-pre-wrap font-sans leading-relaxed">{SNT_FROM_ADDRESS}</pre>
            </div>
          )}
        </div>
      </section>

      {/* Label preview + saved address picker */}
      <PreviewPanel
        entry={previewEntry}
        mode={previewMode}
        onModeChange={setPreviewMode}
        addresses={filteredAddresses}
        addressesLoading={addressesLoading}
        addressFilter={addressFilter}
        onAddressFilterChange={setAddressFilter}
        selectedIds={selectedPreviewIds}
        activeId={activePreviewId}
        onToggleAddress={togglePreviewAddress}
        onActivateAddress={activatePreviewAddress}
        selectedCount={selectedPreviewList.length}
        activeIndex={activePreviewIndex}
        onStepPreview={stepPreviewAddress}
      />

      {/* Ship To */}
      <section className="card overflow-hidden">
        <CardHead title="Ship To" accent="emerald" />
        <div className="p-4 space-y-4">
          <Field label="Recipient Name *" icon={MapPin}>
            <div className="relative">
              <input
                type="text"
                value={form.to_name}
                onChange={(e) => { update('to_name', e.target.value); searchAddresses(e.target.value); }}
                onFocus={() => suggestions.length && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                className="input"
                required
                placeholder="Search saved address..."
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-20 w-full bg-white border border-emerald-200 rounded-lg mt-1 max-h-44 overflow-y-auto shadow-lg">
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={() => selectAddress(s)}
                      className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 text-sm border-b border-line last:border-0"
                    >
                      <span className="font-semibold text-ink">{s.name}</span>
                      <span className="text-subtle ml-2">{s.city}{s.state ? `, ${s.state}` : ''}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>

          <Field label="Address">
            <textarea
              value={form.to_address}
              onChange={(e) => update('to_address', e.target.value)}
              className="input"
              rows={3}
              placeholder="Street, area, landmark..."
            />
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

          <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2.5">
            <input
              type="checkbox"
              checked={form.save_address}
              onChange={(e) => update('save_address', e.target.checked)}
              className="w-4 h-4 accent-emerald-600"
            />
            <span className="flex items-center gap-2 text-sm text-ink">
              <Bookmark className="w-4 h-4 text-emerald-600" strokeWidth={2} />
              Save this address for future use
            </span>
          </label>
        </div>
      </section>

      {/* Tracking & notes */}
      <section className="card overflow-hidden">
        <CardHead title="Tracking & Notes" accent="violet" />
        <div className="p-4 space-y-4">
          <Field label="Tracking Number" icon={Package}>
            <input
              type="text"
              value={form.tracking}
              onChange={(e) => update('tracking', e.target.value)}
              className="input"
              placeholder="Optional — sends WhatsApp update if filled"
            />
          </Field>

          {form.cod_prepaid === 'COD' && (
            <Field label="Order Amount (₹)">
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => update('amount', e.target.value)}
                className="input"
              />
            </Field>
          )}

          <Field label="Notes" icon={FileText}>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              className="input"
              rows={2}
              placeholder="Internal notes (optional)"
            />
          </Field>
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3.5 btn-primary font-semibold disabled:opacity-50 active:scale-[0.98] shadow-md shadow-amber-200/40"
      >
        {saving ? 'Saving...' : 'Save & Print'}
      </button>

      {printHidden}
    </form>
  );
}

function PreviewPanel({
  entry,
  mode,
  onModeChange,
  addresses,
  addressesLoading,
  addressFilter,
  onAddressFilterChange,
  selectedIds,
  activeId,
  onToggleAddress,
  onActivateAddress,
  selectedCount,
  activeIndex,
  onStepPreview,
}) {
  const showPicker = addresses !== undefined;

  return (
    <section className="card overflow-hidden">
      <CardHead
        title="Label Preview"
        accent="orange"
        action={
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
            A4
          </span>
        }
      />
      <div className="p-4 space-y-3">
        {showPicker && (
          <div className="rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50/80 to-amber-50/40 overflow-hidden">
            <div className="px-3 py-2 border-b border-orange-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-600 shrink-0" strokeWidth={2} />
              <span className="text-xs font-bold uppercase tracking-wide text-orange-800">Select Saved Addresses</span>
            </div>

            <div className="p-3 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle pointer-events-none" />
                <input
                  type="search"
                  value={addressFilter}
                  onChange={(e) => onAddressFilterChange(e.target.value)}
                  placeholder="Search name, city, PIN..."
                  className="input pl-9 text-sm"
                />
              </div>

              {addressesLoading ? (
                <p className="text-sm text-muted text-center py-4">Loading addresses...</p>
              ) : addresses.length === 0 ? (
                <p className="text-sm text-muted text-center py-4 px-2">
                  {addressFilter.trim()
                    ? 'No addresses match your search.'
                    : 'No saved addresses yet. Fill Ship To below or save when creating entries.'}
                </p>
              ) : (
                <div className="max-h-44 overflow-y-auto rounded-lg border border-orange-100 bg-white divide-y divide-line">
                  {addresses.map((a) => {
                    const checked = selectedIds.has(a.id);
                    const active = activeId === a.id;
                    return (
                      <div
                        key={a.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onActivateAddress(a)}
                        onKeyDown={(e) => { if (e.key === 'Enter') onActivateAddress(a); }}
                        className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                          active
                            ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-l-[3px] border-l-orange-500'
                            : checked
                              ? 'bg-amber-50/60 border-l-[3px] border-l-amber-300'
                              : 'hover:bg-sand border-l-[3px] border-l-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggleAddress(a)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 mt-0.5 accent-orange-600 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-ink truncate">{a.name}</div>
                          <div className="text-xs text-muted truncate">{a.address}</div>
                          <div className="text-xs text-subtle truncate">
                            {[a.city, a.state, a.pin].filter(Boolean).join(', ')}
                          </div>
                        </div>
                        {active && (
                          <span className="text-[10px] font-bold uppercase tracking-wide text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded shrink-0">
                            Preview
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedCount > 0 && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <p className="text-xs text-muted">
                    {selectedCount} selected
                    {selectedCount > 1 && activeIndex >= 0 && (
                      <span> · {activeIndex + 1} of {selectedCount} in preview</span>
                    )}
                  </p>
                  {selectedCount > 1 && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onStepPreview(-1)}
                        className="p-1.5 rounded-md border border-orange-200 bg-white hover:bg-orange-50 text-orange-700"
                        aria-label="Previous address"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onStepPreview(1)}
                        className="p-1.5 rounded-md border border-orange-200 bg-white hover:bg-orange-50 text-orange-700"
                        aria-label="Next address"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <PreviewModeBtn
            active={mode === 'single'}
            onClick={() => onModeChange('single')}
            icon={Eye}
            label="Full A4"
            accent="amber"
          />
          <PreviewModeBtn
            active={mode === 'dual'}
            onClick={() => onModeChange('dual')}
            icon={Scissors}
            label="2 per A4"
            accent="violet"
          />
        </div>
        <LabelPreview
          entry={entry}
          mode={mode}
          emptyMessage="Select a saved address above or enter recipient details below"
        />
        <p className="text-[11px] text-center text-muted">
          {mode === 'single'
            ? 'One address fills the entire A4 page — large fonts for couriers.'
            : 'Same address on top & bottom — cut along the dotted line.'}
        </p>
      </div>
    </section>
  );
}

function PreviewModeBtn({ active, onClick, icon: Icon, label, accent }) {
  const styles = accent === 'amber'
    ? active
      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-500 shadow-md shadow-amber-200'
      : 'bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-400'
    : active
      ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white border-violet-500 shadow-md shadow-violet-200'
      : 'bg-violet-50 text-violet-800 border-violet-200 hover:border-violet-400';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide border-[1.5px] transition-all active:scale-[0.98] ${styles}`}
    >
      <Icon className="w-4 h-4" strokeWidth={2.25} />
      {label}
    </button>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium text-ink mb-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-subtle" strokeWidth={2} />}
        {label}
      </label>
      {children}
    </div>
  );
}

function PrintOptionsModal({
  entry, previewMode, onPreviewModeChange, onSingle, onDual, onSaveOnly, onClose,
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white border border-violet-200 rounded-xl overflow-hidden w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-50 via-white to-purple-50 border-b border-violet-100 shrink-0">
          <h3 className="font-display text-lg text-ink">Print Options</h3>
          <button type="button" onClick={onClose} className="text-subtle text-2xl leading-none hover:text-violet-600">&times;</button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          <div>
            <p className="section-label mb-2">A4 Preview</p>
            <div className="flex gap-2 mb-3">
              <PreviewModeBtn
                active={previewMode === 'single'}
                onClick={() => onPreviewModeChange('single')}
                icon={Eye}
                label="Full A4"
                accent="amber"
              />
              <PreviewModeBtn
                active={previewMode === 'dual'}
                onClick={() => onPreviewModeChange('dual')}
                icon={Scissors}
                label="2 per A4"
                accent="violet"
              />
            </div>
            <LabelPreview entry={entry} mode={previewMode} />
          </div>

          <OptionCard
            title="Single Address (Full A4)"
            desc="One address fills the entire A4 page. Large fonts."
            accent="amber"
            onClick={onSingle}
          />
          <OptionCard
            title="Two Addresses (Half A4 each)"
            desc="Same address on top and bottom. Cut along the dotted line."
            accent="violet"
            onClick={onDual}
          />
          <OptionCard
            title="Save Only (Print Later)"
            desc="Print anytime from the Log or Print screen."
            variant="muted"
            onClick={onSaveOnly}
          />
        </div>
      </div>
    </div>
  );
}

function OptionCard({ title, desc, onClick, variant, accent }) {
  const muted = variant === 'muted';
  const accentStyles = accent === 'amber'
    ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 hover:border-amber-400'
    : accent === 'violet'
      ? 'border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 hover:border-violet-400'
      : '';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-lg p-4 border transition-all active:scale-[0.98] ${
        muted
          ? 'border-line bg-sand hover:border-gold'
          : accentStyles
      }`}
    >
      <div className={`font-semibold ${muted ? 'text-muted' : 'text-ink'}`}>{title}</div>
      <div className="text-xs text-muted mt-1">{desc}</div>
    </button>
  );
}
