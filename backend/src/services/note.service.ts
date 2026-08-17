import { Note } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { generatePublicId } from '../utils/idGenerator.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

export type ExpirationOption = '10m' | '1h' | '6h' | '24h' | '7d' | '30d' | 'never';

export interface CreateNoteInput {
  content: string;
  expiration?: ExpirationOption | string;
  password?: string;
  customPublicId?: string;
}

export interface NoteResponse {
  id: string;
  publicId: string;
  content?: string;
  hasPassword: boolean;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
  downloadCount: number;
  viewCount: number;
}

/**
 * Calculates the exact expiration date given an option string.
 */
export function calculateExpirationDate(expiration?: string): Date | null {
  if (!expiration || expiration === 'never') {
    return null;
  }

  const now = new Date();
  switch (expiration) {
    case '10m':
      return new Date(now.getTime() + 10 * 60 * 1000);
    case '1h':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case '6h':
      return new Date(now.getTime() + 6 * 60 * 60 * 1000);
    case '24h':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default:
      // Check default fallback from environment
      const defaultExp = process.env.DEFAULT_EXPIRATION || '24h';
      if (defaultExp === 'never') return null;
      if (defaultExp === '24h') return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

/**
 * Create a new note with exact content preservation.
 */
export async function createNote(input: CreateNoteInput): Promise<Note> {
  const publicId = input.customPublicId && input.customPublicId.trim().length >= 1
    ? input.customPublicId.trim().replace(/[^a-zA-Z0-9_-]/g, '')
    : generatePublicId(4);

  // Check if custom ID is already taken
  if (input.customPublicId) {
    const existing = await prisma.note.findUnique({ where: { publicId } });
    if (existing) {
      const err: any = new Error(`Code / Custom ID "${publicId}" is already in use.`);
      err.code = 'ID_TAKEN';
      err.statusCode = 409;
      throw err;
    }
  }

  const expiresAt = calculateExpirationDate(input.expiration);
  
  let passwordHash: string | null = null;
  if (input.password && input.password.length > 0) {
    passwordHash = await hashPassword(input.password);
  }

  // NOTE: input.content is stored strictly as received, without trim or formatting
  const note = await prisma.note.create({
    data: {
      publicId,
      content: input.content,
      passwordHash,
      expiresAt,
    },
  });

  return note;
}

/**
 * Regenerates or updates the publicId for an existing note.
 */
export async function regenerateNotePublicId(
  oldPublicId: string,
  newCustomId?: string,
  providedPassword?: string
): Promise<Note> {
  const note = await prisma.note.findUnique({ where: { publicId: oldPublicId } });
  if (!note) {
    const err: any = new Error('Note not found');
    err.code = 'NOTE_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  if (note.passwordHash) {
    if (!providedPassword) {
      const err: any = new Error('Password required to modify this note');
      err.code = 'PASSWORD_REQUIRED';
      err.statusCode = 401;
      throw err;
    }
    const isValid = await verifyPassword(providedPassword, note.passwordHash);
    if (!isValid) {
      const err: any = new Error('Invalid password');
      err.code = 'INVALID_PASSWORD';
      err.statusCode = 401;
      throw err;
    }
  }

  let nextPublicId = generatePublicId(4);
  if (newCustomId && newCustomId.trim().length >= 1) {
    nextPublicId = newCustomId.trim().replace(/[^a-zA-Z0-9_-]/g, '');
    const existing = await prisma.note.findUnique({ where: { publicId: nextPublicId } });
    if (existing && existing.id !== note.id) {
      const err: any = new Error(`Code "${nextPublicId}" is already taken.`);
      err.code = 'ID_TAKEN';
      err.statusCode = 409;
      throw err;
    }
  }

  const updated = await prisma.note.update({
    where: { id: note.id },
    data: { publicId: nextPublicId },
  });

  return updated;
}

/**
 * Get note by public ID.
 * Returns null if not found, or throws EXPIRED if expiresAt is in the past.
 */
export async function getNoteByPublicId(
  publicId: string,
  providedPassword?: string
): Promise<{ note: Note; requiresPasswordAuth?: boolean }> {
  const note = await prisma.note.findUnique({
    where: { publicId },
  });

  if (!note) {
    const error: any = new Error('Note not found');
    error.code = 'NOTE_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  // Check expiration
  if (note.expiresAt && note.expiresAt < new Date()) {
    const error: any = new Error('This note has expired');
    error.code = 'NOTE_EXPIRED';
    error.statusCode = 410;
    throw error;
  }

  // Check password protection
  if (note.passwordHash) {
    if (!providedPassword) {
      return { note, requiresPasswordAuth: true };
    }
    const isValid = await verifyPassword(providedPassword, note.passwordHash);
    if (!isValid) {
      const error: any = new Error('Invalid password provided for this note');
      error.code = 'INVALID_PASSWORD';
      error.statusCode = 401;
      throw error;
    }
  }

  // Atomically increment view count
  await prisma.note.update({
    where: { id: note.id },
    data: { viewCount: { increment: 1 } },
  });

  return { note };
}

/**
 * Update an existing note's content without formatting or trimming.
 */
export async function updateNoteContent(
  publicId: string,
  newContent: string,
  providedPassword?: string,
  newPassword?: string
): Promise<Note> {
  const note = await prisma.note.findUnique({
    where: { publicId },
  });

  if (!note) {
    const error: any = new Error('Note not found');
    error.code = 'NOTE_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  if (note.expiresAt && note.expiresAt < new Date()) {
    const error: any = new Error('This note has expired');
    error.code = 'NOTE_EXPIRED';
    error.statusCode = 410;
    throw error;
  }

  if (note.passwordHash) {
    if (!providedPassword) {
      const error: any = new Error('Password required to edit this note');
      error.code = 'PASSWORD_REQUIRED';
      error.statusCode = 401;
      throw error;
    }
    const isValid = await verifyPassword(providedPassword, note.passwordHash);
    if (!isValid) {
      const error: any = new Error('Invalid password');
      error.code = 'INVALID_PASSWORD';
      error.statusCode = 401;
      throw error;
    }
  }

  let nextPasswordHash = note.passwordHash;
  if (newPassword !== undefined) {
    if (newPassword && newPassword.trim().length > 0) {
      nextPasswordHash = await hashPassword(newPassword.trim());
    } else {
      nextPasswordHash = null;
    }
  }

  const updated = await prisma.note.update({
    where: { id: note.id },
    data: {
      content: newContent,
      passwordHash: nextPasswordHash,
    },
  });

  return updated;
}

/**
 * Delete a note permanently.
 */
export async function deleteNote(
  publicId: string,
  providedPassword?: string
): Promise<boolean> {
  const note = await prisma.note.findUnique({
    where: { publicId },
  });

  if (!note) {
    const error: any = new Error('Note not found');
    error.code = 'NOTE_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  if (note.passwordHash) {
    if (!providedPassword) {
      const error: any = new Error('Password required to delete this note');
      error.code = 'PASSWORD_REQUIRED';
      error.statusCode = 401;
      throw error;
    }
    const isValid = await verifyPassword(providedPassword, note.passwordHash);
    if (!isValid) {
      const error: any = new Error('Invalid password');
      error.code = 'INVALID_PASSWORD';
      error.statusCode = 401;
      throw error;
    }
  }

  await prisma.note.delete({
    where: { id: note.id },
  });

  return true;
}

/**
 * Record a download count increment.
 */
export async function incrementDownloadCount(publicId: string): Promise<void> {
  await prisma.note.update({
    where: { publicId },
    data: { downloadCount: { increment: 1 } },
  });
}
