import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Download,
  FileCode,
  Clock,
  ShieldCheck,
  Dices,
  Globe,
  KeyRound,
} from 'lucide-react';
import { getRawContentUrl, regenerateNoteId } from '../lib/api';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicId: string;
  expiresAt: string | null;
  hasPassword: boolean;
  password?: string;
  onServerDownload: () => void;
  onPublicIdChanged?: (newPublicId: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  publicId,
  expiresAt,
  hasPassword,
  password = '',
  onServerDownload,
  onPublicIdChanged,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAuthLink, setCopiedAuthLink] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [useProductionDomain, setUseProductionDomain] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [customCodeInput, setCustomCodeInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  if (!isOpen || !publicId) return null;

  // Domain computation
  const domain = useProductionDomain
    ? 'https://www.jupyternotebook.com'
    : window.location.origin;

  // Direct and clean URL: www.jupyternotebook.com/:code (or /n/:code)
  const cleanNoteUrl = `${domain}/${publicId}`;
  const authNoteUrl = password
    ? `${domain}/${publicId}?pwd=${encodeURIComponent(password)}`
    : cleanNoteUrl;

  const rawUrl = `${window.location.origin}${getRawContentUrl(publicId)}`;

  const handleCopyClean = async () => {
    try {
      await navigator.clipboard.writeText(cleanNoteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyAuth = async () => {
    try {
      await navigator.clipboard.writeText(authNoteUrl);
      setCopiedAuthLink(true);
      setTimeout(() => setCopiedAuthLink(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyRaw = async () => {
    try {
      await navigator.clipboard.writeText(rawUrl);
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // 🎲 Randomly generate new link / code
  const handleRandomRegenerate = async () => {
    setIsRegenerating(true);
    setCustomError(null);
    try {
      const res = await regenerateNoteId(publicId, undefined, password);
      if (onPublicIdChanged) {
        onPublicIdChanged(res.publicId);
      }
      setIsRegenerating(false);
    } catch (err: any) {
      setIsRegenerating(false);
      setCustomError(err.message || 'Failed to regenerate code');
    }
  };

  // Set custom code / slug
  const handleApplyCustomCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCodeInput.trim()) return;
    setIsRegenerating(true);
    setCustomError(null);
    try {
      const res = await regenerateNoteId(publicId, customCodeInput.trim(), password);
      if (onPublicIdChanged) {
        onPublicIdChanged(res.publicId);
      }
      setShowCustomInput(false);
      setCustomCodeInput('');
      setIsRegenerating(false);
    } catch (err: any) {
      setIsRegenerating(false);
      setCustomError(err.message || 'Failed to apply custom code');
    }
  };

  const formattedExpiration = expiresAt
    ? `Expires: ${new Date(expiresAt).toLocaleString()}`
    : 'No expiration (Permanent until deleted)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f1720]/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#1c2b36] border border-[#3c5a72] rounded-xl shadow-2xl overflow-hidden text-slate-100">
        {/* Jupyter / Python Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#2b5b84] border-b border-[#3c5a72]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffd43b]" />
            <h3 className="font-bold text-sm text-white">
              Note Saved & Ready to Share
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-200 hover:text-white hover:bg-[#1e415e]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Domain & Generator Bar */}
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#2d4354]">
            <div className="flex items-center gap-1 text-[11px] text-slate-300">
              <Globe className="w-3.5 h-3.5 text-[#ffd43b]" />
              <span>Domain:</span>
              <button
                onClick={() => setUseProductionDomain(!useProductionDomain)}
                className="font-mono text-[#ffd43b] hover:underline font-semibold"
                title="Click to toggle domain between www.jupyternotebook.com and local server"
              >
                {useProductionDomain ? 'www.jupyternotebook.com' : window.location.host}
              </button>
            </div>

            {/* Random Link Generator Button */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleRandomRegenerate}
                disabled={isRegenerating}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#141e28] hover:bg-[#233444] border border-[#3c5a72] text-[11px] text-[#ffd43b] font-medium shadow-sm transition-colors active:scale-95 disabled:opacity-50"
                title="Randomly generate a new link/code for this note"
              >
                <Dices className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span>{isRegenerating ? 'Generating...' : '🎲 Random Code'}</span>
              </button>

              <button
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="text-[11px] text-slate-300 hover:text-white hover:underline"
              >
                Custom Code
              </button>
            </div>
          </div>

          {/* Custom code edit form */}
          {showCustomInput && (
            <form onSubmit={handleApplyCustomCode} className="flex items-center gap-2 p-2 bg-[#141e28] rounded border border-[#3c5a72]">
              <span className="text-slate-400 font-mono text-xs">{domain}/</span>
              <input
                type="text"
                value={customCodeInput}
                onChange={(e) => setCustomCodeInput(e.target.value)}
                placeholder="custom-code"
                autoFocus
                className="bg-transparent flex-1 text-[#ffd43b] font-mono text-xs outline-none"
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded bg-[#ffd43b] hover:bg-[#ffe873] text-[#1e303d] font-bold text-xs"
              >
                Set
              </button>
            </form>
          )}

          {customError && (
            <div className="p-2 rounded bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
              {customError}
            </div>
          )}

          {/* Main Retrieval Link: www.tempnotes.com/:code */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-medium">
                Note Retrieval Link:
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Code: <strong className="text-[#ffd43b]">{publicId}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 bg-[#141e28] border border-[#3c5a72] rounded p-2">
              <input
                type="text"
                readOnly
                value={cleanNoteUrl}
                className="bg-transparent flex-1 text-[#ffd43b] font-mono text-xs outline-none select-all"
              />
              <button
                onClick={handleCopyClean}
                className="flex items-center gap-1 px-3 py-1 rounded bg-[#ffd43b] hover:bg-[#ffe873] text-[#1e303d] font-bold shadow transition-colors shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* If Password Protected: Option to copy pre-authenticated link */}
          {hasPassword && password && (
            <div className="space-y-1.5 p-2.5 rounded bg-[#141e28]/70 border border-[#3c5a72]/80">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#ffd43b] font-medium flex items-center gap-1">
                  <KeyRound className="w-3 h-3" />
                  Auto-Unlock Link (contains your password):
                </span>
                <button
                  onClick={handleCopyAuth}
                  className="text-xs text-[#ffd43b] hover:underline font-medium"
                >
                  {copiedAuthLink ? 'Copied with password!' : 'Copy Auto-Unlock Link'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Opening this link will automatically unlock the note without asking for the password.
              </p>
            </div>
          )}

          {/* Quick Actions Row */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={`/n/${publicId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 p-2 rounded bg-[#141e28] hover:bg-[#233444] border border-[#3c5a72] text-slate-200 font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#ffd43b]" />
              <span>Open Note</span>
            </a>

            <button
              onClick={onServerDownload}
              className="flex items-center justify-center gap-1.5 p-2 rounded bg-[#141e28] hover:bg-[#233444] border border-[#3c5a72] text-slate-200 font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#ffd43b]" />
              <span>Server Download</span>
            </button>
          </div>

          {/* Raw Text Endpoint */}
          <div className="pt-2 border-t border-[#2d4354] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <FileCode className="w-3.5 h-3.5 text-[#ffd43b]" />
                Raw Text Endpoint (curl / script):
              </span>
              <button
                onClick={handleCopyRaw}
                className="text-[#ffd43b] hover:underline font-medium"
              >
                {copiedRaw ? 'Copied raw link' : 'Copy raw link'}
              </button>
            </div>
            <div className="bg-[#141e28] p-2 rounded border border-[#3c5a72] text-[11px] font-mono text-slate-300 select-all overflow-x-auto">
              curl -s {rawUrl}
            </div>
          </div>

          {/* Metadata badges */}
          <div className="pt-2 flex flex-col gap-1 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#ffd43b] shrink-0" />
              <span>{formattedExpiration}</span>
            </div>
            {hasPassword && (
              <div className="flex items-center gap-1.5 text-[#ffd43b]">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Password protected {password ? `(PIN/Pass: ${password})` : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#17232e] border-t border-[#2d4354] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#2b5b84] hover:bg-[#306998] text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
