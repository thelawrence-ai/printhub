import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
const dataDir = join(root, 'data');
const filesDir = join(dataDir, 'files');
const ordersFile = join(dataDir, 'orders.json');
const sessionSecret = process.env.SESSION_SECRET || 'replace-this-session-secret';
const ownerUsername = process.env.OWNER_USERNAME || 'admin';
const ownerPassword = process.env.OWNER_PASSWORD || 'admin';
const maxBodySize = 15 * 1024 * 1024;

await mkdir(filesDir, { recursive: true });
try {
  await readFile(ordersFile, 'utf8');
} catch {
  await writeFile(ordersFile, '[]');
}

const json = (response, status, payload, headers = {}) => {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  response.end(JSON.stringify(payload));
};

const readOrders = async () => JSON.parse(await readFile(ordersFile, 'utf8'));
const writeOrders = async (orders) => writeFile(ordersFile, JSON.stringify(orders, null, 2));

const sign = (value) => createHmac('sha256', sessionSecret).update(value).digest('hex');
const makeSession = () => {
  const value = randomBytes(24).toString('hex');
  return `${value}.${sign(value)}`;
};
const validSession = (request) => {
  const cookie = request.headers.cookie || '';
  const match = cookie.match(/(?:^|;\s*)printhub_session=([^;]+)/);
  if (!match) return false;
  const [value, signature] = decodeURIComponent(match[1]).split('.');
  if (!value || !signature) return false;
  const expected = sign(value);
  return signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
};
const sessionCookie = (value, maxAge = 60 * 60 * 12) => `printhub_session=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`;

const body = async (request) => {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodySize) throw new Error('Request body is too large.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
};

const sendFile = async (response, filePath, contentType) => {
  response.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
  createReadStream(filePath).pipe(response);
};

const publicFile = (pathname) => {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const candidate = resolve(root, `.${requested}`);
  if (!candidate.startsWith(resolve(root)) || candidate.includes(`${join(root, 'data')}`)) return null;
  return candidate;
};

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname === '/api/health' && request.method === 'GET') {
      return json(response, 200, { ok: true, service: 'printhub-portal' });
    }

    if (pathname === '/api/session' && request.method === 'GET') {
      return json(response, 200, { authenticated: validSession(request) });
    }

    if (pathname === '/api/login' && request.method === 'POST') {
      const input = await body(request);
      if (input.username !== ownerUsername || input.password !== ownerPassword) {
        return json(response, 401, { error: 'Incorrect username or password.' });
      }
      return json(response, 200, { authenticated: true }, { 'Set-Cookie': sessionCookie(makeSession()) });
    }

    if (pathname === '/api/logout' && request.method === 'POST') {
      return json(response, 200, { authenticated: false }, { 'Set-Cookie': sessionCookie('', 0) });
    }

    if (pathname === '/api/orders' && request.method === 'POST') {
      const input = await body(request);
      const fileData = String(input.fileData || '');
      if (!input.whatsapp || !input.message || !fileData.startsWith('data:application/pdf;base64,')) {
        return json(response, 400, { error: 'WhatsApp number, message, and a PDF are required.' });
      }
      const base64 = fileData.split(',')[1];
      const fileBuffer = Buffer.from(base64, 'base64');
      if (!fileBuffer.length || fileBuffer.length > 10 * 1024 * 1024) {
        return json(response, 400, { error: 'PDF must be smaller than 10 MB.' });
      }
      const id = `PH-${Date.now().toString(36).toUpperCase().slice(-8)}`;
      const fileName = String(input.fileName || `${id}.pdf`).replace(/[^a-zA-Z0-9._-]/g, '_');
      await writeFile(join(filesDir, `${id}.pdf`), fileBuffer);
      const order = {
        id,
        createdAt: new Date().toISOString(),
        whatsapp: String(input.whatsapp),
        token: String(input.token || ''),
        fileName,
        printType: String(input.printType || 'Black & white — ₹1 / side'),
        delivery: String(input.delivery || 'Counter pickup — free'),
        message: String(input.message),
        status: 'New'
      };
      const orders = await readOrders();
      await writeOrders([order, ...orders]);
      return json(response, 201, { order });
    }

    if (pathname === '/api/orders' && request.method === 'GET') {
      if (!validSession(request)) return json(response, 401, { error: 'Owner authentication required.' });
      return json(response, 200, { orders: await readOrders() });
    }

    if (pathname === '/api/orders' && request.method === 'DELETE') {
      if (!validSession(request)) return json(response, 401, { error: 'Owner authentication required.' });
      for (const order of await readOrders()) await unlink(join(filesDir, `${order.id}.pdf`)).catch(() => {});
      await writeOrders([]);
      return json(response, 200, { orders: [] });
    }

    const fileMatch = pathname.match(/^\/api\/orders\/([^/]+)\/file$/);
    if (fileMatch && request.method === 'GET') {
      if (!validSession(request)) return json(response, 401, { error: 'Owner authentication required.' });
      const orderId = fileMatch[1];
      const orders = await readOrders();
      if (!orders.some((order) => order.id === orderId)) return json(response, 404, { error: 'Order not found.' });
      return sendFile(response, join(filesDir, `${orderId}.pdf`), 'application/pdf');
    }

    const orderMatch = pathname.match(/^\/api\/orders\/([^/]+)$/);
    if (orderMatch && request.method === 'PATCH') {
      if (!validSession(request)) return json(response, 401, { error: 'Owner authentication required.' });
      const input = await body(request);
      const allowedStatuses = ['New', 'Printing', 'Ready', 'Delivered'];
      if (!allowedStatuses.includes(input.status)) return json(response, 400, { error: 'Invalid order status.' });
      const orders = await readOrders();
      const index = orders.findIndex((order) => order.id === orderMatch[1]);
      if (index < 0) return json(response, 404, { error: 'Order not found.' });
      orders[index].status = input.status;
      await writeOrders(orders);
      return json(response, 200, { order: orders[index] });
    }

    if (orderMatch && request.method === 'DELETE') {
      if (!validSession(request)) return json(response, 401, { error: 'Owner authentication required.' });
      const orders = await readOrders();
      const order = orders.find((item) => item.id === orderMatch[1]);
      if (!order) return json(response, 404, { error: 'Order not found.' });
      await unlink(join(filesDir, `${order.id}.pdf`)).catch(() => {});
      await writeOrders(orders.filter((item) => item.id !== order.id));
      return json(response, 200, { ok: true });
    }

    if (request.method === 'GET') {
      const filePath = publicFile(pathname);
      if (filePath) {
        const extension = extname(filePath).toLowerCase();
        const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png' };
        try {
          return await sendFile(response, filePath, types[extension] || 'application/octet-stream');
        } catch {
          return json(response, 404, { error: 'Not found.' });
        }
      }
    }

    return json(response, 404, { error: 'Not found.' });
  } catch (error) {
    console.error(error);
    return json(response, error.message.includes('too large') ? 413 : 500, { error: 'The portal could not complete that request.' });
  }
});

server.listen(port, host, () => console.log(`PrintHub portal listening on http://${host}:${port}`));
