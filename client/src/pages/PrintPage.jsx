import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { formatDateISO } from '../lib/format';
import AddressLabel from '../components/AddressLabel';
import DualLabel from '../components/DualLabel';
import PrintButton from '../components/PrintButton';

function PaymentBadge({ entry }) {
  if (entry.cod_prepaid === 'COD') {
    return <span className="badge-pill bg-[#E65100] text-white">COD</span>;
  }
  if (entry.cod_prepaid === 'Prepaid') {
    return <span className="badge-pill bg-[#2E7D32] text-white">PREPAID</span>;
  }
  if (entry.bundle_weight) {
    return <span className="badge-pill bg-[#555555] text-white">{entry.bundle_weight} KG</span>;
  }
  return null;
}

export default function PrintPage() {
  const [entries, setEntries] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [mode, setMode] = useState('dual');
  const [date, setDate] = useState(formatDateISO());
  const printRef = useRef(null);

  useEffect(() => {
    api.getEntries({ date })
      .then((data) => {
        setEntries(data);
        setSelected(new Set(data.map((e) => e.id)));
      })
      .catch(() => {
        setEntries([]);
        setSelected(new Set());
      });
  }, [date]);

  const allSelected = entries.length > 0 && selected.size === entries.length;

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(entries.map((e) => e.id)));
  };

  const printEntries = entries.filter((e) => selected.has(e.id));

  return (
    <div className="space-y-4">
      <h2 className="page-title">Print Labels</h2>

      <div>
        <label className="block text-sm font-medium mb-1 text-ink">Select Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => setMode('single')}
          className={`flex-1 py-2 rounded-md text-sm font-medium border-[1.5px] border-[#111111] transition-colors ${mode === 'single' ? 'bg-[#111111] text-white' : 'bg-white text-[#111111]'}`}>
          Single A4
        </button>
        <button type="button" onClick={() => setMode('dual')}
          className={`flex-1 py-2 rounded-md text-sm font-medium border-[1.5px] border-[#111111] transition-colors ${mode === 'dual' ? 'bg-[#111111] text-white' : 'bg-white text-[#111111]'}`}>
          Dual (2/A4)
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-subtle text-center py-8">No entries for this date</p>
      ) : (
        <>
          <div className="rounded-md border border-[#E0E0E0] overflow-hidden">
            <button
              onClick={toggleAll}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#E0E0E0] bg-sand text-sm font-semibold text-ink"
            >
              <input
                type="checkbox"
                checked={allSelected}
                readOnly
                className="w-4 h-4 accent-[#111111] pointer-events-none"
              />
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>

            <div className="max-h-72 overflow-y-auto">
              {entries.map((e) => {
                const isChecked = selected.has(e.id);
                return (
                  <div
                    key={e.id}
                    onClick={() => toggle(e.id)}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-[#E0E0E0] cursor-pointer text-sm transition-colors ${
                      isChecked
                        ? 'bg-[#F9F7F0] border-l-2 border-l-[#111111]'
                        : 'bg-white border-l-2 border-l-transparent hover:bg-[#F5F5F5]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      className="w-4 h-4 accent-[#111111] pointer-events-none shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ink truncate">{e.to_name}</div>
                      <div className="text-xs text-[#888888] truncate">{e.to_city}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="badge-pill bg-[#111111] text-white">{e.courier?.split(' ')[0]}</span>
                      <PaymentBadge entry={e} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-[#888888]">{selected.size} of {entries.length} selected</p>

          <PrintButton
            contentRef={printRef}
            label={`Print ${selected.size} Label(s)`}
            className={`w-full justify-center ${selected.size === 0 ? 'opacity-50 pointer-events-none' : ''}`}
          />

          <div className="hidden">
            <div ref={printRef} className="print-area">
              {mode === 'single'
                ? printEntries.map((e) => <AddressLabel key={e.id} entry={e} />)
                : <DualLabel entries={printEntries} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
