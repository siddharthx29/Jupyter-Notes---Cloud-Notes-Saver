import { prisma } from '../lib/prisma.js';

/**
 * Removes all expired notes from the database.
 * Returns the count of deleted notes.
 */
export async function cleanupExpiredNotes(): Promise<number> {
  try {
    const result = await prisma.note.deleteMany({
      where: {
        expiresAt: {
          not: null,
          lt: new Date(),
        },
      },
    });
    return result.count;
  } catch (error) {
    console.error('Error during expired notes cleanup:', error);
    throw error;
  }
}

/**
 * Starts a background timer that runs periodic cleanup (default every 10 minutes).
 */
export function startPeriodicCleanup(intervalMs: number = 10 * 60 * 1000): NodeJS.Timeout {
  const timer = setInterval(async () => {
    try {
      const deletedCount = await cleanupExpiredNotes();
      if (deletedCount > 0) {
        console.log(`[CleanupWorker] Successfully purged ${deletedCount} expired note(s).`);
      }
    } catch (err) {
      console.error('[CleanupWorker] Periodic cleanup encountered an error:', err);
    }
  }, intervalMs);

  return timer;
}
