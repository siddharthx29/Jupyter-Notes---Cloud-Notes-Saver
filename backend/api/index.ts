import type { VercelRequest, VercelResponse } from '@vercel/node';

let cachedApp: any = null;

async function getApp() {
  if (cachedApp) return cachedApp;
  try {
    const mod = await import('../dist/app.js');
    cachedApp = mod.default || mod;
  } catch {
    const mod = await import('../src/app.js');
    cachedApp = mod.default || mod;
  }
  return cachedApp;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error: any) {
    console.error('Serverless Function Handler Error:', error);
    return res.status(500).json({
      error: 'SERVERLESS_FUNCTION_ERROR',
      message: error?.message || 'Failed to initialize backend handler',
      stack: process.env.NODE_ENV !== 'production' ? error?.stack : undefined,
    });
  }
}
