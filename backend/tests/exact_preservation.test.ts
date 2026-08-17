import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('User Exact Verification Specification Tests', () => {
  beforeAll(async () => {
    await prisma.note.deleteMany({});
  });

  afterAll(async () => {
    await prisma.note.deleteMany({});
    await prisma.$disconnect();
  });

  it('Verifies exact character-for-character, byte-for-byte user snippet preservation', async () => {
    const userPayload = `Hello World

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

    // 1. Exact text is saved
    const createRes = await request(app)
      .post('/api/notes')
      .send({ content: userPayload, expiration: '24h' })
      .expect(201);

    const publicId = createRes.body.publicId;
    expect(publicId).toBeDefined();

    // 2. Exact text is retrieved
    const getRes = await request(app)
      .get(`/api/notes/${publicId}`)
      .expect(200);

    expect(getRes.body.content).toBe(userPayload);

    // Verify raw endpoint
    const rawRes = await request(app)
      .get(`/api/notes/${publicId}/raw`)
      .expect(200);

    expect(rawRes.text).toBe(userPayload);

    // 3. Server download preserves exact bytes
    const downloadRes = await request(app)
      .get(`/api/notes/${publicId}/download`)
      .expect(200);

    expect(downloadRes.text).toBe(userPayload);
    expect(downloadRes.headers['content-type']).toMatch(/text\/plain/);

    // 4. Editing preserves exact content
    const editedPayload = userPayload + '\n\n    Additional line with exact indentation';
    const patchRes = await request(app)
      .patch(`/api/notes/${publicId}`)
      .send({ content: editedPayload })
      .expect(200);

    expect(patchRes.body.success).toBe(true);

    const getEditedRes = await request(app)
      .get(`/api/notes/${publicId}`)
      .expect(200);

    expect(getEditedRes.body.content).toBe(editedPayload);

    // 5. Deletion prevents retrieval
    await request(app)
      .delete(`/api/notes/${publicId}`)
      .expect(200);

    await request(app)
      .get(`/api/notes/${publicId}`)
      .expect(404);
  });

  it('Verifies large text handling (100,000+ characters) without corruption', async () => {
    // Generate large repetitive text block
    const baseBlock = "Line with mixed \t tabs and spaces   and unicode ₹ € 🔥\n";
    const largeContent = baseBlock.repeat(2500); // ~130 KB, ~2500 lines

    const createRes = await request(app)
      .post('/api/notes')
      .send({ content: largeContent })
      .expect(201);

    const publicId = createRes.body.publicId;

    const getRes = await request(app)
      .get(`/api/notes/${publicId}`)
      .expect(200);

    expect(getRes.body.content).toBe(largeContent);
    expect(getRes.body.content.length).toBe(largeContent.length);
  });
});
