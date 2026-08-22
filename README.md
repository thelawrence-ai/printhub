# PrintHub Portal

PrintHub is a student printing portal with public order submission and a protected shop-owner order desk. Orders and PDF files are stored on the server, while owner authentication uses an HTTP-only signed session cookie.

## Run locally

Use Node.js 18 or newer. Copy `.env.example` to `.env`, set a long random `SESSION_SECRET`, and choose the owner username and password. Then start the portal with `npm start` and open `http://localhost:3000`.

The server stores order metadata in `data/orders.json` and uploaded PDFs in `data/files/`. These paths must be on persistent storage in production and should be backed up according to the shop’s retention policy.

## Production deployment

The owner login requires the Node server and will not work when the files are opened with `file://` or hosted as a static GitHub Pages site. Deploy the repository as a Node web service. A `render.yaml` manifest is included for Render; set `OWNER_USERNAME` and `OWNER_PASSWORD` in the service environment, keep the generated `SESSION_SECRET`, and use the resulting service URL for both student orders and owner login.

Run the server behind HTTPS and a reverse proxy or managed Node hosting service. Set `OWNER_USERNAME`, `OWNER_PASSWORD`, `SESSION_SECRET`, `PORT`, and `HOST` through the hosting provider’s environment configuration. Do not commit `.env`, runtime order data, uploaded PDFs, or production credentials.

The current portal provides server-side authentication, persistent order creation, authenticated order listing, protected PDF links, order status updates, order deletion, and WhatsApp message links. Before handling sensitive student documents at scale, add a managed database, object storage, malware scanning, rate limiting, automated backups, password hashing or external identity management, and a documented document-retention policy.
