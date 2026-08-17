import React, { useState, useRef, useEffect } from 'react';
import {
  Save,
  Plus,
  Scissors,
  Copy,
  Play,
  Square,
  RotateCw,
  FastForward,
  Lock,
  Unlock,
  ExternalLink,
  Sun,
  Moon,
  Laptop,
  Check,
  Download,
  Share2,
  FolderOpen,
} from 'lucide-react';
import { Theme } from '../hooks/useTheme';
import { ExpirationOption, SaveStatus } from '../types/note';

interface HeaderProps {
  onNewNote: () => void;
  onOpenHistory: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  showLineNumbers: boolean;
  onToggleLineNumbers: () => void;
  wordWrap: boolean;
  onToggleWordWrap: () => void;
  isPasswordProtected: boolean;
  onTogglePasswordModal: () => void;
  publicId?: string | null;
  saveStatus: SaveStatus;
  onSave: () => void;
  onCopy: () => void;
  onInstantLocalDownload: () => void;
  onShareModal: () => void;
  onDelete: () => void;
  expiration: ExpirationOption;
  onExpirationChange: (exp: ExpirationOption) => void;
  isExistingNote: boolean;
  customCode?: string;
  onCustomCodeChange?: (code: string) => void;
  onOpenByCode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNewNote,
  onOpenHistory,
  theme,
  onToggleTheme,
  showLineNumbers,
  onToggleLineNumbers,
  wordWrap,
  onToggleWordWrap,
  isPasswordProtected,
  onTogglePasswordModal,
  publicId,
  saveStatus,
  onSave,
  onCopy,
  onInstantLocalDownload,
  onShareModal,
  onDelete,
  expiration,
  onExpirationChange,
  isExistingNote,
  customCode = '',
  onCustomCodeChange,
  onOpenByCode,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const noteTitle = publicId ? `JupyterNotebook-${publicId}` : 'Untitled3';

  return (
    <header className="bg-white dark:bg-[#1f1f1f] border-b border-[#e0e0e0] dark:border-[#333333] select-none shrink-0 text-slate-800 dark:text-slate-200">
      {/* Row 1: Jupyter Header Brand & Status */}
      <div className="px-3 pt-2 pb-1.5 flex items-center justify-between">
        {/* Left: Jupyter Logo + Title + Checkpoint */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNewNote();
            }}
            className="flex items-center gap-2 cursor-pointer group"
          >
            {/* Authentic Jupyter Logo SVG (3 dots + rings) */}
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 44 50">
              <circle cx="22" cy="7" r="4.5" fill="#f37626" />
              <circle cx="7" cy="40" r="4.5" fill="#616161" />
              <circle cx="37" cy="40" r="4.5" fill="#2196f3" />
              <path
                d="M 12 18 C 19 14 29 14 36 18 C 30 20 20 20 12 18 Z"
                fill="#f37626"
              />
              <path
                d="M 8 30 C 19 36 29 36 40 30 C 33 28 17 28 8 30 Z"
                fill="#f37626"
              />
            </svg>
            <span className="font-semibold text-lg tracking-tight text-slate-800 dark:text-slate-100 font-sans">
              jupyter <span className="font-normal text-slate-500 text-sm">notebook</span>
            </span>
          </a>

          <div className="flex items-baseline gap-2 pl-2">
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
              {noteTitle}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {saveStatus === 'saved' && 'Last Checkpoint: Saved'}
              {saveStatus === 'saving' && 'Saving checkpoint...'}
              {saveStatus === 'unsaved' && '(unsaved changes)'}
              {saveStatus === 'error' && '(checkpoint save error)'}
            </span>
          </div>
        </div>

        {/* Right: Python logo + Trusted Pill Badge */}
        <div className="flex items-center gap-3">
          {/* Python 2-snake badge */}
          <svg className="w-5 h-5" viewBox="0 0 110 110">
            <path
              fill="#ffd43b"
              d="M55.5 104.5c26.6 0 25-11.5 25-11.5l-.03-11.9H55v-3.4h35.8s13.7 1.6 13.7-22.5c0-24.2-12-23.3-12-23.3h-7.2v10.1s.4 12-11.8 12H53s-11.5-.2-11.5 11.2v17.5s-1.9 11.8 14 11.8zm15.7-9.6c-2.4 0-4.3-1.9-4.3-4.3s1.9-4.3 4.3-4.3 4.3 1.9 4.3 4.3-1.9 4.3-4.3 4.3z"
            />
            <path
              fill="#306998"
              d="M54.5 5.5c-26.6 0-25 11.5-25 11.5l.03 11.9H55v3.4H19.2S5.5 30.7 5.5 54.8c0 24.2 12 23.3 12 23.3h7.2v-10.1s-.4-12 11.8-12h20.5s11.5.2 11.5-11.2V17.3S70.4 5.5 54.5 5.5zM38.8 15.1c2.4 0 4.3 1.9 4.3 4.3s-1.9 4.3-4.3 4.3-4.3-1.9-4.3-4.3 1.9-4.3 4.3-4.3z"
            />
          </svg>

          {/* Trusted Badge */}
          <span className="text-[11px] px-2.5 py-0.5 rounded border border-[#cccccc] dark:border-[#444444] text-slate-700 dark:text-slate-300 font-sans shadow-sm">
            Trusted
          </span>
        </div>
      </div>

      {/* Row 2: Classic Menu Bar */}
      <div
        ref={menuRef}
        className="px-2 flex items-center justify-between border-t border-[#f0f0f0] dark:border-[#2b2b2b] text-[13px] relative"
      >
        <div className="flex items-center">
          {/* File Menu */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
              className={`px-2.5 py-1 rounded-t hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e] ${
                activeMenu === 'file' ? 'bg-[#eaeaea] dark:bg-[#2e2e2e]' : ''
              }`}
            >
              File
            </button>
            {activeMenu === 'file' && (
              <div className="absolute left-0 top-full mt-0.5 w-56 bg-white dark:bg-[#252526] border border-[#d0d0d0] dark:border-[#3c3c3c] shadow-lg rounded py-1 z-50 text-xs">
                <button
                  onClick={() => {
                    onNewNote();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#f0f0f0] dark:hover:bg-[#37373d] flex justify-between"
                >
                  <span>New Notebook</span>
                  <span className="text-slate-400">Ctrl+N</span>
                </button>
                {onOpenByCode && (
                  <button
                    onClick={() => {
                      onOpenByCode();
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#f0f0f0] dark:hover:bg-[#37373d] text-blue-600 dark:text-blue-400 font-medium"
                  >
                    Open by Code or URL...
                  </button>
                )}
                <button
                  onClick={() => {
                    onSave();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#f0f0f0] dark:hover:bg-[#37373d] flex justify-between"
                >
                  <span>Save Checkpoint</span>
                  <span className="text-slate-400">Ctrl+S</span>
                </button>
                <button
                  onClick={() => {
                    onInstantLocalDownload();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#f0f0f0] dark:hover:bg-[#37373d]"
                >
                  Download as .txt
                </button>
                <div className="h-px bg-[#e5e5e5] dark:bg-[#3c3c3c] my-1" />
                <button
                  onClick={() => {
                    onOpenHistory();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#f0f0f0] dark:hover:bg-[#37373d]"
                >
                  Open Recent (My Notebooks)
                </button>
              </div>
            )}
          </div>

          {/* Edit Menu */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
              className={`px-2.5 py-1 rounded-t hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e] ${
                activeMenu === 'edit' ? 'bg-[#eaeaea] dark:bg-[#2e2e2e]' : ''
              }`}
            >
              Edit
            </button>
            {activeMenu === 'edit' && (
              <div className="absolute left-0 top-full mt-0.5 w-48 bg-white dark:bg-[#252526] border border-[#d0d0d0] dark:border-[#3c3c3c] shadow-lg rounded py-1 z-50 text-xs">
                <button
                  onClick={() => {
                    onCopy();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#f0f0f0] dark:hover:bg-[#37373d]"
                >
                  Copy Content
                </button>
                <button
                  onClick={() => {
                    onTogglePasswordModal();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#f0f0f0] dark:hover:bg-[#37373d]"
                >
                  Password Protection...
                </button>
                {isExistingNote && (
                  <button
                    onClick={() => {
                      onDelete();
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-950/40"
                  >
                    Delete Notebook
                  </button>
                )}
              </div>
            )}
          </div>

          {/* View Menu */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
              className={`px-2.5 py-1 rounded-t hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e] ${
                activeMenu === 'view' ? 'bg-[#eaeaea] dark:bg-[#2e2e2e]' : ''
              }`}
            >
              View
            </button>
            {activeMenu === 'view' && (
              <div className="absolute left-0 top-full mt-0.5 w-52 bg-white dark:bg-[#252526] border border-[#d0d0d0] dark:border-[#3c3c3c] shadow-lg rounded py-1 z-50 text-xs">
                <button
                  onClick={() => {
                    onToggleLineNumbers();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#f0f0f0] dark:hover:bg-[#37373d] flex items-center justify-between"
                >
                  <span>Toggle Line Numbers</span>
                  {showLineNumbers && <Check className="w-3.5 h-3.5 text-[#2196f3]" />}
                </button>
                <button
                  onClick={() => {
                    onToggleWordWrap();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#f0f0f0] dark:hover:bg-[#37373d] flex items-center justify-between"
                >
                  <span>Toggle Word Wrap</span>
                  {wordWrap && <Check className="w-3.5 h-3.5 text-[#2196f3]" />}
                </button>
              </div>
            )}
          </div>

          {/* Run Menu */}
          <button
            onClick={onSave}
            className="px-2.5 py-1 rounded-t hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e]"
          >
            Run
          </button>

          {/* Kernel Menu */}
          <button
            onClick={() => alert('Kernel: JupyterNotebook execution engine active.')}
            className="px-2.5 py-1 rounded-t hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e]"
          >
            Kernel
          </button>

          {/* Settings Menu */}
          <button
            onClick={onToggleTheme}
            className="px-2.5 py-1 rounded-t hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e]"
          >
            Settings
          </button>

          {/* Help Menu */}
          <button
            onClick={() => window.open('https://docs.python.org/', '_blank')}
            className="px-2.5 py-1 rounded-t hover:bg-[#eaeaea] dark:hover:bg-[#2e2e2e]"
          >
            Help
          </button>
        </div>

        {/* Right Info: JupyterLab Link + Kernel Status */}
        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onOpenHistory();
            }}
            className="flex items-center gap-1 hover:text-[#2196f3] transition-colors"
          >
            <span>My Notebooks</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Python 3 (jupyternotebook)</span>
          </div>
        </div>
      </div>

      {/* Row 3: Jupyter Classic Icon Toolbar */}
      <div className="px-3 py-1.5 bg-[#f5f5f5] dark:bg-[#252526] border-t border-[#e0e0e0] dark:border-[#333333] flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left Toolbar Icons */}
        <div className="flex items-center gap-1">
          {/* Save Button */}
          <button
            onClick={onSave}
            className="p-1 rounded hover:bg-[#e0e0e0] dark:hover:bg-[#383838] text-slate-700 dark:text-slate-200"
            title="Save and Checkpoint (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
          </button>

          {/* Plus / Insert Cell */}
          <button
            onClick={onNewNote}
            className="p-1 rounded hover:bg-[#e0e0e0] dark:hover:bg-[#383838] text-slate-700 dark:text-slate-200"
            title="Insert cell below / New note (Ctrl+N)"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Open by Code / URL */}
          {onOpenByCode && (
            <button
              onClick={onOpenByCode}
              className="p-1 rounded hover:bg-[#e0e0e0] dark:hover:bg-[#383838] text-[#2196f3] dark:text-[#64b5f6]"
              title="Open note by 4-character code or URL (with password if protected)"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
          )}

          {/* Cut Cell */}
          <button
            onClick={onCopy}
            className="p-1 rounded hover:bg-[#e0e0e0] dark:hover:bg-[#383838] text-slate-700 dark:text-slate-200"
            title="Cut selected cells"
          >
            <Scissors className="w-4 h-4" />
          </button>

          {/* Copy Cell */}
          <button
            onClick={onCopy}
            className="p-1 rounded hover:bg-[#e0e0e0] dark:hover:bg-[#383838] text-slate-700 dark:text-slate-200"
            title="Copy selected cells"
          >
            <Copy className="w-4 h-4" />
          </button>

          {/* Download / Paste */}
          <button
            onClick={onInstantLocalDownload}
            className="p-1 rounded hover:bg-[#e0e0e0] dark:hover:bg-[#383838] text-slate-700 dark:text-slate-200"
            title="Download .txt"
          >
            <Download className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-[#d0d0d0] dark:bg-[#444444] mx-1" />

          {/* Run Cell */}
          <button
            onClick={onSave}
            className="p-1 rounded hover:bg-[#e0e0e0] dark:hover:bg-[#383838] text-slate-700 dark:text-slate-200"
            title="Run the selected cell (Save note)"
          >
            <Play className="w-4 h-4 fill-slate-700 dark:fill-slate-200" />
          </button>

          {/* Interrupt */}
          <button
            onClick={() => alert('Interrupt kernel')}
            className="p-1 rounded hover:bg-[#e0e0e0] dark:hover:bg-[#383838] text-slate-700 dark:text-slate-200"
            title="Interrupt the kernel"
          >
            <Square className="w-3.5 h-3.5 fill-slate-700 dark:fill-slate-200" />
          </button>

          {/* Restart */}
          <button
            onClick={onNewNote}
            className="p-1 rounded hover:bg-[#e0e0e0] dark:hover:bg-[#383838] text-slate-700 dark:text-slate-200"
            title="Restart the kernel (Clear note)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Restart & Run all */}
          <button
            onClick={onSave}
            className="p-1 rounded hover:bg-[#e0e0e0] dark:hover:bg-[#383838] text-slate-700 dark:text-slate-200"
            title="Restart the kernel, then re-run the whole notebook"
          >
            <FastForward className="w-4 h-4 fill-slate-700 dark:fill-slate-200" />
          </button>

          <div className="h-4 w-px bg-[#d0d0d0] dark:bg-[#444444] mx-1" />

          {/* Cell Type Selector */}
          <select
            className="bg-white dark:bg-[#1e1e1e] border border-[#cccccc] dark:border-[#444444] rounded px-2 py-0.5 text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            defaultValue="Code"
            onChange={() => {}}
          >
            <option value="Code">Code</option>
            <option value="Markdown">Markdown</option>
            <option value="Raw">Raw NBConvert</option>
          </select>
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Custom 4-character code choice */}
          {!isExistingNote && onCustomCodeChange && (
            <div className="flex items-center gap-1 bg-white dark:bg-[#1e1e1e] border border-[#cccccc] dark:border-[#444444] rounded px-1.5 py-0.5">
              <span className="text-[11px] text-slate-500 font-mono">Code:</span>
              <input
                type="text"
                maxLength={8}
                value={customCode}
                onChange={(e) => onCustomCodeChange(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                placeholder="4 chars (opt)"
                className="bg-transparent w-20 text-xs text-blue-600 dark:text-blue-400 font-mono font-semibold outline-none placeholder:text-slate-400 placeholder:font-normal"
                title="Choose your 4 letters/digits to save in memory (or leave blank to auto-generate 4 chars)"
              />
            </div>
          )}

          {/* Expiration Dropdown */}
          {!isExistingNote && (
            <div className="flex items-center gap-1 bg-white dark:bg-[#1e1e1e] border border-[#cccccc] dark:border-[#444444] rounded px-1.5 py-0.5">
              <span className="text-[11px] text-slate-500">Exp:</span>
              <select
                value={expiration}
                onChange={(e) => onExpirationChange(e.target.value as ExpirationOption)}
                className="bg-transparent text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="10m">10m</option>
                <option value="1h">1h</option>
                <option value="6h">6h</option>
                <option value="24h">24h</option>
                <option value="7d">7d</option>
                <option value="30d">30d</option>
                <option value="never">Never</option>
              </select>
            </div>
          )}

          {/* Password Protection Lock */}
          <button
            onClick={onTogglePasswordModal}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-xs transition-colors ${
              isPasswordProtected
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700'
                : 'bg-white dark:bg-[#1e1e1e] text-slate-700 dark:text-slate-300 border-[#cccccc] dark:border-[#444444] hover:bg-[#e8e8e8]'
            }`}
            title="Set custom password / short PIN"
          >
            {isPasswordProtected ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Unlock className="w-3.5 h-3.5 text-slate-400" />}
            <span className="hidden sm:inline">{isPasswordProtected ? 'Protected' : 'Password'}</span>
          </button>

          {/* Share Button (if existing note) */}
          {isExistingNote && (
            <button
              onClick={onShareModal}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#2196f3] hover:bg-[#1976d2] text-white font-medium text-xs shadow-sm transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          )}

          {/* Theme switcher */}
          <button
            onClick={onToggleTheme}
            className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-[#e0e0e0] dark:hover:bg-[#383838]"
            title={`Switch theme: ${theme}`}
          >
            {theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : theme === 'dark' ? (
              <Moon className="w-4 h-4 text-blue-400" />
            ) : (
              <Laptop className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
