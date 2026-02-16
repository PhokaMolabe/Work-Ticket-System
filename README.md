# Cascade Work Order / Ticket Management System

Production-style Work Order / Ticket Management System built from scratch as a monorepo:

- `backend/`: Node.js + TypeScript + Express + PostgreSQL + TypeORM + JWT
- `frontend/`: React 18 + Vite + TypeScript + TailwindCSS + React Router + Axios
- Root: Docker + docker-compose

## 1. Features Implemented

- JWT auth with server-side RBAC (`ADMIN`, `AGENT`, `REQUESTER`)
- Strict server-side finite-state ticket lifecycle
- SLA due date calculation + runtime SLA risk (`SAFE`, `AT_RISK`, `BREACHED`)
- Queue endpoint with required sorting priority
- Audit logging for key actions with export endpoint
- Comments + evidence upload/download with participant-based access control
- Pagination, filtering, sorting, search
- Consistent API error shape
- Backend tests (8 meaningful tests)

## 2. Auth Storage Choice

This implementation stores JWT in **`localStorage`** on the frontend.

Why:
- The stack runs frontend and backend on different ports in local Docker; bearer tokens with Axios are straightforward and explicit.
- It keeps backend stateless and avoids cookie CSRF/same-site complexity for local development.

Implementation details:
- Token key: `workorder_token`
- Axios request interceptor attaches `Authorization: Bearer <token>`
- Axios response interceptor emits unauthorized event on `401`; app logs out and redirects to `/login`

## 3. Project Structure

```text
/backend
  /src
    /config
    /constants
    /entities
    /errors
    /middleware
    /migrations
    /routes
    /seed
    /services
    /tests
    /types
    /utils
/frontend
  /src
    /api
    /app
    /components
    /context
    /lib
    /pages
    /types
/docker-compose.yml
```

## 4. Environment Variables

### Root `.env.example`

```env
POSTGRES_USER=workorder
POSTGRES_PASSWORD=workorder
POSTGRES_DB=workorder_db
POSTGRES_PORT=5432
JWT_SECRET=change-me-in-real-deployments
```

### Backend `.env.example`

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=workorder
DB_PASSWORD=workorder
DB_NAME=workorder_db
JWT_SECRET=change-this-secret
JWT_EXPIRES_IN=1d
UPLOAD_DIR=uploads
CORS_ORIGIN=http://localhost:5173
```

### Frontend `.env.example`

```env
VITE_API_BASE_URL=http://localhost:3000
```

## 5. Run with Docker

1. Copy env files:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

PowerShell alternative:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

2. Start full system:

```bash
docker compose up --build
```

Services:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- Postgres: `localhost:5432`

## 6. Required One-Liner Commands

From project root:

- Start:
```bash
docker compose up --build
```

- Migrate:
```bash
docker compose exec backend npm run migration:run
```

- Seed:
```bash
docker compose exec backend npm run seed
```

- Test:
```bash
docker compose exec backend npm test
```

## 7. Seeded Credentials

After `npm run seed` (or compose startup):

- ADMIN: `admin@workorder.local` / `Admin#12345`
- AGENT (lead): `lead.agent@workorder.local` / `Agent#12345`
- AGENT: `agent@workorder.local` / `Agent#12345`
- REQUESTER: `requester@workorder.local` / `Requester#12345`

## 8. SLA Rules

Computed at ticket creation:
- `LOW`: +5 days
- `MEDIUM`: +3 days
- `HIGH`: +24 hours
- `URGENT`: +4 hours

Returned fields:
- `slaRemainingMinutes`
- `slaRisk`:
  - `BREACHED` when `dueAt < now`
  - `AT_RISK` when remaining ratio `< 20%`
  - `SAFE` otherwise

## 9. Ticket Transition FSM

Server-side finite-state map:

- `OPEN -> IN_PROGRESS | WAITING_ON_CUSTOMER | RESOLVED`
- `IN_PROGRESS -> WAITING_ON_CUSTOMER | RESOLVED`
- `WAITING_ON_CUSTOMER -> IN_PROGRESS | RESOLVED`
- `RESOLVED -> IN_PROGRESS | CLOSED`
- `CLOSED -> (none)`

Role constraints:
- REQUESTER: only `WAITING_ON_CUSTOMER -> IN_PROGRESS` on own tickets
- AGENT: may change status on assigned tickets except `CLOSED`
- ADMIN: full status authority

## 10. RBAC Rules

- `ADMIN`
  - full access
- `AGENT`
  - sees own assigned + unassigned queue
  - non-lead can self-assign only when unassigned
  - lead can assign like queue lead
  - cannot close tickets
- `REQUESTER`
  - create tickets
  - view own tickets only
  - comment/upload evidence on own tickets

## 11. API Error Contract

All API errors use:

```json
{
  "errorCode": "STRING_CODE",
  "message": "Human readable message",
  "details": {}
}
```

## 12. API Documentation

Base URL: `http://localhost:3000`

### Auth

- `POST /auth/login` (public)
- `POST /auth/register` (ADMIN)
- `GET /auth/me` (auth)

### Tickets

- `POST /tickets` (REQUESTER, ADMIN)
- `GET /tickets` (all; scope by role)
- `GET /tickets/queue` (AGENT, ADMIN)
- `GET /tickets/:id` (scoped)
- `PATCH /tickets/:id` (strict role rules)
- `PATCH /tickets/:id/assign` (ADMIN + AGENT rules)
- `PATCH /tickets/:id/status` (FSM + role checks)

### Comments + Evidence

- `POST /tickets/:id/comments`
- `GET /tickets/:id/comments`
- `POST /tickets/:id/evidence` (multipart/form-data, field `file`)
- `GET /tickets/:id/evidence`
- `GET /evidence/:id/download`

### Admin Audit

- `GET /admin/audit-logs` (filters + pagination)
- `GET /admin/audit-logs/export?format=csv|json`

## 13. Curl Examples

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@workorder.local","password":"Admin#12345"}'
```

### Create Ticket (Requester)

```bash
curl -X POST http://localhost:3000/tickets \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"VPN Down","description":"Cannot connect to VPN","priority":"HIGH"}'
```

### Queue

```bash
curl "http://localhost:3000/tickets/queue?assigned=unassigned&page=1&pageSize=20" \
  -H "Authorization: Bearer <TOKEN>"
```

### Status Change

```bash
curl -X PATCH http://localhost:3000/tickets/<TICKET_ID>/status \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS"}'
```

### Upload Evidence

```bash
curl -X POST http://localhost:3000/tickets/<TICKET_ID>/evidence \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@./sample.txt"
```

## 14. Testing

Backend tests are under `backend/src/tests` and include:

- requester blocked from admin endpoint
- requester blocked from other requester ticket
- invalid transition rejected
- SLA due/risk logic
- queue default sorting order
- audit log creation checks
- evidence access control
- agent close restriction

Run:

```bash
docker compose exec backend npm test
```

## 15. Postman

Collection file:

- `postman/WorkOrderSystem.postman_collection.json`

Import into Postman and set `baseUrl` variable to `http://localhost:3000`.
