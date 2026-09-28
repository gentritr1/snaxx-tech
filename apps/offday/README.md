# Offday

A Next.js PTO app for employees, HR, and managers. Includes a seeded demo and real, isolated company workspaces.

## Run locally

Use Node.js 20.19+ or a current LTS release.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The public homepage previews a sample workspace. Using a demo action creates a private demo session. To start an empty company workspace, choose **Sign in → Create a workspace**.

## Core workflow

1. Create a company workspace. Its creator is a manager.
2. In **Employees**, add a person using their assigned work email. Choose Employee or HR / Manager.
3. Copy the generated invitation link and share it with the employee. Links expire after seven days and work once. **Get invite link** replaces an unused invitation if needed.
4. Employees activate their accounts by setting a password, then sign in with their work email.
5. Employees request their own time off. Managers can submit on behalf of employees and approve or decline pending requests.
6. Approved and pending leave appears on the shared calendar. Employees can cancel their own pending requests.

Profiles, department filters, calendar navigation, request status filters, annual vacation balances, and workspace defaults are included. Changing the default allowance affects newly added employees only.

## Architecture and tradeoffs

- Next.js App Router, React, TypeScript, native CSS, self-hosted DM Sans, Phosphor icons.
- SQLite (`better-sqlite3`) provides persistent storage with transactions and foreign keys. Data lives in `data/offday.db` and is excluded from Git.
- Passwords use salted scrypt hashes. Sessions use hashed random tokens and HTTP-only, SameSite cookies, expire after seven days, and are revoked on logout.
- All mutations check organization membership and role on the server. Invitation tokens are hashed and single-use. Private request notes are only returned to the requester and managers.
- Vacation allowance reserves both pending and approved requests. Date overlap is rejected. Working days are Monday–Friday. Each request must stay within one calendar year. Sick and personal leave do not consume vacation allowance.
- An email belongs to one account in this initial version. Multi-company memberships are a future extension.
- Managers have workspace-wide approval rights, including their own requests; reporting-line approval rules are a future extension.
- Account activation links are generated but no email is sent. Share links through your existing communication channel.

## Deployment

```sh
npm run build
npm start
```

Deploy on a Node.js server/container with HTTPS and a persistent, writable disk. SQLite must not be placed on an ephemeral serverless filesystem. Use a managed SQL database before running multiple application instances. Set `DATABASE_PATH` to the persistent volume path and back it up securely.

Production cookies are Secure by default. `COOKIE_SECURE=false` is only for local HTTP production-build checks. Enable `TRUST_PROXY=true` only behind a trusted reverse proxy that overwrites `X-Forwarded-For`; otherwise authentication endpoints share a conservative rate limit. Configure your proxy to preserve the request Host header and cap request bodies. Do not expose a development server publicly.

## Checks

```sh
npm run typecheck
npm test
npm run build
```

Integration tests start an isolated server on port 3100 and a unique SQLite database in the OS temporary directory. They cover invitation activation, sign-in/out, role enforcement, tenant isolation, CSRF origin validation, overlaps, weekday calculations, balances, approvals, and demo isolation. Temporary test databases can be removed after testing.

## Before a paid launch

- Email delivery, verified ownership, password reset, and optional company SSO.
- Durable production database, backups, observability, and deployment configuration.
- PTO accrual, carryover, public holidays, part-days, and reporting-line approval policies.
- Audit history, employee offboarding, data export/deletion, and retention policies.
- Billing, subscription limits, and company onboarding.

These are explicit next iterations; this repository is a working MVP, not a complete commercial HR platform.
