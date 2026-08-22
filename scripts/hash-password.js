import { randomBytes, scryptSync } from 'node:crypto';

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('Usage: npm run hash-password -- "a-password-at-least-12-characters"');
  process.exit(1);
}
const N = 16384;
const r = 8;
const p = 1;
const salt = randomBytes(16).toString('base64url');
const hash = scryptSync(password, salt, 64, { N, r, p }).toString('hex');
console.log(`scrypt$${N}$${r}$${p}$${salt}$${hash}`);

