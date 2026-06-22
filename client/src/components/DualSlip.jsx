import { SlipStyles, Slip, CutLine } from './CourierSlip';

export default function DualSlip({ entry }) {
  if (!entry) return null;

  return (
    <div className="snt-sheet">
      <SlipStyles />
      <div className="snt-page">
        <Slip entry={entry} />
        <CutLine />
        <Slip entry={entry} />
      </div>
    </div>
  );
}
