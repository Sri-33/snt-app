import { SlipStyles, Slip } from './CourierSlip';

export default function AddressLabel({ entry }) {
  if (!entry) return null;

  return (
    <div className="snt-sheet">
      <SlipStyles />
      <div className="snt-page">
        <Slip entry={entry} full />
      </div>
    </div>
  );
}
