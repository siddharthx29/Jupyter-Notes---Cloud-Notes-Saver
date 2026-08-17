import React from 'react';
import { Clock, FilePlus, ArrowLeft } from 'lucide-react';

interface ExpiredViewProps {
  onNewNote: () => void;
  publicId?: string;
  isNotFound?: boolean;
}

export const ExpiredView: React.FC<ExpiredViewProps> = ({
  onNewNote,
  publicId,
  isNotFound = false,
}) => {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-[#141e28] select-none text-slate-100">
      <div className="w-full max-w-md bg-[#1c2b36] border border-[#3c5a72] rounded-2xl p-8 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Python Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#141e28] text-[#ffd43b] border border-[#ffd43b]/40 flex items-center justify-center mx-auto shadow-inner">
          <Clock className="w-8 h-8" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#ffd43b] bg-[#141e28] px-3 py-1 rounded-full border border-[#ffd43b]/40">
            {isNotFound ? '404 • Note Not Found' : '410 • Note Expired'}
          </span>
          <h2 className="text-xl font-bold text-white pt-1">
            {isNotFound ? 'This note does not exist' : 'This temporary note has expired'}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
            {isNotFound
              ? `Note ${publicId ? `#${publicId}` : ''} could not be located on the server. It may have been deleted or the link is invalid.`
              : `Temporary notes are automatically deleted once their lifespan elapses to preserve privacy and server storage.`}
          </p>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onNewNote}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-[#ffd43b] hover:bg-[#ffe873] text-[#1e303d] text-xs font-bold shadow transition-all active:scale-95"
          >
            <FilePlus className="w-4 h-4 text-[#1e303d]" />
            <span>Create a New Note</span>
          </button>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNewNote();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded border border-[#3c5a72] bg-[#141e28] hover:bg-[#233444] text-slate-200 text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Homepage</span>
          </a>
        </div>
      </div>
    </div>
  );
};
