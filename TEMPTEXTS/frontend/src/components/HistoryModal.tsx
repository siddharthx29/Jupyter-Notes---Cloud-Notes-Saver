import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  Trash2,
  Lock,
  Clock,
  ExternalLink,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import {
  getLocalNoteHistory,
  removeLocalNoteRecord,
  clearAllLocalHistory,
} from '../lib/storage';
import { LocalNoteRecord } from '../types/note';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNote: (publicId: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectNote,
}) => {
  const [history, setHistory] = useState<LocalNoteRecord[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadHistory = () => {
    setHistory(getLocalNoteHistory());
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRemove = (e: React.MouseEvent, publicId: string) => {
    e.stopPropagation();
    removeLocalNoteRecord(publicId);
    loadHistory();
  };

  const handleClearAll = () => {
    if (confirm('Clear all note history on this device?')) {
      clearAllLocalHistory();
      loadHistory();
    }
  };

  const handleCopyLink = (e: React.MouseEvent, publicId: string) => {
    e.stopPropagation();
    const link = `https://www.tempnotes.com/${publicId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(publicId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f1720]/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#1c2b36] border border-[#3c5a72] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#2b5b84] border-b border-[#3c5a72] shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#ffd43b]" />
            <h3 className="font-bold text-sm text-white">
              My Notes on this Device
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-200 hover:text-white hover:bg-[#1e415e]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice */}
        <div className="px-5 py-2.5 bg-[#141e28] text-[11px] text-slate-400 border-b border-[#2d4354] shrink-0">
          Recent note links and 4-letter codes are saved locally in your browser memory for convenient access.
        </div>

        {/* Notes List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <FileText className="w-8 h-8 mx-auto stroke-1 text-slate-500" />
              <p className="text-xs">No recent notes found in device memory.</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.publicId}
                onClick={() => {
                  onSelectNote(item.publicId);
                  onClose();
                }}
                className="group p-3 rounded border border-[#3c5a72] hover:border-[#ffd43b] bg-[#141e28] hover:bg-[#1f303d] transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-[#ffd43b] tracking-wide">
                      {item.publicId}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      (www.tempnotes.com/{item.publicId})
                    </span>
                    {item.hasPassword && (
                      <span className="flex items-center gap-0.5 text-[10px] text-[#ffd43b] bg-[#ffd43b]/10 px-1.5 py-0.5 rounded border border-[#ffd43b]/30">
                        <Lock className="w-2.5 h-2.5" />
                        Protected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-200 truncate font-mono">
                    {item.snippet || 'Untitled Note'}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                    {item.expiresAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-[#ffd43b]" />
                        Expires: {new Date(item.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={(e) => handleCopyLink(e, item.publicId)}
                    className="p-1.5 rounded text-slate-400 hover:text-[#ffd43b] hover:bg-[#233444] transition-colors"
                    title="Copy www.tempnotes.com link"
                  >
                    {copiedId === item.publicId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={(e) => handleRemove(e, item.publicId)}
                    className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                    title="Remove from memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="p-1.5 rounded text-slate-400 group-hover:text-[#ffd43b]">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#17232e] border-t border-[#2d4354] flex justify-between items-center shrink-0">
          {history.length > 0 ? (
            <button
              onClick={handleClearAll}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Memory</span>
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#2b5b84] hover:bg-[#306998] text-white text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
