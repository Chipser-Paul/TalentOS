# TalentOS

TalentOS is an AI-powered recruitment and developer evaluation platform for high-signal hiring decisions.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/talentos` — recruiter web workspace
- `artifacts/api-server` — shared Express API gateway
- `lib/api-spec/openapi.yaml` — API source of truth
- `lib/api-client-react` — generated React Query hooks
- `lib/api-zod` — generated server validation schemas
- `lib/db` — Drizzle database package
- `ARCHITECTURE.md` — system boundaries and runtime design
- `docs/API.md` — Phase 1 endpoint inventory

## Architecture decisions

- Use the workspace's React + Vite and Express services so the first vertical slice runs inside the existing managed routing.
- Keep HTTP contracts in OpenAPI and regenerate both client hooks and server schemas from one source.
- Serve Phase 1 fixtures from the API, not the frontend, so UI integration exercises the production boundary.
- Clerk owns browser authentication; the Express API requires a Clerk session for workspace data and scopes seeded records to the current user.
- TalentOS workspace tables live in PostgreSQL through Drizzle; first access seeds a usable starter workspace while recruiter CRUD is built next.

## Product

TalentOS helps hiring teams create roles, screen candidates, run technical assessments, consult recruitment knowledge, automate handoffs, and understand funnel performance.

## User preferences

- Build in deliberate stages and teach the architecture as each production capability is introduced.

## Gotchas

- Run API codegen after editing `lib/api-spec/openapi.yaml`.
- Use generated React Query hooks from `@workspace/api-client-react` rather than hand-written client types.
- Keep the API base path at `/api`; the shared proxy handles service routing.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
