import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Editor } from './components/Editor';
import { StatusBar } from './components/StatusBar';
import { ShareModal } from './components/ShareModal';
import { HistoryModal } from './components/HistoryModal';
import { PasswordModal } from './components/PasswordModal';
import { OpenNoteModal } from './components/OpenNoteModal';
import { ExpiredView } from './components/ExpiredView';
import { useTheme } from './hooks/useTheme';
import { useAutosave } from './hooks/useAutosave';
import { ExpirationOption, NoteData } from './types/note';
import * as api from './lib/api';
import { downloadTextLocally } from './lib/download';
import { saveLocalNoteRecord, removeLocalNoteRecord } from './lib/storage';

export function App() {
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  // Core Editor States (Preserved verbatim)
  const [content, setContent] = useState<string>('');
  const [publicId, setPublicId] = useState<string | null>(null);
  const [expiration, setExpiration] = useState<ExpirationOption>('24h');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [password, setPassword] = useState<string>('');
  const [hasPassword, setHasPassword] = useState<boolean>(false);

  // Editor View Options
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(() => {
    return localStorage.getItem('tempnote_linenumbers') !== 'false';
  });
  const [wordWrap, setWordWrap] = useState<boolean>(() => {
    return localStorage.getItem('tempnote_wordwrap') !== 'false';
  });

  // Cursor & Status
  const [cursorLine, setCursorLine] = useState<number>(1);
  const [cursorCol, setCursorCol] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  // Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [isOpenNoteModalOpen, setIsOpenNoteModalOpen] = useState<boolean>(false);
  const [passwordModalMode, setPasswordModalMode] = useState<'set' | 'unlock'>('set');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Autosave configuration
  const [autosaveEnabled, setAutosaveEnabled] = useState<boolean>(true);

  const [customCode, setCustomCode] = useState<string>('');

  // Save / Update Handler
  const handleSave = useCallback(async () => {
    if (isLoading) return;
    try {
      if (publicId) {
        // Update existing note
        const res = await api.updateNote(publicId, content, password);
        saveLocalNoteRecord(
          {
            publicId,
            hasPassword: !!password || hasPassword,
            expiresAt,
            createdAt: new Date().toISOString(),
          },
          content
        );
        return res;
      } else {
        // Create new note with optional custom 4-character code
        setIsLoading(true);
        const res = await api.createNote(content, expiration, password, customCode);
        setPublicId(res.publicId);
        setExpiresAt(res.expiresAt);
        setHasPassword(res.hasPassword);

        // Update URL path to /:publicId
        window.history.pushState({}, '', `/${res.publicId}`);

        // Save reference locally
        saveLocalNoteRecord(res, content);

        setIsShareModalOpen(true);
        setIsLoading(false);
        return res;
      }
    } catch (err: any) {
      setIsLoading(false);
      console.error('Save failed:', err);
      alert(err.message || 'Failed to save note');
      throw err;
    }
  }, [publicId, content, expiration, password, hasPassword, expiresAt, customCode, isLoading]);

  // Hook for debounced autosaving
  const {
    saveStatus,
    setSaveStatus,
    resetSavedContent,
  } = useAutosave({
    enabled: autosaveEnabled,
    delay: 1500,
    content,
    isExistingNote: !!publicId,
    onSave: async () => {
      await handleSave();
    },
  });

  // Extract public ID from URL on initial load
  const loadNoteFromUrl = useCallback(async (idToLoad: string, pwd?: string) => {
    setIsLoading(true);
    setIsExpired(false);
    setIsNotFound(false);
    setPasswordError(null);

    try {
      const cleanPwd = pwd ? pwd.trim() : undefined;
      const data: NoteData = await api.getNote(idToLoad, cleanPwd);

      if (data.requiresPassword) {
        setPublicId(idToLoad);
        setHasPassword(true);
        setPasswordModalMode('unlock');
        setIsPasswordModalOpen(true);
        setIsLoading(false);
        return;
      }

      setPublicId(data.publicId);
      setContent(data.content);
      resetSavedContent(data.content);
      setHasPassword(data.hasPassword);
      setExpiresAt(data.expiresAt);
      if (cleanPwd) setPassword(cleanPwd);

      saveLocalNoteRecord(data, data.content);
      setIsLoading(false);
      setIsPasswordModalOpen(false);
    } catch (err: any) {
      setIsLoading(false);
      setPublicId(idToLoad);
      if (err.statusCode === 410 || err.error === 'NOTE_EXPIRED') {
        setIsExpired(true);
      } else if (err.statusCode === 404 || err.error === 'NOTE_NOT_FOUND') {
        setIsNotFound(true);
      } else if (err.statusCode === 401 || err.error === 'INVALID_PASSWORD') {
        setPasswordError('Incorrect password. Please try again.');
        setPasswordModalMode('unlock');
        setIsPasswordModalOpen(true);
      } else {
        console.error('Failed to load note:', err);
      }
    }
  }, []);

  // Parse path on mount or popstate (supports both /:code and /n/:code and ?pwd=...)
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const queryPassword = searchParams.get('pwd') || searchParams.get('password') || undefined;
      const queryId = searchParams.get('id');

      // Check /n/:publicId OR /:publicId OR ?id=:publicId
      let detectedId: string | null = null;
      const nMatch = path.match(/^\/n\/([a-zA-Z0-9_-]+)/);
      if (nMatch && nMatch[1]) {
        detectedId = nMatch[1];
      } else if (path.length > 1 && !path.startsWith('/api') && !path.includes('.')) {
        // Direct root code: /FmN1HxddmJ
        const cleanPath = path.slice(1).trim();
        if (cleanPath && cleanPath !== '') {
          detectedId = cleanPath;
        }
      } else if (queryId) {
        detectedId = queryId;
      }

      if (detectedId) {
        loadNoteFromUrl(detectedId, queryPassword);
      } else {
        // Homepage
        setPublicId(null);
        setContent('');
        resetSavedContent('');
        setExpiresAt(null);
        setHasPassword(false);
        setPassword('');
        setIsExpired(false);
        setIsNotFound(false);
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [loadNoteFromUrl]);

  // Create clean new note
  const handleNewNote = () => {
    window.history.pushState({}, '', '/');
    setPublicId(null);
    setCustomCode('');
    setContent('');
    resetSavedContent('');
    setExpiresAt(null);
    setHasPassword(false);
    setPassword('');
    setIsExpired(false);
    setIsNotFound(false);
    setSaveStatus('saved');
  };

  // Instant local download (.txt)
  const handleInstantLocalDownload = () => {
    const filename = publicId ? `tempnote-${publicId}.txt` : 'tempnote.txt';
    downloadTextLocally(content, filename);
  };

  // Server-side download trigger
  const handleServerDownload = () => {
    if (!publicId) return;
    const downloadUrl = api.getServerDownloadUrl(publicId);
    window.open(downloadUrl, '_blank');
  };

  // Delete note
  const handleDelete = async () => {
    if (!publicId) return;
    const confirmDelete = window.confirm(
      'Are you sure you want to permanently delete this note? This action cannot be undone.'
    );
    if (!confirmDelete) return;

    try {
      await api.deleteNote(publicId, password);
      removeLocalNoteRecord(publicId);
      alert('Note deleted permanently.');
      handleNewNote();
    } catch (err: any) {
      alert(`Delete failed: ${err.message || 'Error occurred'}`);
    }
  };

  // Global Keyboard Shortcuts (Ctrl+N, Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewNote();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewNote]);

  // View option toggles
  const handleToggleLineNumbers = () => {
    setShowLineNumbers((prev) => {
      const next = !prev;
      localStorage.setItem('tempnote_linenumbers', String(next));
      return next;
    });
  };

  const handleToggleWordWrap = () => {
    setWordWrap((prev) => {
      const next = !prev;
      localStorage.setItem('tempnote_wordwrap', String(next));
      return next;
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f7f7f7] dark:bg-[#181818]">
      {/* Top Jupyter Header */}
      <Header
        onNewNote={handleNewNote}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        showLineNumbers={showLineNumbers}
        onToggleLineNumbers={handleToggleLineNumbers}
        wordWrap={wordWrap}
        onToggleWordWrap={handleToggleWordWrap}
        isPasswordProtected={hasPassword || !!password}
        onTogglePasswordModal={() => {
          setPasswordModalMode('set');
          setIsPasswordModalOpen(true);
        }}
        publicId={publicId}
        saveStatus={saveStatus}
        onSave={handleSave}
        onCopy={handleCopy}
        onInstantLocalDownload={handleInstantLocalDownload}
        onShareModal={() => setIsShareModalOpen(true)}
        onDelete={handleDelete}
        expiration={expiration}
        onExpirationChange={setExpiration}
        isExistingNote={!!publicId}
        customCode={customCode}
        onCustomCodeChange={setCustomCode}
        onOpenByCode={() => setIsOpenNoteModalOpen(true)}
      />

      {/* Main View Area */}
      {isExpired || isNotFound ? (
        <ExpiredView
          onNewNote={handleNewNote}
          publicId={publicId || undefined}
          isNotFound={isNotFound}
        />
      ) : (
        <main className="flex-1 w-full h-full relative overflow-hidden flex flex-col">
          <Editor
            value={content}
            onChange={(val) => {
              setContent(val);
            }}
            onSave={handleSave}
            onCopy={handleCopy}
            onDownload={handleInstantLocalDownload}
            showLineNumbers={showLineNumbers}
            wordWrap={wordWrap}
            isDark={resolvedTheme === 'dark'}
            onCursorChange={(ln, col) => {
              setCursorLine(ln);
              setCursorCol(col);
            }}
          />
        </main>
      )}

      {/* Bottom Jupyter Status & Control Toolbar */}
      {!isExpired && !isNotFound && (
        <StatusBar
          content={content}
          cursorLine={cursorLine}
          cursorCol={cursorCol}
          saveStatus={saveStatus}
          isExistingNote={!!publicId}
          onSave={handleSave}
          onInstantLocalDownload={handleInstantLocalDownload}
          autosaveEnabled={autosaveEnabled}
          onToggleAutosave={() => setAutosaveEnabled((prev) => !prev)}
        />
      )}

      {/* Share / Link Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        publicId={publicId || ''}
        expiresAt={expiresAt}
        hasPassword={hasPassword || !!password}
        password={password}
        onServerDownload={handleServerDownload}
        onPublicIdChanged={(newPublicId) => {
          setPublicId(newPublicId);
          window.history.pushState({}, '', `/${newPublicId}`);
          saveLocalNoteRecord(
            {
              publicId: newPublicId,
              hasPassword: hasPassword || !!password,
              expiresAt,
              createdAt: new Date().toISOString(),
            },
            content
          );
        }}
      />

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onSelectNote={(selectedId) => {
          window.history.pushState({}, '', `/n/${selectedId}`);
          loadNoteFromUrl(selectedId);
        }}
      />

      {/* Password Modal (Set or Unlock) */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        mode={passwordModalMode}
        initialPassword={password}
        errorMessage={passwordError}
        onSubmit={async (enteredPassword) => {
          const trimmed = enteredPassword.trim();
          if (passwordModalMode === 'set') {
            setPassword(trimmed);
            setHasPassword(!!trimmed);
            setIsPasswordModalOpen(false);
            if (publicId) {
              await api.updateNote(publicId, content, password, trimmed);
            }
          } else {
            // Unlock mode
            const pathSegments = window.location.pathname.split('/').filter(Boolean);
            const targetId = publicId || (pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : '');
            if (targetId) {
              await loadNoteFromUrl(targetId, trimmed);
            }
          }
        }}
      />

      {/* Open by 4-Char Code or URL Modal */}
      <OpenNoteModal
        isOpen={isOpenNoteModalOpen}
        onClose={() => setIsOpenNoteModalOpen(false)}
        onOpenNote={(targetCode, targetPwd) => {
          window.history.pushState({}, '', `/${targetCode}`);
          loadNoteFromUrl(targetCode, targetPwd);
        }}
      />
    </div>
  );
}

export default App;
