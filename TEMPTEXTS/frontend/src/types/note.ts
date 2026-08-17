export type ExpirationOption = '10m' | '1h' | '6h' | '24h' | '7d' | '30d' | 'never';

export interface NoteMetadata {
  publicId: string;
  url?: string;
  hasPassword: boolean;
  requiresPassword?: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt?: string;
  downloadCount?: number;
  viewCount?: number;
}

export interface NoteData extends NoteMetadata {
  content: string;
}

export interface LocalNoteRecord {
  publicId: string;
  snippet: string;
  title: string;
  createdAt: string;
  expiresAt: string | null;
  hasPassword: boolean;
}

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';
