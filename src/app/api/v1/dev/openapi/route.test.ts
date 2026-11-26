import assert from 'node:assert/strict';
import { describe, it, afterEach } from 'node:test';
import { NextRequest } from 'next/server';
import { GET as openapi } from './route';

// NODE_ENV is typed read-only by Next.js; assign through a mutable view.
function setNodeEnv(value: string): void {
  (process.env as unknown as Record<string, string>).NODE_ENV = value;
}

describe('dev openapi route', () => {
  const savedNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    setNodeEnv(savedNodeEnv ?? 'test');
  });

  function req(): NextRequest {
    return new NextRequest('http://localhost:3000/api/v1/dev/openapi', { method: 'GET' });
  }

  it('serves the spec outside production with no-store caching', async () => {
    const res = await openapi(req());
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('cache-control'), 'no-store');
    const spec = await res.json();
    assert.equal(spec.openapi, '3.1.0');
    assert.ok(spec.paths['/health'], 'documents the health route');
    assert.ok(spec.paths['/dev/reset'], 'documents the reset route');
  });

  it('returns 404 in production without ALLOW_DEV_TOOLS', async () => {
    setNodeEnv('production');
    const savedFlag = process.env.ALLOW_DEV_TOOLS;
    delete process.env.ALLOW_DEV_TOOLS;
    try {
      assert.equal((await openapi(req())).status, 404);
    } finally {
      if (savedFlag !== undefined) process.env.ALLOW_DEV_TOOLS = savedFlag;
    }
  });
});
