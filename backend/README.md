# Attendance Backend (scaffold)

Stack: Node + Express + TypeScript + Prisma + SQLite

Setup (first time):

1. Enter backend folder

```bash
cd backend
```

2. Install deps

```bash
npm install
```

3. Generate Prisma client and run migration (creates SQLite file `dev.db`)

```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Start dev server

```bash
npm run dev
```

API endpoints (initial):
- POST /api/auth/register { username, password, role, supervisorId? }
- POST /api/auth/login { username, password }
- GET /api/auth/profile (Authorization: Bearer <accessToken>)

Notes:
- By design this scaffold returns both access and refresh tokens in the login response for testing; in production set refresh in httpOnly cookie and secure flags.
- Change `JWT_SECRET` in `.env` before deploying.
