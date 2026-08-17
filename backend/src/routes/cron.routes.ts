import { Router, Request, Response } from 'express';
import { cleanupExpiredNotes } from '../services/cleanup.service.js';

const router = Router();

/**
 * Endpoint for platform cron triggers (e.g. Vercel Cron, GitHub Actions, Render Cron, etc.)
 */
router.all('/cleanup', async (req: Request, res: Response) => {
  const secretHeader = req.headers['authorization'] || req.headers['x-cron-secret'];
  const querySecret = req.query.secret;

  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret) {
    const bearer = typeof secretHeader === 'string' && secretHeader.startsWith('Bearer ')
      ? secretHeader.slice(7)
      : secretHeader;

    const provided = bearer || querySecret;

    if (provided !== expectedSecret) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Invalid cron authorization secret',
      });
      return;
    }
  }

  try {
    const purgedCount = await cleanupExpiredNotes();
    res.status(200).json({
      success: true,
      message: `Cleaned up ${purgedCount} expired note(s)`,
      purgedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'CLEANUP_FAILED',
      message: err.message || 'Failed to execute cleanup',
    });
  }
});

export default router;
