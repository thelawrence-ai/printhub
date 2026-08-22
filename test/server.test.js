import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { scryptSync } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const port = 3137;
let dataDir;
let child;
const passwordHash = `scrypt$16384$8$1$test-salt$${scryptSync('strong-test-password', 'test-salt', 64, { N: 16384, r: 8, p: 1 }).toString('hex')}`;
const base = `http://127.0.0.1:${port}`;

before(async () => {
  dataDir = await mkdtemp(join(tmpdir(), 'printhub-test-'));
  child = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', DATA_DIR: dataDir, OWNER_USERNAME: 'tester', OWNER_PASSWORD_HASH: passwordHash, SESSION_SECRET: 'a-test-secret-that-is-longer-than-32-chars' }, stdio: 'ignore' });
  for (let i = 0; i < 30; i += 1) { try { if ((await fetch(`${base}/api/health`)).ok) return; } catch {} await new Promise((resolve) => setTimeout(resolve, 100)); }
  throw new Error('Test server did not start.');
});
after(async () => { child?.kill('SIGTERM'); await rm(dataDir, { recursive: true, force: true }); });

const jsonRequest = (path, options = {}) => fetch(`${base}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });

test('rejects invalid PDFs and protects owner data', async () => {
  const bad = await jsonRequest('/api/orders', { method: 'POST', body: JSON.stringify({ whatsapp: '9812345678', message: 'x', fileData: 'data:application/pdf;base64,SGVsbG8=' }) });
  assert.equal(bad.status, 400);
  const unauthorized = await jsonRequest('/api/orders');
  assert.equal(unauthorized.status, 401);
});

test('authenticates and manages a valid order', async () => {
  const login = await jsonRequest('/api/login', { method: 'POST', body: JSON.stringify({ username: 'tester', password: 'strong-test-password' }) });
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const order = await jsonRequest('/api/orders', { method: 'POST', headers: { Cookie: cookie }, body: JSON.stringify({ whatsapp: '9812345678', message: 'Print pages 1-2', fileName: 'notes.pdf', fileData: 'data:application/pdf;base64,JVBERi0xLjQK', printType: 'Black & white — ₹1 / side', delivery: 'Counter pickup — free' }) });
  assert.equal(order.status, 201);
  const payload = await order.json();
  const update = await jsonRequest(`/api/orders/${payload.order.id}`, { method: 'PATCH', headers: { Cookie: cookie }, body: JSON.stringify({ status: 'Printing' }) });
  assert.equal(update.status, 200);
  assert.equal((await update.json()).order.status, 'Printing');
});
