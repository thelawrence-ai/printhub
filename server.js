import { createReadStream } from 'node:fs';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import http from 'node:http';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
const dataDir = process.env.DATA_DIR ? resolve(process.env.DATA_DIR) : join(root, 'data');
const filesDir = join(dataDir, 'files');
const ordersFile = join(dataDir, 'orders.json');
const sessionSecret = process.env.SESSION_SECRET;
const ownerUsername = process.env.OWNER_USERNAME;
const ownerPasswordHash = process.env.OWNER_PASSWORD_HASH;
const maxBodySize = 15 * 1024 * 1024;
const maxFileSize = 10 * 1024 * 1024;
const sessionLifetime = 12 * 60 * 60;
const isProduction = process.env.NODE_ENV === 'production';
const secureCookie = isProduction || process.env.COOKIE_SECURE === 'true';

if (!sessionSecret || sessionSecret.length < 32) throw new Error('SESSION_SECRET must be set to at least 32 characters.');
if (!ownerUsername || !/^[\w.@-]{3,80}$/.test(ownerUsername)) throw new Error('OWNER_USERNAME must be set and contain 3–80 safe characters.');
if (!ownerPasswordHash || !/^scrypt\$\d+\$\d+\$\d+\$[^$]+\$[a-f0-9]+$/.test(ownerPasswordHash)) throw new Error('OWNER_PASSWORD_HASH must be set in scrypt$N$r$p$salt$hash format.');

await mkdir(filesDir, { recursive: true });
try { JSON.parse(await readFile(ordersFile, 'utf8')); } catch { await writeFile(ordersFile, '[]', { mode: 0o600 }); }

const json = (response, status, payload, headers = {}) => {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  response.end(JSON.stringify(payload));
};
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'; frame-ancestors 'none'"
};
const readOrders = async () => JSON.parse(await readFile(ordersFile, 'utf8'));
let writeQueue = Promise.resolve();
const writeOrders = (orders) => {
  writeQueue = writeQueue.then(async () => {
    const temporary = `${ordersFile}.${randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify(orders, null, 2), { mode: 0o600 });
    await rename(temporary, ordersFile);
  });
  return writeQueue;
};
const sign = (value) => createHmac('sha256', sessionSecret).update(value).digest('hex');
const makeSession = () => { const expires = Math.floor(Date.now() / 1000) + sessionLifetime; const value = `${randomBytes(24).toString('hex')}.${expires}`; return `${value}.${sign(value)}`; };
const validSession = (request) => {
  try {
    const cookie = request.headers.cookie || ''; const match = cookie.match(/(?:^|;\s*)printhub_session=([^;]+)/); if (!match) return false;
    const parts = decodeURIComponent(match[1]).split('.'); if (parts.length !== 3) return false;
    const [nonce, expiry, signature] = parts; const expected = sign(`${nonce}.${expiry}`);
    return Number(expiry) > Math.floor(Date.now() / 1000) && signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch { return false; }
};
const sessionCookie = (value, maxAge = sessionLifetime) => `printhub_session=${encodeURIComponent(value)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secureCookie ? '; Secure' : ''}`;
const parsePasswordHash = (value) => { const [, n, r, p, salt, hash] = value.split('$'); return { n: Number(n), r: Number(r), p: Number(p), salt, hash }; };
const verifyPassword = (password) => { const stored = parsePasswordHash(ownerPasswordHash); const derived = scryptSync(password, stored.salt, Buffer.from(stored.hash, 'hex').length, { N: stored.n, r: stored.r, p: stored.p }); return timingSafeEqual(derived, Buffer.from(stored.hash, 'hex')); };
const clientKey = (request) => request.headers['x-forwarded-for']?.split(',')[0]?.trim() || request.socket.remoteAddress || 'unknown';
const attempts = new Map();
const allowLogin = (request) => { const key = clientKey(request); const now = Date.now(); const recent = (attempts.get(key) || []).filter((time) => now - time < 15 * 60 * 1000); if (recent.length >= 10) return false; recent.push(now); attempts.set(key, recent); return true; };
const body = async (request) => {
  const length = Number(request.headers['content-length'] || 0); if (length > maxBodySize) throw Object.assign(new Error('Request body is too large.'), { status: 413 });
  let size = 0; const chunks = []; for await (const chunk of request) { size += chunk.length; if (size > maxBodySize) throw Object.assign(new Error('Request body is too large.'), { status: 413 }); chunks.push(chunk); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { throw Object.assign(new Error('Invalid JSON request.'), { status: 400 }); }
};
const stringField = (value, name, max, required = false) => { const text = String(value ?? '').trim(); if (required && !text) throw new Error(`${name} is required.`); if (text.length > max) throw new Error(`${name} is too long.`); return text; };
const sendFile = async (response, filePath) => { response.writeHead(200, { ...securityHeaders, 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment', 'Cache-Control': 'no-store' }); createReadStream(filePath).on('error', () => response.destroy()).pipe(response); };
const publicFile = (pathname) => { const requested = pathname === '/' ? '/index.html' : pathname; const candidate = resolve(root, `.${requested}`); const rootPath = resolve(root); return candidate === rootPath || candidate.startsWith(`${rootPath}/`) && !candidate.startsWith(`${resolve(dataDir)}/`) ? candidate : null; };
const allowedStatuses = new Set(['New', 'Printing', 'Ready', 'Delivered']);
const allowedPrintTypes = new Set(['Black & white — ₹1 / side', 'Colour — ₹5 / side', 'Spiral binding — from ₹30']);
const allowedDeliveries = new Set(['Counter pickup — free', 'Campus delivery — from ₹20']);

const server = http.createServer(async (request, response) => {
  Object.entries(securityHeaders).forEach(([key, value]) => response.setHeader(key, value));
  try {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); const pathname = decodeURIComponent(url.pathname);
    if (pathname === '/api/health' && request.method === 'GET') return json(response, 200, { ok: true, service: 'printhub-portal' });
    if (pathname === '/api/session' && request.method === 'GET') return json(response, 200, { authenticated: validSession(request) });
    if (pathname === '/api/login' && request.method === 'POST') {
      if (!allowLogin(request)) return json(response, 429, { error: 'Too many login attempts. Try again later.' }, { 'Retry-After': '900' });
      const input = await body(request); const username = stringField(input.username, 'Username', 80, true); const password = String(input.password || '');
      if (username !== ownerUsername || password.length > 200 || !verifyPassword(password)) return json(response, 401, { error: 'Incorrect username or password.' });
      return json(response, 200, { authenticated: true }, { 'Set-Cookie': sessionCookie(makeSession()) });
    }
    if (pathname === '/api/logout' && request.method === 'POST') return json(response, 200, { authenticated: false }, { 'Set-Cookie': sessionCookie('', 0) });
    if (pathname === '/api/orders' && request.method === 'POST') {
      const input = await body(request); const whatsapp = stringField(input.whatsapp, 'WhatsApp number', 40, true); const message = stringField(input.message, 'Message', 2000, true); const token = stringField(input.token, 'Token', 100); const fileName = stringField(input.fileName, 'File name', 160) || 'upload.pdf';
      const fileData = String(input.fileData || ''); const match = fileData.match(/^data:application\/pdf;base64,([A-Za-z0-9+/=]+)$/); if (!match) return json(response, 400, { error: 'A valid PDF is required.' });
      const fileBuffer = Buffer.from(match[1], 'base64'); if (fileBuffer.length < 5 || fileBuffer.length > maxFileSize || fileBuffer.subarray(0, 5).toString() !== '%PDF-') return json(response, 400, { error: 'PDF must be valid and smaller than 10 MB.' });
      const printType = stringField(input.printType, 'Print type', 100, true); const delivery = stringField(input.delivery, 'Delivery', 100, true); if (!allowedPrintTypes.has(printType) || !allowedDeliveries.has(delivery)) return json(response, 400, { error: 'Invalid print or delivery option.' });
      const id = `PH-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`; await writeFile(join(filesDir, `${id}.pdf`), fileBuffer, { mode: 0o600 });
      const order = { id, createdAt: new Date().toISOString(), whatsapp, token, fileName: fileName.replace(/[^a-zA-Z0-9._-]/g, '_'), printType, delivery, message, status: 'New' }; const orders = await readOrders(); await writeOrders([order, ...orders]); return json(response, 201, { order });
    }
    if (pathname === '/api/orders' && request.method === 'GET') { if (!validSession(request)) return json(response, 401, { error: 'Owner authentication required.' }); return json(response, 200, { orders: await readOrders() }); }
    if (pathname === '/api/orders' && request.method === 'DELETE') { if (!validSession(request)) return json(response, 401, { error: 'Owner authentication required.' }); const orders = await readOrders(); await Promise.all(orders.map((order) => unlink(join(filesDir, `${order.id}.pdf`)).catch(() => {}))); await writeOrders([]); return json(response, 200, { orders: [] }); }
    const fileMatch = pathname.match(/^\/api\/orders\/([^/]+)\/file$/);
    if (fileMatch && request.method === 'GET') { if (!validSession(request)) return json(response, 401, { error: 'Owner authentication required.' }); const orderId = fileMatch[1]; const orders = await readOrders(); if (!orders.some((order) => order.id === orderId)) return json(response, 404, { error: 'Order not found.' }); return sendFile(response, join(filesDir, `${orderId}.pdf`)); }
    const orderMatch = pathname.match(/^\/api\/orders\/([^/]+)$/);
    if (orderMatch && request.method === 'PATCH') { if (!validSession(request)) return json(response, 401, { error: 'Owner authentication required.' }); const input = await body(request); if (!allowedStatuses.has(input.status)) return json(response, 400, { error: 'Invalid order status.' }); const orders = await readOrders(); const index = orders.findIndex((order) => order.id === orderMatch[1]); if (index < 0) return json(response, 404, { error: 'Order not found.' }); orders[index].status = input.status; await writeOrders(orders); return json(response, 200, { order: orders[index] }); }
    if (orderMatch && request.method === 'DELETE') { if (!validSession(request)) return json(response, 401, { error: 'Owner authentication required.' }); const orders = await readOrders(); const order = orders.find((item) => item.id === orderMatch[1]); if (!order) return json(response, 404, { error: 'Order not found.' }); await unlink(join(filesDir, `${order.id}.pdf`)).catch(() => {}); await writeOrders(orders.filter((item) => item.id !== order.id)); return json(response, 200, { ok: true }); }
    if (request.method === 'GET') { const filePath = publicFile(pathname); if (filePath) { const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png' }; try { response.writeHead(200, { ...securityHeaders, 'Content-Type': types[extname(filePath).toLowerCase()] || 'application/octet-stream' }); return createReadStream(filePath).pipe(response); } catch {} } }
    return json(response, 404, { error: 'Not found.' });
  } catch (error) { console.error(JSON.stringify({ event: 'request_error', method: request.method, path: request.url, message: error.message })); return json(response, error.status || (error.message.includes('too large') ? 413 : 500), { error: error.status ? error.message : 'The portal could not complete that request.' }); }
});
server.listen(port, host, () => console.log(`PrintHub portal listening on http://${host}:${port}`));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
