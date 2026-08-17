import React, { useState } from 'react';
import {
  Save,
  Copy,
  Download,
  Check,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { SaveStatus } from '../types/note';

interface StatusBarProps {
  content: string;
  cursorLine: number;
  cursorCol: number;
  saveStatus: SaveStatus;
  isExistingNote: boolean;
  onSave: () => void;
  onInstantLocalDownload: () => void;
  autosaveEnabled: boolean;
  onToggleAutosave: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  content,
  cursorLine,
  cursorCol,
  saveStatus,
  isExistingNote,
  onSave,
  onInstantLocalDownload,
  autosaveEnabled,
  onToggleAutosave,
}) => {
  const [copied, setCopied] = useState(false);

  const charCount = content.length;
  const lineCount = content ? content.split('\n').length : 0;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  
  const byteSize = new Blob([content]).size;
  const formattedSize =
    byteSize < 1024
      ? `${byteSize} B`
      : `${(byteSize / 1024).toFixed(1)} KB`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
    }
  };

  return (
    <footer className="h-9 bg-[#f0f0f0] dark:bg-[#1e1e1e] border-t border-[#d0d0d0] dark:border-[#333333] px-3 flex items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-300 select-none z-10 shrink-0 font-sans">
      {/* Left: Mode & Checkpoint Status */}
      <div className="flex items-center gap-3">
        <span className="font-mono font-semibold text-[#2196f3] text-[11px] bg-[#e3f2fd] dark:bg-[#1565c0]/30 px-1.5 py-0.5 rounded border border-[#bbdefb] dark:border-[#1565c0]">
          Mode: Edit
        </span>

        {/* Status Indicator */}
        <div className="flex items-center gap-1.5 text-xs">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Saving checkpoint...</span>
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              <span>Checkpoint saved</span>
            </span>
          )}
          {saveStatus === 'unsaved' && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Unsaved changes</span>
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Checkpoint error</span>
            </span>
          )}
        </div>

        <div className="h-3 w-px bg-[#cccccc] dark:bg-[#444444] hidden sm:block" />

        {/* Counters */}
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600 dark:text-slate-400">
          <span>{charCount.toLocaleString()} chars</span>
          <span>•</span>
          <span>{lineCount.toLocaleString()} lines</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">{wordCount.toLocaleString()} words</span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">{formattedSize}</span>
          <span className="hidden lg:inline">•</span>
          <span className="hidden lg:inline">Ln {cursorLine}, Col {cursorCol}</span>
        </div>
      </div>

      {/* Right: Quick actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleAutosave}
          className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
            autosaveEnabled
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
              : 'bg-white dark:bg-[#252526] text-slate-400 border-[#cccccc] dark:border-[#444444]'
          }`}
          title={`Autosave is ${autosaveEnabled ? 'ON' : 'OFF'}`}
        >
          Autosave: {autosaveEnabled ? 'ON' : 'OFF'}
        </button>

        {/* Copy */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-[#252526] hover:bg-[#e8e8e8] dark:hover:bg-[#333333] border border-[#cccccc] dark:border-[#444444] text-xs transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-500" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>

        {/* Download */}
        <button
          onClick={onInstantLocalDownload}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-[#252526] hover:bg-[#e8e8e8] dark:hover:bg-[#333333] border border-[#cccccc] dark:border-[#444444] text-xs transition-colors"
        >
          <Download className="w-3 h-3 text-slate-500" />
          <span>.txt</span>
        </button>

        {/* Save */}
        <button
          onClick={onSave}
          className="flex items-center gap-1 px-3 py-0.5 rounded bg-[#f37626] hover:bg-[#e65c00] text-white font-semibold text-xs shadow-sm transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isExistingNote ? 'Save' : 'Save Checkpoint'}</span>
        </button>
      </div>
    </footer>
  );
};
