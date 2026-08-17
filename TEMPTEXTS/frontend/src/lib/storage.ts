import { LocalNoteRecord, NoteMetadata } from '../types/note';

const STORAGE_KEY = 'tempnote_my_notes_history_v1';

/**
 * Retrieves the list of recently created / opened notes on this device from localStorage.
 */
export function getLocalNoteHistory(): LocalNoteRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list: LocalNoteRecord[] = JSON.parse(raw);
    
    // Filter out items that have already expired locally (to keep history clean)
    const now = new Date().getTime();
    return list.filter(item => {
      if (!item.expiresAt) return true; // never expires
      return new Date(item.expiresAt).getTime() > now;
    });
  } catch {
    return [];
  }
}

/**
 * Saves or updates a note record in local device history.
 * Only stores publicId, small first-line preview snippet, creation timestamp, and expiration.
 */
export function saveLocalNoteRecord(meta: NoteMetadata, contentPreview = ''): void {
  try {
    const existing = getLocalNoteHistory();
    // Generate safe snippet (first 60 chars of first line)
    const firstLine = contentPreview.split('\n')[0] || 'Untitled Note';
    const snippet = firstLine.length > 60 ? `${firstLine.substring(0, 60)}...` : firstLine;

    const newRecord: LocalNoteRecord = {
      publicId: meta.publicId,
      title: snippet || `Note #${meta.publicId}`,
      snippet: snippet,
      createdAt: meta.createdAt || new Date().toISOString(),
      expiresAt: meta.expiresAt,
      hasPassword: !!meta.hasPassword,
    };

    // Remove if already exists, then prepend to top
    const updated = [newRecord, ...existing.filter(item => item.publicId !== meta.publicId)].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save note to local history:', e);
  }
}

/**
 * Removes a specific note record from local history.
 */
export function removeLocalNoteRecord(publicId: string): void {
  try {
    const existing = getLocalNoteHistory();
    const filtered = existing.filter(item => item.publicId !== publicId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to remove note from local history:', e);
  }
}

/**
 * Clears all local note history on this device.
 */
export function clearAllLocalHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear local history:', e);
  }
}
