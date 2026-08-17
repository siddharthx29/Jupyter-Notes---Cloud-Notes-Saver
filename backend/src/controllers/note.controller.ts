import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as noteService from '../services/note.service.js';

const createNoteSchema = z.object({
  content: z.string({ required_error: 'Content is required' }),
  expiration: z.string().optional(),
  password: z.string().optional(),
  customPublicId: z.string().optional(),
});

const updateNoteSchema = z.object({
  content: z.string({ required_error: 'Content is required' }),
  password: z.string().optional(),
  newPassword: z.string().optional(),
});

/**
 * Helper to get the full URL for a public note ID.
 */
function getNoteUrl(req: Request, publicId: string): string {
  const baseUrl = process.env.BASE_URL || 'https://localhostree.netlify.app';
  return `${baseUrl}/n/${publicId}`;
}

/**
 * Helper to extract password from request headers, query, or body.
 */
function extractPassword(req: Request): string | undefined {
  const header = req.headers['x-note-password'];
  if (typeof header === 'string') return header.trim();
  if (req.body && typeof req.body.password === 'string') return req.body.password.trim();
  if (typeof req.query.password === 'string') return req.query.password.trim();
  if (typeof req.query.pwd === 'string') return req.query.pwd.trim();
  return undefined;
}

/**
 * Controller: Create a new note
 */
export async function createNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = createNoteSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Invalid note data',
        details: parseResult.error.flatten(),
      });
      return;
    }

    const { content, expiration, password, customPublicId } = parseResult.data;

    // Check payload size
    const maxSize = parseInt(process.env.MAX_NOTE_SIZE || '5242880', 10);
    if (Buffer.byteLength(content, 'utf8') > maxSize) {
      res.status(413).json({
        error: 'PAYLOAD_TOO_LARGE',
        message: `Note exceeds maximum permitted size of ${Math.round(maxSize / (1024 * 1024))}MB`,
      });
      return;
    }

    const note = await noteService.createNote({
      content,
      expiration,
      password,
      customPublicId,
    });

    const url = getNoteUrl(req, note.publicId);

    res.status(201).json({
      publicId: note.publicId,
      url,
      expiresAt: note.expiresAt,
      hasPassword: !!note.passwordHash,
      createdAt: note.createdAt,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Regenerate note ID or set custom code
 */
export async function regenerateNoteId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { publicId } = req.params;
    const customCode = req.body?.customCode;
    const password = extractPassword(req);

    const updated = await noteService.regenerateNotePublicId(publicId, customCode, password);
    const url = getNoteUrl(req, updated.publicId);

    res.status(200).json({
      success: true,
      publicId: updated.publicId,
      url,
      expiresAt: updated.expiresAt,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Retrieve note by public ID
 */
export async function getNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { publicId } = req.params;
    const password = extractPassword(req);

    const result = await noteService.getNoteByPublicId(publicId, password);

    if (result.requiresPasswordAuth) {
      res.status(200).json({
        publicId: result.note.publicId,
        requiresPassword: true,
        hasPassword: true,
        expiresAt: result.note.expiresAt,
        createdAt: result.note.createdAt,
        updatedAt: result.note.updatedAt,
      });
      return;
    }

    const { note } = result;

    res.status(200).json({
      publicId: note.publicId,
      content: note.content,
      hasPassword: !!note.passwordHash,
      requiresPassword: false,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      expiresAt: note.expiresAt,
      downloadCount: note.downloadCount,
      viewCount: note.viewCount,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Update existing note content
 */
export async function updateNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { publicId } = req.params;
    const parseResult = updateNoteSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Invalid update data',
        details: parseResult.error.flatten(),
      });
      return;
    }

    const { content, newPassword } = parseResult.data;
    const password = extractPassword(req);

    // Check payload size
    const maxSize = parseInt(process.env.MAX_NOTE_SIZE || '5242880', 10);
    if (Buffer.byteLength(content, 'utf8') > maxSize) {
      res.status(413).json({
        error: 'PAYLOAD_TOO_LARGE',
        message: `Note exceeds maximum permitted size of ${Math.round(maxSize / (1024 * 1024))}MB`,
      });
      return;
    }

    const updated = await noteService.updateNoteContent(publicId, content, password, newPassword);

    res.status(200).json({
      success: true,
      publicId: updated.publicId,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Delete note
 */
export async function deleteNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { publicId } = req.params;
    const password = extractPassword(req);

    await noteService.deleteNote(publicId, password);

    res.status(200).json({
      success: true,
      message: 'Note deleted permanently',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Download note as attachment (.txt)
 */
export async function downloadNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { publicId } = req.params;
    const password = extractPassword(req);

    const result = await noteService.getNoteByPublicId(publicId, password);

    if (result.requiresPasswordAuth) {
      res.status(401).json({
        error: 'PASSWORD_REQUIRED',
        message: 'Password required to download this note',
      });
      return;
    }

    const { note } = result;

    await noteService.incrementDownloadCount(publicId);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="tempnote-${publicId}.txt"`);
    res.send(note.content);
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Get raw text content directly
 */
export async function getRawNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { publicId } = req.params;
    const password = extractPassword(req);

    const result = await noteService.getNoteByPublicId(publicId, password);

    if (result.requiresPasswordAuth) {
      res.status(401).json({
        error: 'PASSWORD_REQUIRED',
        message: 'Password required to view raw note',
      });
      return;
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(result.note.content);
  } catch (error) {
    next(error);
  }
}
