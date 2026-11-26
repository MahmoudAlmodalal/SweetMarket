import assert from 'node:assert/strict';
import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { AddressInfo } from 'node:net';
import { NextRequest } from 'next/server';
import { proxyToUpstreamIfConfigured, pingUpstreamHealth } from '@/server/http';
import { GET as listCategories } from '@/app/api/v1/categories/route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-proxy-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

type RecordedRequest = {
  method: string;
  url: string;
  headers: http.IncomingHttpHeaders;
  body: string;
};

let server: http.Server;
let baseUrl: string;
let requests: RecordedRequest[];
let responder: (req: RecordedRequest) => { status: number; body: string; contentType?: string };

const ENV_KEYS = ['BACKEND_API_URL', 'BACKEND_STRICT_PROXY', 'BACKEND_INTERNAL_SECRET'] as const;
let savedEnv: Record<string, string | undefined>;

before(async () => {
  requests = [];
  responder = () => ({ status: 200, body: '{"data":"default"}' });
  server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      const recorded: RecordedRequest = {
        method: req.method ?? 'GET',
        url: req.url ?? '/',
        headers: req.headers,
        body,
      };
      requests.push(recorded);
      const out = responder(recorded);
      res.writeHead(out.status, {
        'content-type': out.contentType ?? 'application/json; charset=utf-8',
      });
      res.end(out.body);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  requests = [];
  responder = () => ({ status: 200, body: '{"data":"default"}' });
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

function req(url: string, init?: { method?: string; body?: string; headers?: Record<string, string> }): NextRequest {
  return new NextRequest(url, {
    method: init?.method ?? 'GET',
    headers: init?.headers,
    body: init?.body,
  });
}

describe('proxyToUpstreamIfConfigured', () => {
  it('returns null when no upstream is configured (local-persistent mode)', async () => {
    delete process.env.BACKEND_API_URL;
    const result = await proxyToUpstreamIfConfigured(
      req('http://localhost:3000/api/v1/categories'),
      '/api/v1/categories'
    );
    assert.equal(result, null);
    assert.equal(requests.length, 0, 'no upstream call attempted');
  });

  it('proxies GET with query params and passes status, body and content-type through', async () => {
    process.env.BACKEND_API_URL = baseUrl;
    responder = () => ({ status: 201, body: '{"data":[1,2]}', contentType: 'application/json' });

    const result = await proxyToUpstreamIfConfigured(
      req('http://localhost:3000/api/v1/categories?active=true'),
      '/api/v1/categories'
    );
    assert.ok(result);
    assert.equal(result.status, 201, 'upstream status passes through');
    assert.equal(await result.text(), '{"data":[1,2]}');
    assert.equal(result.headers.get('content-type'), 'application/json');

    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, 'GET');
    assert.ok(requests[0].url.startsWith('/api/v1/categories'));
    assert.ok(requests[0].url.includes('active=true'), 'query params forwarded');
    assert.equal(requests[0].body, '', 'GET carries no body');
  });

  it('forwards auth and idempotency headers, bridges the session cookie, and sends the shared secret', async () => {
    process.env.BACKEND_API_URL = baseUrl;
    process.env.BACKEND_INTERNAL_SECRET = 's3cr3t';

    // Explicit Authorization header wins.
    await proxyToUpstreamIfConfigured(
      req('http://localhost:3000/api/v1/orders', {
        headers: { authorization: 'Bearer explicit', 'idempotency-key': 'key-1' },
      }),
      '/api/v1/orders'
    );
    assert.equal(requests[0].headers['authorization'], 'Bearer explicit');
    assert.equal(requests[0].headers['idempotency-key'], 'key-1');
    assert.equal(requests[0].headers['x-backend-internal-secret'], 's3cr3t');

    // Cookie session bridges to Bearer when no Authorization header is present.
    await proxyToUpstreamIfConfigured(
      req('http://localhost:3000/api/v1/orders', {
        headers: { cookie: 'candy_admin_token=cookie-jwt' },
      }),
      '/api/v1/orders'
    );
    assert.equal(requests[1].headers['authorization'], 'Bearer cookie-jwt', 'cookie bridged to Bearer');
  });

  it('forwards POST bodies verbatim and honors overrideBody', async () => {
    process.env.BACKEND_API_URL = baseUrl;

    await proxyToUpstreamIfConfigured(
      req('http://localhost:3000/api/v1/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{"a":1}',
      }),
      '/api/v1/orders'
    );
    assert.equal(requests[0].method, 'POST');
    assert.equal(requests[0].body, '{"a":1}');
    assert.equal(requests[0].headers['content-type'], 'application/json');

    await proxyToUpstreamIfConfigured(
      req('http://localhost:3000/api/v1/admin/auth/logout', { method: 'POST', body: '' }),
      '/api/v1/admin/auth/logout',
      { overrideBody: '{"refresh":"tok"}' }
    );
    assert.equal(requests[1].body, '{"refresh":"tok"}', 'overrideBody replaces the payload');
  });

  it('passes upstream error statuses through without masking them', async () => {
    process.env.BACKEND_API_URL = baseUrl;
    responder = () => ({ status: 403, body: '{"detail":"forbidden upstream"}' });
    const result = await proxyToUpstreamIfConfigured(
      req('http://localhost:3000/api/v1/admin/users'),
      '/api/v1/admin/users'
    );
    assert.ok(result);
    assert.equal(result.status, 403, 'upstream 403 reaches the client');
    assert.equal(await result.text(), '{"detail":"forbidden upstream"}');
  });

  it('falls back to local when the upstream is down (non-strict), or 502s in strict mode', async () => {
    process.env.BACKEND_API_URL = 'http://127.0.0.1:1'; // nothing listens here
    delete process.env.BACKEND_STRICT_PROXY;

    const fallback = await proxyToUpstreamIfConfigured(
      req('http://localhost:3000/api/v1/categories'),
      '/api/v1/categories'
    );
    assert.equal(fallback, null, 'non-strict failure returns null so local handling continues');

    process.env.BACKEND_STRICT_PROXY = 'true';
    const strict = await proxyToUpstreamIfConfigured(
      req('http://localhost:3000/api/v1/categories'),
      '/api/v1/categories'
    );
    assert.ok(strict);
    assert.equal(strict.status, 502);
    assert.equal((await strict.json()).error.code, 'UPSTREAM_UNAVAILABLE');
  });

  it('route handlers honor proxy mode: public categories serves upstream data, not the local db', async () => {
    process.env.BACKEND_API_URL = baseUrl;
    responder = () => ({ status: 200, body: '{"data":[{"id":"upstream-cat"}]}' });

    const res = await listCategories(req('http://localhost:3000/api/v1/categories'));
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { data: [{ id: 'upstream-cat' }] });
    assert.equal(requests.length, 1, 'route delegated to the upstream');
  });
});

describe('pingUpstreamHealth', () => {
  it('reports unconfigured without BACKEND_API_URL and reachable with a live stub', async () => {
    delete process.env.BACKEND_API_URL;
    const off = await pingUpstreamHealth();
    assert.equal(off.configured, false);
    assert.equal(off.reachable, false);

    process.env.BACKEND_API_URL = baseUrl;
    responder = () => ({ status: 200, body: '{}' });
    const on = await pingUpstreamHealth();
    assert.equal(on.configured, true);
    assert.equal(on.reachable, true);
    assert.equal(on.statusCode, 200);
    assert.ok(requests.some((r) => r.url.startsWith('/api/v1/health')), 'health endpoint probed');
  });

  it('reports unreachable when the upstream is down', async () => {
    process.env.BACKEND_API_URL = 'http://127.0.0.1:1';
    const down = await pingUpstreamHealth();
    assert.equal(down.configured, true);
    assert.equal(down.reachable, false);
  });
});
