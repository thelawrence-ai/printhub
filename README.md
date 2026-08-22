# PrintHub Portal

PrintHub is a student printing portal with public order submission and a protected shop-owner order desk. Orders and PDF files are stored on the server, while owner authentication uses an expiring HTTP-only signed session cookie and an scrypt password hash.

## Run locally

Use Node.js 18 or newer. Generate a password hash:

```bash
npm install
npm run hash-password -- "a-long-local-password"
```

Copy `.env.example` to `.env`, replace `OWNER_PASSWORD_HASH` with the generated value, set a random `SESSION_SECRET` of at least 32 characters, and export the variables before starting:

```bash
set -a; . ./.env; set +a
npm start
```

The server refuses to start if the username, password hash, or session secret is missing or unsafe. There are no default credentials. Open `http://localhost:3000` after startup.

The server stores order metadata in `DATA_DIR/orders.json` and uploaded PDFs in `DATA_DIR/files/`. The JSON writer serializes and atomically replaces updates, which is safer for a single process, but this remains a transitional storage layer rather than a substitute for a database.

## Production deployment

The owner login requires the Node server and will not work when the files are opened with `file://` or hosted as a static GitHub Pages site. Deploy the repository as a Node web service. A `render.yaml` manifest is included for Render; configure `OWNER_USERNAME`, `OWNER_PASSWORD_HASH`, and `SESSION_SECRET` as service secrets. Never configure or commit a plaintext owner password.

Run the server behind HTTPS. Production automatically adds the `Secure` cookie attribute; `COOKIE_SECURE=true` can be used when HTTPS is terminated outside the process. Set `DATA_DIR` to a persistent mount. A free or ephemeral web-service filesystem must not be treated as durable storage.

Before handling sensitive student documents at scale, migrate order metadata to a managed database and PDFs to private object storage. Add malware scanning and quarantine, automated encrypted backups with restore tests, a documented retention/deletion policy, and an external identity provider or managed session store. The application includes basic login throttling, strict field validation, PDF signature validation, security headers, atomic serialized JSON writes, protected file downloads, and structured error logging, but infrastructure-level controls are still required.

## Verification

Run the built-in test suite with:

```bash
npm test
```

Production CI should also run a lockfile-based dependency audit, secret scanning, and deployment smoke tests.

## Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| `OWNER_USERNAME` | Yes | Owner login name, 3–80 safe characters |
| `OWNER_PASSWORD_HASH` | Yes | `scrypt$N$r$p$salt$hash` output from the hash utility |
| `SESSION_SECRET` | Yes | At least 32 random characters for cookie signing |
| `DATA_DIR` | No | Persistent data directory; defaults to `./data` |
| `COOKIE_SECURE` | No | Set `true` for HTTPS outside production mode |
| `PORT` | No | HTTP port; defaults to `3000` |
| `HOST` | No | Bind host; defaults to `0.0.0.0` |


## Demo access

This repository is configured for a demo workflow. Students can submit print requests from the public form without an account or owner login. The demo owner desk uses:

```text
Username: Admin
Password: Admin
```

The demo password is still stored by the server as an scrypt hash. Do not reuse these credentials or expose the demo deployment to real student documents. For any non-demo deployment, replace the credentials immediately. The public UI intentionally exposes only the request portal; authorized owners can open the owner desk directly at `/?owner=1`.

