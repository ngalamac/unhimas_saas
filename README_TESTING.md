# Testing & Verification

This document explains how to run automated tests, smoke checks, and end‑to‑end verification for the Unhimas SaaS platform.

## 1. Prerequisites
- Node.js 18+
- MongoDB instance (local or Atlas) for running the real backend server
- PowerShell (Windows) or any POSIX shell (for scripts)

## 2. Backend Unit / Integration Tests
The backend now includes a lightweight Vitest + Supertest + mongodb-memory-server setup.

Install (root + backend):
```
npm install
cd backend
npm install
```

Run backend tests:
```
cd backend
npm test
```
This spins up an in‑memory MongoDB, mounts a minimal Express app (`createTestApp`) and runs tests for:
- Programs API (create + list)
- Departments API (create + list)
- Students API (auth boundary expectations)

Add more route tests by creating additional `*.test.ts` files under `backend/test` and using the existing pattern.

## 3. End-to-End (E2E) Smoke Script
From the project root:
```
npm run test:e2e
```
Requires the real backend server running (with seeded SuperAdmin). The script hits:
- /api/health
- /api/auth/login
- /api/programs, /api/departments
- (Attempts) /api/branches, /api/students, payment, export

## 4. Comprehensive Build & Static Checks
Manual sequence:
```
npm run build         # Frontend build
npm run lint          # ESLint
npx tsc --noEmit      # Type checking
```
Backend build:
```
cd backend
npm run build
```

## 5. Adding More Tests
1. For protected routes: mock or inject auth (extend `createTestApp` to accept a flag that bypasses auth or injects a test user).
2. For file uploads: use Supertest `.attach()` with an in-memory buffer.
3. For payments / accounting: seed prerequisite documents, then assert resulting student / accounting state.

## 6. Troubleshooting
- If tests hang: ensure no conflicting MongoDB connection strings override the in‑memory server (`MONGO_URI` env var). Avoid exporting `MONGO_URI` when running unit tests.
- Port conflicts are irrelevant to unit tests (Supertest uses the app instance directly).
- If `vitest` not found: verify backend `node_modules` installed.

## 7. Next Test Coverage Targets
Recommended additional suites:
- Users & Auth permissions matrix
- Branch creation and hierarchical access (mock manager)
- Tuition payments: verify installment status transitions
- Export endpoints: assert CSV / PDF fallback status codes
- Uploads: assert GridFS metadata persistence (needs direct bucket inspection)

## 8. CI Integration
Add a root-level workflow (GitHub Actions) roughly:
```
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with: { node-version: 18 }
- run: npm install
- run: cd backend && npm install && npm test
- run: npm run build
```

## 9. Exit Criteria for Client Delivery
- All backend unit tests green
- E2E smoke script success (non-zero exit indicates investigation)
- No TypeScript or ESLint errors (warnings acceptable if documented)
- Backend starts, health endpoint reports mongodb: connected

---
Extend this file as coverage expands.
