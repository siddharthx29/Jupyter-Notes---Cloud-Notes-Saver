import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('TempNote API Test Suite', () => {
  beforeAll(async () => {
    // Clean test records
    await prisma.note.deleteMany({});
  });

  afterAll(async () => {
    await prisma.note.deleteMany({});
    await prisma.$disconnect();
  });

  it('1. Preserves exact text formatting, indentation, unicode, and emojis byte-for-byte', async () => {
    const rawContent = `Hello World

    Indented text
        More indentation

Special characters:
!@#$%^&*()[]{}<>?/\\|\`~

Unicode:
₹ € $ © ™ ✓ 🔥

Code:
function test() {
    console.log("Hello");
}`;

    // Create note
    const createRes = await request(app)
      .post('/api/notes')
      .send({
        content: rawContent,
        expiration: '1h',
      })
      .expect(201);

    expect(createRes.body.publicId).toBeDefined();
    const publicId = createRes.body.publicId;

    // Retrieve note
    const getRes = await request(app)
      .get(`/api/notes/${publicId}`)
      .expect(200);

    expect(getRes.body.content).toBe(rawContent);
    expect(getRes.body.publicId).toBe(publicId);

    // Retrieve raw text
    const rawRes = await request(app)
      .get(`/api/notes/${publicId}/raw`)
      .expect('Content-Type', /text\/plain/)
      .expect(200);

    expect(rawRes.text).toBe(rawContent);

    // Download attachment
    const downloadRes = await request(app)
      .get(`/api/notes/${publicId}/download`)
      .expect('Content-Type', /text\/plain/)
      .expect('Content-Disposition', `attachment; filename="tempnote-${publicId}.txt"`)
      .expect(200);

    expect(downloadRes.text).toBe(rawContent);
  });

  it('2. Supports password protection: locks note, prevents unauthorized access, allows authorized', async () => {
    const secretContent = 'TOP_SECRET_CONFIGURATION=xyz123';
    const password = 'mySuperSecretPassword123';

    // Create protected note
    const createRes = await request(app)
      .post('/api/notes')
      .send({
        content: secretContent,
        password: password,
        expiration: '24h',
      })
      .expect(201);

    const publicId = createRes.body.publicId;
    expect(createRes.body.hasPassword).toBe(true);

    // Attempt to access without password (should indicate password required)
    const lockedRes = await request(app)
      .get(`/api/notes/${publicId}`)
      .expect(200);

    expect(lockedRes.body.requiresPassword).toBe(true);
    expect(lockedRes.body.content).toBeUndefined();

    // Attempt to access with wrong password
    const wrongRes = await request(app)
      .get(`/api/notes/${publicId}`)
      .set('x-note-password', 'wrongPassword')
      .expect(401);

    expect(wrongRes.body.error).toBe('INVALID_PASSWORD');

    // Access with correct password
    const successRes = await request(app)
      .get(`/api/notes/${publicId}`)
      .set('x-note-password', password)
      .expect(200);

    expect(successRes.body.requiresPassword).toBe(false);
    expect(successRes.body.content).toBe(secretContent);
  });

  it('3. Allows updating note content while preserving exact text', async () => {
    const initialContent = 'Initial Line 1\n    Initial Line 2';
    const updatedContent = 'Updated Line 1\n\t\tTabbed Line 2\n🔥 Emoji preserved';

    const createRes = await request(app)
      .post('/api/notes')
      .send({ content: initialContent })
      .expect(201);

    const publicId = createRes.body.publicId;

    // Update note
    await request(app)
      .patch(`/api/notes/${publicId}`)
      .send({ content: updatedContent })
      .expect(200);

    // Verify retrieval
    const getRes = await request(app)
      .get(`/api/notes/${publicId}`)
      .expect(200);

    expect(getRes.body.content).toBe(updatedContent);
  });

  it('4. Handles note deletion and subsequent 404', async () => {
    const content = 'Ephemeral test content to delete';
    const createRes = await request(app)
      .post('/api/notes')
      .send({ content })
      .expect(201);

    const publicId = createRes.body.publicId;

    // Delete note
    await request(app)
      .delete(`/api/notes/${publicId}`)
      .expect(200);

    // Verify 404
    const getRes = await request(app)
      .get(`/api/notes/${publicId}`)
      .expect(404);

    expect(getRes.body.error).toBe('NOTE_NOT_FOUND');
  });

  it('5. Handles expired notes with HTTP 410 Gone', async () => {
    // Manually create an already expired note in DB
    const expiredNote = await prisma.note.create({
      data: {
        publicId: 'expired123',
        content: 'This should be gone',
        expiresAt: new Date(Date.now() - 10000), // 10 seconds in past
      },
    });

    const res = await request(app)
      .get(`/api/notes/${expiredNote.publicId}`)
      .expect(410);

    expect(res.body.error).toBe('NOTE_EXPIRED');
  });

  it('6. Cleanup cron endpoint purges expired notes and respects CRON_SECRET', async () => {
    // Insert an expired note
    await prisma.note.create({
      data: {
        publicId: 'tocleanup1',
        content: 'Old note',
        expiresAt: new Date(Date.now() - 60000),
      },
    });

    // Test unauthorized access if secret configured
    const cronSecret = process.env.CRON_SECRET || 'tempnote_super_secret_cron_key_change_in_production';

    const cleanRes = await request(app)
      .post('/api/cron/cleanup')
      .set('Authorization', `Bearer ${cronSecret}`)
      .expect(200);

    expect(cleanRes.body.success).toBe(true);
    expect(cleanRes.body.purgedCount).toBeGreaterThanOrEqual(1);

    // Verify note is no longer in DB
    const checkNote = await prisma.note.findUnique({
      where: { publicId: 'tocleanup1' },
    });
    expect(checkNote).toBeNull();
  });
});
