import { describe, it, expect } from 'vitest';
import request from 'supertest';
import path from 'path';
import { getApp } from './testUtils';

// Uses sample.jpg in test directory if present; otherwise create a tiny buffer
const samplePath = path.join(__dirname, 'sample.jpg');

describe('File uploads', () => {
  it('uploads profile image and returns thumbnail info', async () => {
    let builder = request(getApp()).post('/api/uploads/profile');
    const fs = require('fs');
    if (fs.existsSync(samplePath)) {
      builder = builder.attach('file', samplePath);
    } else {
      // 1x1 transparent PNG
      const png1x1 = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6360000002000154a24f5d0000000049454e44ae426082','hex');
      builder = builder.attach('file', png1x1, 'pixel.png');
    }
    const res = await builder;
    if (res.status !== 200) {
      // Provide debug info
      throw new Error('Upload failed status '+res.status+ ' body '+JSON.stringify(res.body));
    }
    expect(res.body.original.id).toBeTruthy();
    expect(res.body.thumbnail.id).toBeTruthy();
    const orig = await request(getApp()).get(`/api/uploads/file/${res.body.original.id}`);
    expect(orig.status).toBe(200);
    const thumb = await request(getApp()).get(`/api/uploads/file/${res.body.thumbnail.id}`);
    expect(thumb.status).toBe(200);
  });
});
