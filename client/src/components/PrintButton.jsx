import { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { PRINT_PAGE_STYLE } from './CourierSlip';
import { isNativePlatform, nativePrintNode } from '../lib/print';

export default function PrintButton({ contentRef, label = 'Print', className = '', onBeforePrint }) {
  const fallbackRef = useRef(null);
  const ref = contentRef || fallbackRef;
  const [busy, setBusy] = useState(false);

  const handleWebPrint = useReactToPrint({
    contentRef: ref,
    documentTitle: 'Sri Nandhini Tex - Courier Slip',
    onBeforePrint: onBeforePrint,
    pageStyle: PRINT_PAGE_STYLE,
  });

  const handleClick = async () => {
    if (!isNativePlatform) {
      handleWebPrint();
      return;
    }
    if (!ref.current) return;
    try {
      setBusy(true);
      if (onBeforePrint) await onBeforePrint();
      await nativePrintNode(ref.current);
    } catch (err) {
      console.error('Native print failed', err);
      alert('Unable to open the slip for printing.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={`inline-flex items-center gap-2 px-4 py-2 btn-primary text-sm ${busy ? 'opacity-60' : ''} ${className}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      {busy ? 'Preparing...' : label}
    </button>
  );
}
