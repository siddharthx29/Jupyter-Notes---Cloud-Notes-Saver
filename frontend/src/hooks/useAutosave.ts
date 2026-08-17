import { useEffect, useRef, useState } from 'react';
import { SaveStatus } from '../types/note';

interface UseAutosaveOptions {
  enabled: boolean;
  delay?: number;
  content: string;
  isExistingNote: boolean;
  onSave: () => Promise<void>;
}

export function useAutosave({
  enabled,
  delay = 1500,
  content,
  isExistingNote,
  onSave,
}: UseAutosaveOptions) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const lastSavedContent = useRef(content);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstMount = useRef(true);

  // Sync when initial content is loaded or set from server
  const resetSavedContent = (newContent: string) => {
    lastSavedContent.current = newContent;
    setSaveStatus('saved');
  };

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (content === lastSavedContent.current) {
      setSaveStatus('saved');
      return;
    }

    setSaveStatus('unsaved');

    // Only automatically save if enabled AND we already have an existing note ID
    // (Don't automatically create new notes in DB just on initial typing unless user explicitly clicks save)
    if (!enabled || !isExistingNote) {
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      try {
        setSaveStatus('saving');
        await onSave();
        lastSavedContent.current = content;
        setSaveStatus('saved');
      } catch (err) {
        console.error('Autosave error:', err);
        setSaveStatus('error');
      }
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [content, enabled, isExistingNote, delay, onSave]);

  return {
    saveStatus,
    setSaveStatus,
    resetSavedContent,
    lastSavedContent: lastSavedContent.current,
  };
}
