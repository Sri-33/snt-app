export default function SNTLogo({ size = 'md', className = '', variant = 'image' }) {
  const sizes = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-lg',
    lg: 'w-20 h-20 text-2xl',
    xl: 'w-28 h-28 text-3xl',
  };

  if (variant === 'print') {
    const printText = {
      sm: 'text-[10pt]',
      md: 'text-[12pt]',
      lg: 'text-[14pt]',
      xl: 'text-[16pt]',
    };
    return (
      <div
        className={`inline-block rounded border-2 border-black px-2 py-1 font-bold bg-white text-black leading-tight ${printText[size]} ${className}`}
        aria-label="Sri Nandhini Tex"
      >
        SRI NANDHINI TEX
      </div>
    );
  }

  return (
    <img
      src="/snt-logo.png"
      alt="Sri Nandhini Tex"
      className={`${sizes[size]} rounded-lg object-cover ${className}`}
    />
  );
}
