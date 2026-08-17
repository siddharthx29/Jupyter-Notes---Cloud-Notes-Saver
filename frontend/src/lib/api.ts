import { ExpirationOption, NoteData, NoteMetadata } from '../types/note';

const API_ROOT = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_BASE = API_ROOT ? `${API_ROOT}/api/notes` : '/api/notes';

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorData: any = {};
    try {
      errorData = await res.json();
    } catch {
      errorData = { message: res.statusText };
    }
    const err: ApiError = {
      error: errorData.error || 'REQUEST_FAILED',
      message: errorData.message || 'An error occurred during request',
      statusCode: res.status,
    };
    throw err;
  }
  return res.json();
}

/**
 * Creates a new note with exact content.
 */
export async function createNote(
  content: string,
  expiration: ExpirationOption = '24h',
  password?: string,
  customPublicId?: string
): Promise<NoteMetadata> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content,
      expiration,
      password: password && password.trim() ? password : undefined,
      customPublicId: customPublicId && customPublicId.trim() ? customPublicId.trim() : undefined,
    }),
  });
  return handleResponse<NoteMetadata>(res);
}

/**
 * Regenerates or updates the public ID / custom code for a note.
 */
export async function regenerateNoteId(
  publicId: string,
  customCode?: string,
  password?: string
): Promise<{ success: boolean; publicId: string; url: string; expiresAt: string | null }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (password) {
    headers['x-note-password'] = password;
  }

  const res = await fetch(`${API_BASE}/${encodeURIComponent(publicId)}/regenerate-id`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ customCode }),
  });
  return handleResponse<{ success: boolean; publicId: string; url: string; expiresAt: string | null }>(res);
}

/**
 * Retrieves an existing note.
 */
export async function getNote(
  publicId: string,
  password?: string
): Promise<NoteData> {
  const headers: Record<string, string> = {};
  let url = `${API_BASE}/${encodeURIComponent(publicId)}`;
  if (password && password.trim()) {
    headers['x-note-password'] = password.trim();
    url += `?pwd=${encodeURIComponent(password.trim())}`;
  }

  const res = await fetch(url, {
    method: 'GET',
    headers,
  });
  return handleResponse<NoteData>(res);
}

/**
 * Updates an existing note.
 */
export async function updateNote(
  publicId: string,
  content: string,
  password?: string,
  newPassword?: string
): Promise<{ success: boolean; publicId: string; updatedAt: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (password) {
    headers['x-note-password'] = password;
  }

  const res = await fetch(`${API_BASE}/${encodeURIComponent(publicId)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      content,
      newPassword: newPassword !== undefined ? newPassword : password,
    }),
  });
  return handleResponse<{ success: boolean; publicId: string; updatedAt: string }>(res);
}

/**
 * Deletes a note permanently.
 */
export async function deleteNote(
  publicId: string,
  password?: string
): Promise<{ success: boolean; message: string }> {
  const headers: Record<string, string> = {};
  if (password) {
    headers['x-note-password'] = password;
  }

  const res = await fetch(`${API_BASE}/${encodeURIComponent(publicId)}`, {
    method: 'DELETE',
    headers,
  });
  return handleResponse<{ success: boolean; message: string }>(res);
}

/**
 * Helper to get the server download URL.
 */
export function getServerDownloadUrl(publicId: string): string {
  return `${API_BASE}/${encodeURIComponent(publicId)}/download`;
}

/**
 * Helper to get the raw content URL.
 */
export function getRawContentUrl(publicId: string): string {
  return `${API_BASE}/${encodeURIComponent(publicId)}/raw`;
}
