# StockTrack

StockTrack is a full-stack inventory management system built with a modern React + Express stack. It’s designed for small and growing operations that need to keep products, stock levels, images, and audit logs perfectly in sync — while giving developers a streamlined, batteries-included workflow (Dockerized Postgres + MinIO, Prisma, TypeScript everywhere).

## Highlights

- **Inventory hub:** Full CRUD for products with SKU search, modal-based forms, robust field validation (Zod + React Hook Form), and toast feedback for all key actions.
- **Media storage:** Product photos are uploaded via Multer (5 MB cap) directly into an S3-compatible bucket (MinIO by default), and the resulting URL is persisted on each product.
- **Secure access:** Users can register, log in, and reset passwords through JWT-protected routes (bcrypt hashing, 7-day tokens). The React client auto-attaches and clears tokens via Axios interceptors.
- **Audit-ready logs:** Every create/update/delete/upload action is stored in the `Log` table and exposed in a dedicated UI with filters by action type, user, and day for quick forensics.
- **Developer ergonomics:** A single `npm run dev` command spins up Docker services, the Express API, the Vite client, Prisma Studio, and even opens the relevant dashboards in your browser.

## Tech Stack

| Layer      | What’s used                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------- |
| Frontend   | React 18, Vite, TypeScript, React Hook Form, Zod, Axios, react-hot-toast                    |
| Backend    | Express 5 + TypeScript, Prisma ORM, PostgreSQL, JWT, bcryptjs, AWS SDK (S3), Multer, Zod    |
| Infra/Dev  | Docker Compose (Postgres 16 + MinIO), Prisma migrations, npm-run-all for concurrent scripts |

## API Overview

- `POST /api/auth/register` – Create an account.
- `POST /api/auth/login` – Issue a JWT (7 days) after validating credentials.
- `POST /api/auth/reset-password` – Admin-less password reset by email.
- `GET /api/health` – Database connectivity probe.
- `GET /api/products` – List products (public).
- `POST /api/products` – Create a product (auth required).
- `PUT /api/products/:id` – Update name/SKU/price/stock (auth).
- `DELETE /api/products/:id` – Delete a product (auth).
- `POST /api/products/:id/image` – Upload/replace product image and stream the file to MinIO/S3 (auth).
- `GET /api/logs` – Paginated audit log feed with related user info (auth).

## Getting Started

1. **Clone & install**

   ```bash
   git clone <your-repo-url>
   cd stocktrack
   npm install
   ```

2. **Provision services**

   ```bash
   docker compose up -d
   # Starts Postgres on 5432 and MinIO on 9000/9001
   ```

3. **Configure environment**

   Update `server/.env` with:

   - `DATABASE_URL`
   - `JWT_SECRET`
   - S3/MinIO credentials

   Defaults are provided for local use, but you can override them as needed.

4. **Run migrations**

   ```bash
   cd server
   npx prisma migrate dev
   ```

5. **Launch the stack**

   ```bash
   cd ..
   npm run dev
   ```

   This command:

   - Boots Docker (if not already running),
   - Starts the Express API at `http://localhost:3001`,
   - Starts the Vite client at `http://localhost:5173`,
   - Opens Prisma Studio at `http://localhost:5555`,
   - Opens the MinIO console at `http://localhost:9001`.

6. **Seed the app**

   - Register a user via the Auth screen.
   - Start creating products and uploading images to see inventory updates and logs in action.

## Useful Scripts

| Command                                       | Description                                                                                   |
| -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `npm run dev`                                | Concurrent dev runner (Docker, API, client, Prisma Studio, helper browser tabs).             |
| `npm run dev --prefix server`                | API-only development server with `ts-node-dev`.                                              |
| `npm run dev --prefix client/stocktrack-web` | Vite dev server for the React app.                                                           |
| `npm run prisma:studio --prefix server`      | Opens Prisma Studio without using the main dev runner.                                       |
| `docker compose up -d`                       | Manual start for Postgres + MinIO if needed outside the main script.                         |

## Project Structure

```text
.
├── docker-compose.yml          # Postgres + MinIO setup for local development
├── server/                     # Express API + Prisma schema/migrations
│   ├── src/index.ts            # API entrypoint: product CRUD, auth routes, logs, healthcheck
│   ├── src/routes/             # Auth, auth guard, file upload endpoints
│   ├── src/utils/logger.ts     # Centralized audit logging helper
│   ├── src/s3.ts               # S3/MinIO client configuration
│   └── prisma/schema.prisma    # User/Product/Sale/Log models
└── client/stocktrack-web/      # Vite + React application
    ├── src/pages/Products.tsx  # Catalog UI with filtering, modals, uploads
    ├── src/pages/Logs.tsx      # Audit log viewer with filters
    ├── src/pages/auth.tsx      # Login/Register/Reset flow
    ├── src/components/         # Modal, ProductForm, ProductItem, layout
    └── src/lib/api.ts          # Axios instance with token interceptors
```

## Roadmap Ideas

- Leverage the existing `Sale` model for revenue tracking and dashboards.
- Add role-based permissions (e.g., read-only operators vs. admins).
- Support bulk CSV import/export for products and stock adjustments.
- Introduce automated tests (unit + e2e) for critical API flows.
- Provide deploy-ready Terraform or Docker stacks for staging/production environments.

With StockTrack you get a batteries-included inventory dashboard, an auditable API, and a frontend that’s ready to customize or white-label for different businesses. Contributions, bug reports, and feature requests are very welcome!
