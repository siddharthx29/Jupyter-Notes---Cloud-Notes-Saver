import { Router } from 'express';
import * as noteController from '../controllers/note.controller.js';
import { createNoteLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Create note (rate limited)
router.post('/', createNoteLimiter, noteController.createNote);

// Regenerate ID / custom slug for existing note
router.post('/:publicId/regenerate-id', noteController.regenerateNoteId);

// Retrieve note
router.get('/:publicId', noteController.getNote);

// Update note content
router.patch('/:publicId', noteController.updateNote);

// Delete note
router.delete('/:publicId', noteController.deleteNote);

// Server download as .txt attachment
router.get('/:publicId/download', noteController.downloadNote);

// Raw text display
router.get('/:publicId/raw', noteController.getRawNote);

export default router;
