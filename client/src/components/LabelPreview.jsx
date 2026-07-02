import { useEffect, useRef, useState } from 'react';
import AddressLabel from './AddressLabel';
import DualSlip from './DualSlip';

const SHEET_WIDTH_PX = (198 * 96) / 25.4;

export default function LabelPreview({ entry, mode = 'single', emptyMessage = 'Enter recipient name to preview label' }) {
  const frameRef = useRef(null);
  const [scale, setScale] = useState(0.42);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;

    const updateScale = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(Math.min(w / SHEET_WIDTH_PX, 0.58));
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!entry?.to_name?.trim()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[220px] rounded-xl bg-gradient-to-br from-slate-50 to-amber-50/40 border border-dashed border-amber-200/80 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xl mb-3">📄</div>
        <p className="text-sm text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={frameRef}
      className="w-full aspect-[210/297] max-h-[min(480px,52vh)] overflow-hidden rounded-xl bg-white border border-amber-200/70 shadow-[inset_0_2px_12px_rgba(154,127,46,0.08)] relative"
    >
      <div
        className="absolute top-0 left-1/2 pointer-events-none"
        style={{
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: 'top center',
          width: '198mm',
        }}
      >
        {mode === 'single' ? <AddressLabel entry={entry} /> : <DualSlip entry={entry} />}
      </div>
    </div>
  );
}
