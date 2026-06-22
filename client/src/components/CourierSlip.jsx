import { formatDate } from '../lib/format';
import { SNT_FROM_ADDRESS } from '../constants';

export const PRINT_PAGE_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Inter:wght@400;500;600;700&display=swap');
  @page { size: A4 portrait; margin: 6mm; }
  @media print {
    html, body { background: #fff !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

const SLIP_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Inter:wght@400;500;600;700&display=swap');

.snt-sheet {
  width: 198mm;
  background: #fff;
  color: #111;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
.snt-page { page-break-after: always; }
.snt-page:last-child { page-break-after: auto; }

.snt-slip {
  height: 138mm;
  overflow: hidden;
  border: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  background: #fff;
  box-sizing: border-box;
}
.snt-slip-full { height: 285mm; }

.snt-topbar {
  background: #111111;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4mm 8mm;
}
.snt-brand { font-weight: 700; font-size: 13pt; letter-spacing: 3px; color: #9A7F2E; }
.snt-topright { text-align: right; line-height: 1.2; }
.snt-courier-name { font-weight: 700; font-size: 12pt; }
.snt-date { font-size: 10pt; font-weight: 400; opacity: 0.92; }

.snt-body { flex: 1; display: flex; padding: 8mm; }
.snt-from { width: 35%; padding-right: 6mm; box-sizing: border-box; }
.snt-to { width: 65%; padding-left: 6mm; border-left: 1px solid #ddd; box-sizing: border-box; }

.snt-label {
  color: #888888;
  text-transform: uppercase;
  font-size: 7pt;
  letter-spacing: 2px;
  font-weight: 600;
}
.snt-divider { border-top: 1px solid #ddd; margin: 3px 0 7px; }

.snt-from-name { font-weight: 600; font-size: 10pt; color: #111111; margin-bottom: 2px; }
.snt-from-text { font-size: 10pt; font-weight: 400; color: #222222; line-height: 1.6; white-space: pre-line; }

.snt-to-name {
  text-transform: uppercase;
  font-weight: 700;
  font-size: 14pt;
  color: #111111;
  letter-spacing: 1px;
  line-height: 1.3;
}
.snt-to-addr { font-size: 10pt; font-weight: 400; color: #222222; margin-top: 5px; line-height: 1.6; }
.snt-to-loc { font-size: 10pt; font-weight: 400; color: #222222; margin-top: 3px; line-height: 1.6; }
.snt-to-phone { font-size: 9.5pt; color: #444444; margin-top: 7px; }

.snt-slip-full .snt-to-name { font-size: 18pt; }
.snt-slip-full .snt-to-addr, .snt-slip-full .snt-to-loc { font-size: 12pt; }
.snt-slip-full .snt-from-text { font-size: 11pt; }
.snt-slip-full .snt-from-name { font-size: 11pt; }
.snt-slip-full .snt-track-num { font-size: 14pt; }

.snt-bottombar {
  background: #f7f7f7;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  border-top: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3mm 8mm;
}
.snt-track-label {
  font-size: 7pt;
  color: #888;
  letter-spacing: 1px;
  text-transform: uppercase;
  display: block;
}
.snt-track-num {
  font-family: 'Courier Prime', 'Courier New', monospace;
  font-size: 12pt;
  font-weight: 700;
  color: #111;
}
.snt-track-empty {
  display: inline-block;
  min-width: 42mm;
  border-bottom: 1px solid #999;
  height: 12pt;
}

.snt-badge {
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  color: #fff;
  padding: 2px 12px;
  border-radius: 999px;
  letter-spacing: 1px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.snt-badge-cod { background: #E65100; }
.snt-badge-prepaid { background: #2E7D32; }
.snt-badge-neutral { background: #555; }

.snt-web { font-size: 8pt; color: #888; font-style: italic; }

.snt-cut {
  position: relative;
  height: 8mm;
  display: flex;
  align-items: center;
  justify-content: center;
}
.snt-cut-line {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  border-top: 1px dashed #555;
}
.snt-cut-text {
  position: relative;
  background: #fff;
  padding: 0 8px;
  color: #888;
  font-size: 7pt;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* India Post Prepaid Parcel slip */
.ip-slip {
  height: 138mm;
  overflow: hidden;
  box-sizing: border-box;
  background: #fff;
  font-family: Arial, Helvetica, sans-serif;
  color: #000;
}
.ip-slip-full { height: 281mm; }
.ip-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.ip-table td {
  border: 1.5px solid #000000;
  padding: 6px 10px;
  vertical-align: top;
  font-size: 10pt;
  color: #000000;
}
.ip-title {
  text-align: center;
  font-weight: 700;
  padding: 8px 10px;
}
.ip-title .ip-t1 { display: block; font-size: 11pt; font-weight: 700; letter-spacing: 1px; }
.ip-title .ip-t2 { display: block; font-size: 12pt; font-weight: 700; margin-top: 3px; }
.ip-snt-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.ip-snt-brand { font-weight: 700; font-size: 12pt; }
.ip-snt-meta { font-weight: 400; font-size: 9pt; text-align: right; }
.ip-footer {
  border-top: 1px solid #000000;
  background: #ffffff;
  padding: 6px 10px;
  height: 35px;
  position: relative;
  overflow: hidden;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.ip-footer-left { position: relative; z-index: 1; }
.ip-footer-thanks { display: block; font-style: italic; font-size: 9pt; color: #555555; }
.ip-footer-web { display: block; font-size: 8pt; color: #9A7F2E; }
.ip-footer-mark {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  height: 30px;
  width: auto;
  opacity: 0.6;
  z-index: 0;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.ip-title .ip-vp { display: block; font-size: 12pt; font-weight: 700; }
.ip-title .ip-words { display: block; font-size: 11pt; font-weight: 700; }
.ip-title .ip-cid { display: block; font-size: 10pt; font-weight: 700; }
.ip-title .ip-bulk { display: block; font-size: 10pt; font-weight: 700; }
.ip-article { height: 28px; font-weight: 600; }
.ip-colhead {
  background: #f0f0f0;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 9pt;
  padding: 4px 8px;
}
.ip-from-cell { width: 38%; }
.ip-to-cell { width: 62%; }
.ip-from-name { font-weight: 700; font-size: 10pt; }
.ip-from-text { font-size: 10pt; line-height: 1.5; white-space: pre-line; }
.ip-to-name { font-weight: 700; font-size: 12pt; text-transform: uppercase; margin-bottom: 4px; }
.ip-to-text { font-size: 10pt; line-height: 1.6; }
.ip-line-row { height: 26px; font-weight: 600; }
.ip-fill {
  display: inline-block;
  min-width: 40mm;
  border-bottom: 1px solid #000000;
  line-height: 1.4;
}
.ip-half { width: 50%; }
`;

export function SlipStyles() {
  return <style dangerouslySetInnerHTML={{ __html: SLIP_CSS }} />;
}

function getFrom(entry) {
  const raw = entry.from_type === 'reseller'
    ? (entry.from_address || '')
    : (entry.from_address || SNT_FROM_ADDRESS);
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return { name: '(Reseller)', rest: '' };
  return { name: lines[0], rest: lines.slice(1).join('\n') };
}

function numberToWords(value) {
  const num = Math.floor(Number(value) || 0);
  if (num === 0) return 'ZERO';

  const ones = [
    '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
    'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
    'SEVENTEEN', 'EIGHTEEN', 'NINETEEN',
  ];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  const twoDigit = (n) => (n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ''}`);
  const threeDigit = (n) => {
    let str = '';
    if (n >= 100) {
      str += `${ones[Math.floor(n / 100)]} HUNDRED`;
      n %= 100;
      if (n) str += ' ';
    }
    if (n) str += twoDigit(n);
    return str;
  };

  const thousand = Math.floor(num / 1000);
  const rest = num % 1000;
  let words = '';
  if (thousand) {
    words += `${threeDigit(thousand)} THOUSAND`;
    if (rest) words += ' ';
  }
  if (rest) words += threeDigit(rest);
  return words.trim();
}

function IndiaPostSlip({ entry, full = false }) {
  const from = getFrom(entry);
  const cityDistrict = [entry.to_city, entry.to_district].filter(Boolean).join(', ');
  const statePin = [entry.to_state, entry.to_pin].filter(Boolean).join(' - ');
  const isCod = entry.cod_prepaid === 'COD';
  const amount = entry.amount || 0;

  return (
    <div className={`ip-slip${full ? ' ip-slip-full' : ''}`}>
      <table className="ip-table">
        <tbody>
          {isCod ? (
            <>
              <tr>
                <td className="ip-title" colSpan={2}><span className="ip-vp">VP PARCEL {amount}/-</span></td>
              </tr>
              <tr>
                <td className="ip-title" colSpan={2}><span className="ip-words">{numberToWords(amount)} RUPEES ONLY</span></td>
              </tr>
              <tr>
                <td className="ip-title" colSpan={2}><span className="ip-cid">CUSTOMER ID 4002408323</span></td>
              </tr>
              <tr>
                <td className="ip-title" colSpan={2}><span className="ip-bulk">BULK BOOKING AT SURAMANGALAM 636005</span></td>
              </tr>
            </>
          ) : (
            <tr>
              <td className="ip-title" colSpan={2}>
                <span className="ip-t1">CUSTOMER ID 4002408323</span>
                <span className="ip-t2">BULK BOOKING AT SURAMANGALAM 636005</span>
              </td>
            </tr>
          )}
          <tr>
            <td className="ip-colhead ip-from-cell">From</td>
            <td className="ip-colhead ip-to-cell">To</td>
          </tr>
          <tr>
            <td className="ip-from-cell">
              <div className="ip-from-name">{from.name}</div>
              {from.rest && <div className="ip-from-text">{from.rest}</div>}
            </td>
            <td className="ip-to-cell">
              <div className="ip-to-name">{entry.to_name}</div>
              <div className="ip-to-text">
                {entry.to_address && <div>{entry.to_address}</div>}
                {cityDistrict && <div>{cityDistrict}</div>}
                {statePin && <div>{statePin}</div>}
                {entry.to_phone && <div>Ph: {entry.to_phone}</div>}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function StandardSlip({ entry, full = false }) {
  const from = getFrom(entry);
  const cityDistrict = [entry.to_city, entry.to_district].filter(Boolean).join(', ');
  const statePin = [entry.to_state, entry.to_pin].filter(Boolean).join(' - ');

  return (
    <div className={`ip-slip${full ? ' ip-slip-full' : ''}`}>
      <table className="ip-table">
        <tbody>
          <tr>
            <td className="ip-colhead ip-from-cell">From</td>
            <td className="ip-colhead ip-to-cell">To</td>
          </tr>
          <tr>
            <td className="ip-from-cell">
              <div className="ip-from-name">{from.name}</div>
              {from.rest && <div className="ip-from-text">{from.rest}</div>}
            </td>
            <td className="ip-to-cell">
              <div className="ip-to-name">{entry.to_name}</div>
              <div className="ip-to-text">
                {entry.to_address && <div>{entry.to_address}</div>}
                {cityDistrict && <div>{cityDistrict}</div>}
                {statePin && <div>{statePin}</div>}
                {entry.to_phone && <div>Ph: {entry.to_phone}</div>}
              </div>
            </td>
          </tr>
          <tr>
            <td className="ip-footer" colSpan={2}>
              <div className="ip-footer-left">
                <span className="ip-footer-thanks">Thank you for your purchase!</span>
                <span className="ip-footer-web">www.srinandhinitex.com</span>
              </div>
              <img className="ip-footer-mark" src="/snt-logo-full-black.png" alt="" aria-hidden="true" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function Slip({ entry, full = false }) {
  if (!entry) return null;

  if (entry.courier === 'Indian Post') {
    return <IndiaPostSlip entry={entry} full={full} />;
  }

  return <StandardSlip entry={entry} full={full} />;
}

export function CutLine() {
  return (
    <div className="snt-cut">
      <div className="snt-cut-line" />
      <div className="snt-cut-text">
        <span>{'\u2702'}</span>
        <span>CUT HERE</span>
      </div>
    </div>
  );
}
