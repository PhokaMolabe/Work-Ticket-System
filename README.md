 Ticket Management System

Production-style Work Order / Ticket Management System:

- `backend/`: Node.js + TypeScript + Express + PostgreSQL + TypeORM + JWT
- `frontend/`: React 18 + Vite + TypeScript + TailwindCSS + React Router + Axios


## Features Implemented

- JWT auth with server-side RBAC (`ADMIN`, `AGENT`, `REQUESTER`)
- Strict server-side finite-state ticket lifecycle
- SLA due date calculation + runtime SLA risk (`SAFE`, `AT_RISK`, `BREACHED`)
- Queue endpoint with required sorting priority
- Audit logging for key actions with export endpoint
- Comments + evidence upload/download with participant-based access control
- Pagination, filtering, sorting, search
- Consistent API error shape




