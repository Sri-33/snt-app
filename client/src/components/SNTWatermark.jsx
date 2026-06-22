export default function SNTWatermark({ compact = false }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
      aria-hidden="true"
    >
      <span
        className={`font-bold text-black ${compact ? 'text-6xl' : 'text-9xl'}`}
        style={{ opacity: 0.08 }}
      >
        SNT
      </span>
    </div>
  );
}
