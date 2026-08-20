# TalentOS

TalentOS is an AI-powered recruitment and developer evaluation platform for high-signal hiring decisions.

## Environment Setup

1. Copy `.env.example` to `.env`
2. Replace placeholders with your local values
3. Never commit `.env` to version control
4. Requires a PostgreSQL database
5. Requires a Clerk application with publishable and secret keys

### Local Development Ports

Each service uses its own port variable to avoid conflicts:

- Backend: `PORT=5000`
- TalentOS frontend: `VITE_PORT=5173`
- Mockup sandbox: `MOCKUP_PORT=5174`

### CORS Origins

`ALLOWED_ORIGINS` controls which browser origins can call the API.

- Format: comma-separated list, e.g. `http://localhost:5173,http://localhost:5174`
- In development, if unset, the API safely allows `http://localhost:5173` and `http://localhost:5174`
- In production, `ALLOWED_ORIGINS` must be explicitly set to the approved frontend origin(s)
- Requests without an `Origin` header (curl, server-to-server, health probes) are always allowed

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

## API surface

The API now supports full CRUD for Jobs, Candidates, Assessments, Knowledge Sources, and Automations. Each mutation is validated with Zod and scoped to the authenticated user's workspace. See `docs/API.md` for the current endpoint inventory.

## Roadmap note

Document embeddings/vector search and automation execution remain planned and are not yet implemented.

## AI evaluation

The API includes an optional candidate-to-job evaluation endpoint:

- `POST /candidates/{candidateId}/evaluate/{jobId}`
- Requires `OPENAI_API_KEY` and optionally `OPENAI_MODEL`
- Returns structured scoring and recommendation data
- This is decision support only; it does not make autonomous hiring decisions

## Knowledge RAG

The Knowledge page includes a grounded Q&A assistant:

- `POST /knowledge/query`
- Uses PostgreSQL full-text search to retrieve relevant knowledge sources scoped to the workspace
- Grounds the LLM answer only in retrieved sources
- Returns `answer` plus cited `sources`
- Requires `OPENAI_API_KEY`
- If no relevant knowledge is found, the response explicitly states that the available knowledge does not answer the question

## Tool layer and MCP

A minimal internal tool abstraction and MCP-style server are implemented for read-only workspace data access:

- Tools: `get_candidate`, `list_candidates`, `get_job`, `list_jobs`, `list_knowledge_sources`, `get_dashboard_metrics`
- All tools enforce workspace isolation
- No destructive or mutation operations are exposed through the tool layer

## Testing

- `pnpm --filter @workspace/api-server run test` — run API tests
- `pnpm --filter @workspace/api-server run test:watch` — watch mode

## User preferences

- Build in deliberate stages and teach the architecture as each production capability is introduced.

## Gotchas

- Run API codegen after editing `lib/api-spec/openapi.yaml`.
- Use generated React Query hooks from `@workspace/api-client-react` rather than hand-written client types.
- Keep the API base path at `/api`; the shared proxy handles service routing.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
