import { SlipStyles, Slip, CutLine } from './CourierSlip';

export default function DualLabel({ entries = [] }) {
  const pairs = [];
  for (let i = 0; i < entries.length; i += 2) {
    pairs.push([entries[i], entries[i + 1] || null]);
  }

  if (!pairs.length) return null;

  return (
    <div className="snt-sheet">
      <SlipStyles />
      {pairs.map((pair, idx) => (
        <div key={idx} className="snt-page">
          <Slip entry={pair[0]} />
          <CutLine />
          {pair[1] ? <Slip entry={pair[1]} /> : <div className="snt-slip" />}
        </div>
      ))}
    </div>
  );
}
