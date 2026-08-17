import React, { useState, useEffect } from 'react';
import { X, Lock, KeyRound, Eye, EyeOff, Sparkles } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  mode: 'set' | 'unlock';
  initialPassword?: string;
  errorMessage?: string | null;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialPassword = '',
  errorMessage,
}) => {
  const [password, setPassword] = useState(initialPassword);
  const [showPassword, setShowPassword] = useState(mode === 'set');

  useEffect(() => {
    if (isOpen) {
      setPassword(initialPassword);
      setShowPassword(mode === 'set');
    }
  }, [isOpen, initialPassword, mode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(password.trim());
  };

  const handleClearPassword = () => {
    setPassword('');
    onSubmit('');
  };

  // Quick generator helpers for user choice (short PINs & codes)
  const generatePin = (digits = 4) => {
    const pin = Math.floor(Math.random() * Math.pow(10, digits))
      .toString()
      .padStart(digits, '0');
    setPassword(pin);
  };

  const generateShortCode = () => {
    const chars = '23456789abcdefghjkmnpqrstuvwxyz';
    let res = '';
    for (let i = 0; i < 4; i++) {
      res += chars[Math.floor(Math.random() * chars.length)];
    }
    setPassword(res);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f1720]/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-[#1c2b36] border border-[#3c5a72] rounded-xl shadow-2xl overflow-hidden text-slate-100">
        {/* Python Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#2b5b84] border-b border-[#3c5a72]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#1e303d] text-[#ffd43b] flex items-center justify-center border border-[#ffd43b]/30">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">
              {mode === 'set' ? 'Custom Note Password' : 'Password Protected Note'}
            </h3>
          </div>
          {mode === 'set' && (
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-200 hover:text-white hover:bg-[#1e415e]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            {mode === 'set'
              ? 'Choose any password or short PIN of your choice (e.g. 1234, a single word, or a custom key). Zero minimum length restriction.'
              : 'Enter this note’s password or short PIN to unlock and view its content.'}
          </p>

          {errorMessage && (
            <div className="p-2.5 rounded bg-rose-950/60 border border-rose-800 text-rose-300">
              {errorMessage}
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-medium text-slate-200">
                {mode === 'set' ? 'Your Password / PIN' : 'Password'}
              </label>
              {mode === 'set' && initialPassword && (
                <button
                  type="button"
                  onClick={handleClearPassword}
                  className="text-[#ffd43b] hover:underline"
                >
                  Remove Password
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'set' ? 'e.g. 1234 or your short key' : 'Enter password'}
                autoFocus
                className="w-full pl-3 pr-10 py-2 rounded bg-[#141e28] border border-[#3c5a72] text-sm text-[#ffd43b] outline-none focus:border-[#ffd43b] focus:ring-1 focus:ring-[#ffd43b] transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Choice Suggestions for User (Short PIN / 4-char code) */}
          {mode === 'set' && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-slate-400">Quick generate by choice:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => generatePin(4)}
                  className="px-2 py-1 rounded bg-[#141e28] hover:bg-[#233444] border border-[#3c5a72] text-[11px] text-[#ffd43b] flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>4-Digit PIN</span>
                </button>
                <button
                  type="button"
                  onClick={() => generateShortCode()}
                  className="px-2 py-1 rounded bg-[#141e28] hover:bg-[#233444] border border-[#3c5a72] text-[11px] text-[#ffd43b] flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>4-Char Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => generatePin(6)}
                  className="px-2 py-1 rounded bg-[#141e28] hover:bg-[#233444] border border-[#3c5a72] text-[11px] text-slate-300 hover:text-white transition-colors"
                >
                  <span>6-Digit</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#2d4354]">
            {mode === 'set' && (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded bg-[#141e28] hover:bg-[#233444] border border-[#3c5a72] text-slate-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-[#ffd43b] hover:bg-[#ffe873] text-[#1e303d] font-bold text-xs shadow transition-colors flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#1e303d]" />
              <span>{mode === 'set' ? 'Set Password' : 'Unlock Note'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
