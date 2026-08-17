import React, { useState } from 'react';
import { X, Search, Lock, ArrowRight, FileText } from 'lucide-react';

interface OpenNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNote: (publicId: string, password?: string) => void;
}

export const OpenNoteModal: React.FC<OpenNoteModalProps> = ({
  isOpen,
  onClose,
  onOpenNote,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let clean = inputVal.trim();
    if (!clean) {
      setError('Please enter a 4-character code or note URL');
      return;
    }

    // If user pasted a full URL, extract the code/slug from the path
    try {
      if (clean.startsWith('http://') || clean.startsWith('https://')) {
        const parsedUrl = new URL(clean);
        const segments = parsedUrl.pathname.split('/').filter(Boolean);
        if (segments.length > 0) {
          // Check for /n/:code or /:code
          clean = segments[segments.length - 1];
        }
        // Extract embedded ?pwd= if present in URL
        const urlPwd = parsedUrl.searchParams.get('pwd') || parsedUrl.searchParams.get('password');
        if (urlPwd && !password) {
          onOpenNote(clean, urlPwd);
          onClose();
          return;
        }
      } else if (clean.includes('/')) {
        // e.g. www.jupyternotebook.com/sidd or n/sidd
        const parts = clean.split('/').filter(Boolean);
        clean = parts[parts.length - 1];
      }
    } catch {
      // Fallback to raw string
    }

    // Clean any trailing query parameters or fragments
    clean = clean.split('?')[0].split('#')[0].trim();

    if (!clean) {
      setError('Could not extract code from input');
      return;
    }

    onOpenNote(clean, password.trim() ? password.trim() : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f1720]/80 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md bg-[#1c2b36] border border-[#3c5a72] rounded-xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#2b5b84] border-b border-[#3c5a72]">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[#ffd43b]" />
            <h3 className="font-bold text-sm text-white">
              Open Notebook by Code or URL
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-200 hover:text-white hover:bg-[#1e415e]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Enter 4-Character Code or Note URL:</span>
              <span className="text-[11px] text-slate-400 font-mono">e.g. sidd or a7K9</span>
            </label>
            <div className="flex items-center gap-2 bg-[#141e28] border border-[#3c5a72] focus-within:border-[#ffd43b] rounded p-2.5 transition-colors">
              <FileText className="w-4 h-4 text-[#ffd43b] shrink-0" />
              <input
                type="text"
                autoFocus
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="4-character code (e.g. sidd) or full URL"
                className="bg-transparent flex-1 text-slate-100 text-xs font-mono outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Password toggle / field */}
          <div className="space-y-1.5">
            {!showPasswordField ? (
              <button
                type="button"
                onClick={() => setShowPasswordField(true)}
                className="text-xs text-[#ffd43b] hover:underline flex items-center gap-1 font-medium"
              >
                <Lock className="w-3 h-3" />
                <span>Note is password protected? Enter password</span>
              </button>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#ffd43b]" />
                  <span>Password / PIN (optional):</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter note password..."
                  className="w-full bg-[#141e28] border border-[#3c5a72] focus:border-[#ffd43b] rounded p-2 text-slate-100 text-xs font-mono outline-none"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="p-2 rounded bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded border border-[#3c5a72] bg-[#141e28] hover:bg-[#233444] text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#ffd43b] hover:bg-[#ffe873] text-[#1e303d] text-xs font-bold shadow transition-colors"
            >
              <span>Retrieve Note</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
