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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="text-center mb-8">
        <SNTLogo size="xl" className="mx-auto mb-4 ring-2 ring-gold/40" />
        <h1 className="text-2xl font-semibold text-ink tracking-wide">SRI NANDHINI TEX</h1>
        <p className="text-gold text-sm mt-1 tracking-wide">Courier Manager</p>
      </div>

      <div className="bg-sand border border-line rounded-md p-6 w-full max-w-xs">
        <p className="text-center text-muted text-sm mb-4 uppercase tracking-[2px] text-[11px] font-semibold">
          Enter 4-digit PIN
        </p>

        <div className="flex justify-center gap-3 mb-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-xl font-bold ${
                pin.length > i ? 'border-gold bg-gold text-white' : 'border-line text-line'
              }`}
            >
              {pin.length > i ? '●' : ''}
            </div>
          ))}
        </div>

        {error && <p className="text-warning text-center text-sm mb-3">{error}</p>}

        <div className="grid grid-cols-3 gap-2">
          {digits.map((d, i) => (
            <button
              key={i}
              type="button"
              disabled={!d}
              onClick={() => (d === '⌫' ? handleBackspace() : handleDigit(d))}
              className={`h-14 rounded-md text-xl font-semibold transition-colors ${
                d
                  ? d === '⌫'
                    ? 'bg-white border border-line text-muted hover:border-gold'
                    : 'bg-white border border-line text-ink hover:border-gold hover:text-gold active:bg-sand'
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
