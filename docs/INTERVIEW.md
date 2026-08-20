# Interview Prep — TalentOS

## 1. Explain TalentOS in 30 seconds

TalentOS is a recruitment platform I built with React, Express, PostgreSQL, and Clerk. It lets authenticated users manage jobs, candidates, assessments, and knowledge bases in isolated workspaces. I also added AI features: structured candidate evaluation and a RAG knowledge assistant, plus production hardening like rate limiting, security headers, and CI/CD.

## 2. Explain it in 2 minutes

TalentOS is a full-stack TypeScript project using pnpm workspaces. The frontend is React 19 with Vite and TanStack Query; the backend is Express 5 with Pino logging. Data lives in PostgreSQL through Drizzle ORM. Clerk manages authentication, and every data query is scoped to the current user's workspace so tenants are isolated.

The API contract is defined in OpenAPI 3.1. From that single file I generate the React Query client and Zod validation schemas, so the frontend, backend, and documentation stay aligned.

For AI, I isolated OpenAI behind a service layer. The evaluation endpoint returns structured scores, strengths, gaps, and a recommendation. The RAG endpoint retrieves knowledge sources using PostgreSQL full-text search, then asks the model to answer only from those sources. If nothing relevant is found, it returns an explicit fallback instead of guessing.

I also added production basics: environment validation, CORS allowlisting, rate limiting on AI routes, security headers, 1MB body limits, health/readiness endpoints, GitHub Actions CI, and multi-stage Docker builds.

## 3. Architecture walkthrough

- `artifacts/talentos` — React frontend
- `artifacts/api-server` — Express API
- `lib/api-spec` — OpenAPI 3.1 spec
- `lib/api-client-react` — generated React Query client
- `lib/api-zod` — generated Zod schemas
- `lib/db` — Drizzle schema, connection, and queries

Request flow: frontend → `/api` → Clerk middleware → route handler → Zod validation → Drizzle query → sanitized JSON response. AI routes call the OpenAI service; RAG routes call the retrieval service then the OpenAI service.

## 4. Why React + Express + PostgreSQL

React gives a component model and ecosystem I can move fast in. Express is minimal and widely understood, which keeps the API layer transparent. PostgreSQL is reliable, has great JSON and full-text search support, and pairs naturally with Drizzle for type-safe queries. Together they cover the stack without unnecessary abstraction.

## 5. Why OpenAPI

OpenAPI forces me to think about requests and responses before writing route handlers. It becomes the contract that frontend, backend, tests, and docs all share. Generating the client and schemas removes a class of manual sync bugs.

## 6. Why PostgreSQL FTS instead of pgvector

At this stage the knowledge base is small, the deployment target is simple, and pgvector would require the `vector` extension plus embedding generation or an external model. PostgreSQL full-text search is already available, works well for keyword and phrase retrieval, and keeps the infrastructure minimal. If the corpus grows or semantic search becomes necessary, I would add pgvector later.

## 7. How RAG works

1. Client sends a query to `POST /knowledge/query`.
2. The API sanitizes the query and runs a full-text search against `talentos_knowledge_sources` scoped to the user's workspace.
3. Up to 5 ranked sources are returned.
4. The API sends the sources plus the question to OpenAI with instructions to answer only from retrieved content.
5. The response includes the answer and cited sources.
6. If no sources match, the API returns an explicit message stating that available knowledge does not answer the question.

## 8. How hallucinations are reduced

- Retrieval is bounded to actual database rows; the model never sees the full corpus blindly.
- The prompt explicitly restricts the model to retrieved sources.
- The API returns an explicit insufficient-context message when no sources match.
- Outputs are parsed into a structured shape with sources, making it easier to detect or surface low-confidence answers.

## 9. How candidate evaluation works

`POST /candidates/{candidateId}/evaluate/{jobId}` loads the candidate and job, builds an OpenAI prompt with structured output instructions, and returns a validated object containing overall fit score, recommendation, strengths, gaps, and summary. The endpoint is rate-limited and requires `OPENAI_API_KEY`. It is decision support only.

## 10. How workspace isolation works

Every protected route resolves the current workspace from the Clerk session. All SELECT, UPDATE, and DELETE queries include `workspace_id = ?`. The test suite includes explicit workspace isolation checks. There is no cross-tenant joins or global admin queries in the current surface.

## 11. How Clerk authentication works

Clerk handles sign-up, sign-in, and session management. The Express API uses `@clerk/express` middleware to authenticate each request. The frontend uses `@clerk/react` for routing and session state. Protected API routes reject unauthenticated requests with 401. Health endpoints are intentionally left unauthenticated for orchestration tools.

## 12. How rate limiting works

`express-rate-limit` stores request counts in memory. The `/api/candidates` tree is limited to 10 requests per minute, and `/api/knowledge/query` is limited to 20 requests per minute. This protects AI endpoints from abuse without requiring Redis. I document that in-memory limiting is single-instance and should be replaced with a shared store for horizontal scaling.

## 13. How CI works

GitHub Actions runs on push and pull_request to `main`. It checks out code, sets up Node 24 with Corepack-enabled pnpm 9.15.9, installs dependencies, runs `pnpm run typecheck`, `pnpm test`, and `pnpm run build`. No production secrets are required.

## 14. How Docker is used

Two multi-stage Dockerfiles:
- `artifacts/api-server/Dockerfile` builds the API with pinned pnpm, installs production deps only in the runtime image, and runs as a non-root user.
- `artifacts/talentos/Dockerfile` builds the frontend static assets and serves them with Vite preview.

`docker-compose.yml` orchestrates both services with health checks and environment variables.

## 15. What MCP means in this project

MCP here is a minimal internal JSON-RPC interface exposing read-only tools for workspace data. Tools include `get_candidate`, `list_candidates`, `get_job`, `list_jobs`, `list_knowledge_sources`, and `get_dashboard_metrics`. There is no autonomous agent execution. The layer exists to show how structured tool access can be wrapped around existing APIs without exposing mutations.

## 16. Current limitations

- MCP is read-only and minimal
- No autonomous agent execution
- In-memory rate limiting is single-instance
- AI smoke testing depends on a configured OpenAI key
- No pgvector or document ingestion pipeline yet
- No end-to-end test suite yet

## 17. What would be added at larger scale

- pgvector embeddings and semantic retrieval
- Shared rate-limit store like Redis
- Automation execution engine with audit logging
- Document upload, parsing, and chunking for knowledge sources
- End-to-end tests with Playwright or similar
- Feature flags, staged rollouts, and observability
- Migration-based schema management instead of push-based schema changes

## 18. Likely Interview Questions

### Q1: Why pnpm workspaces?

They let me share types and utilities across packages without publishing to npm, while keeping dependencies isolated per package. It is a lightweight monorepo pattern.

### Q2: Why Zod instead of TypeScript-only validation?

TypeScript types disappear at runtime. Zod validates actual request payloads at the boundary and produces types from schemas, so runtime safety and static types stay aligned.

### Q3: Why Drizzle over Prisma?

Drizzle is lighter, SQL-like, and works well with PostgreSQL-specific features like full-text search. It also generates smaller bundles, which matters for the serverless-style deployment I target.

### Q4: How do you handle secrets?

Secrets stay in server-side environment variables. The backend validates required secrets at startup and never returns them in responses. The frontend only receives variables prefixed with `VITE_`, so keys like `DATABASE_URL` and `CLERK_SECRET_KEY` never reach the browser.

### Q5: How do you test AI features?

I test the surrounding contract: input validation, fallback behavior when OpenAI is absent, rate limiting, and response shape. Live AI calls are expensive and non-deterministic, so I keep unit tests deterministic and reserve live smoke tests for manual verification.

### Q6: Why not use a vector database?

Because I do not need it yet. PostgreSQL full-text search solves the current retrieval problem with less infrastructure. Adding pgvector would be premature optimization.

### Q7: How does workspace isolation prevent data leaks?

Every data query filters by `workspace_id` derived from the authenticated session. There are no global list endpoints without a workspace filter. The tests assert cross-workspace rejection.

### Q8: What would you improve first in production?

Replace in-memory rate limiting with a shared store, add request tracing, and move from schema push to migration-based deployments.

### Q9: Why separate frontend and API instead of SSR?

Separation keeps deployment flexible, lets each service scale independently, and matches the skills I want to demonstrate: API design, auth boundaries, and client state management.

### Q10: How do you handle errors?

Express error paths return sanitized JSON. Pino logs diagnostic details server-side. Stack traces are not exposed in production. Oversized or malformed requests get safe 4xx responses.

### Q11: Why GitHub Actions?

It is simple, already integrated with GitHub, and sufficient for running typecheck, tests, and build on every change.

### Q12: How do you keep generated code in sync?

OpenAPI is the source of truth. After contract changes I run codegen, review the diff, and commit the generated client and schemas. The CI build would catch missing regeneration.

### Q13: What is the biggest technical risk?

Single-instance rate limiting and lack of migration-based schema changes would need to be addressed before scaling horizontally.

### Q14: How do you approach accessibility and UI quality?

I use Radix UI primitives where possible, keep routing simple with Wouter, and rely on Tailwind for consistent spacing and contrast. Accessibility is a continuous priority, not a one-time checkbox.

### Q15: Why not build an autonomous agent?

Because the current goal is reliable hiring decision support, not automation that acts without human review. Unchecked agents are a liability in recruitment.
