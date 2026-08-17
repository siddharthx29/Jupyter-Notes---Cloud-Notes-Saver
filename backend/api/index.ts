import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/app.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    return app(req, res);
  } catch (error: any) {
    console.error('Serverless Function Handler Unhandled Error:', error);
    return res.status(500).json({
      error: 'SERVERLESS_HANDLER_ERROR',
      message: error?.message || 'Serverless invocation failed',
      stack: error?.stack,
    });
  }
}
