import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SNTLogo from '../components/SNTLogo';

export default function Login() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleDigit = (digit) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
      if (newPin.length === 4) {
        const result = login(newPin);
        if (result.success) {
          navigate('/');
        } else {
          setError('Invalid PIN');
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((p) => p.slice(0, -1));
    setError('');
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-br from-amber-50 via-white to-violet-100">
      <div className="text-center mb-8">
        <SNTLogo size="xl" className="mx-auto mb-4 ring-2 ring-gold/50 shadow-lg shadow-gold/20" />
        <h1 className="font-brand text-3xl text-ink">SRI NANDHINI TEX</h1>
        <p className="text-orange-600 text-sm mt-2 tracking-[0.2em] uppercase font-bold">Courier Manager</p>
      </div>

      <div className="card p-6 w-full max-w-xs border-gold/20 shadow-lg">
        <p className="text-center text-muted text-sm mb-4 uppercase tracking-[2px] text-[11px] font-bold">
          Enter 4-digit PIN
        </p>

        <div className="flex justify-center gap-3 mb-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-xl font-bold transition-colors ${
                pin.length > i
                  ? 'border-gold bg-gradient-to-br from-gold-light to-gold text-white shadow-md'
                  : 'border-line text-line bg-white'
              }`}
            >
              {pin.length > i ? '●' : ''}
            </div>
          ))}
        </div>

        {error && <p className="text-warning text-center text-sm mb-3 font-medium">{error}</p>}

        <div className="grid grid-cols-3 gap-2">
          {digits.map((d, i) => (
            <button
              key={i}
              type="button"
              disabled={!d}
              onClick={() => (d === '⌫' ? handleBackspace() : handleDigit(d))}
              className={`h-14 rounded-lg text-xl font-semibold transition-all active:scale-95 ${
                d
                  ? d === '⌫'
                    ? 'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100'
                    : 'bg-white border border-line text-ink hover:border-gold hover:bg-amber-50 hover:text-gold'
                  : 'invisible'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
