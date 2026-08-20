# TalentOS — Portfolio Documentation

## Descriptions

### 50-word description

TalentOS is an AI-powered recruitment platform built with React, Express, and PostgreSQL. It features Clerk authentication, workspace-isolated CRUD, OpenAI candidate evaluation, and a grounded RAG knowledge assistant. The project demonstrates production-ready API design, OpenAPI contracts, CI/CD, Docker, and security hardening.

### 100-word description

TalentOS is a full-stack recruitment and developer evaluation platform designed to showcase production-grade engineering practices. The frontend is built with React 19 and Vite, the API with Express 5 and TypeScript, and data persists in PostgreSQL via Drizzle ORM. It includes Clerk authentication, per-user workspace isolation, typed OpenAPI 3.1 contracts with Orval-generated React Query hooks, Zod validation, and a read-only MCP-style tool layer. AI features include structured candidate-to-job evaluation and a PostgreSQL full-text-search RAG assistant. The repository also includes GitHub Actions CI, Docker multi-stage builds, rate limiting, security headers, and comprehensive tests.

### 200-word description

TalentOS is a portfolio-grade full-stack recruitment platform that demonstrates end-to-end software engineering capability across frontend, API, database, authentication, AI integration, and deployment. The React 19 + Vite frontend provides an authenticated recruiter workspace for managing jobs, candidates, assessments, knowledge sources, and automations. The Express 5 + TypeScript API enforces Clerk authentication, workspace isolation, CORS allowlisting, rate limiting, request body limits, and security headers, with all mutations validated through Zod schemas generated from a single OpenAPI 3.1 source of truth. The data layer uses PostgreSQL with Drizzle ORM, including full-text-search retrieval for the knowledge assistant. AI capabilities are implemented as decision support: a structured OpenAI evaluation endpoint returns validated fit scores, strengths, gaps, and recommendations, while the RAG query endpoint grounds answers in retrieved knowledge sources and explicitly handles insufficient evidence. A minimal read-only MCP/tool layer provides internal workspace data access. The project is containerized with multi-stage Docker builds, includes GitHub Actions CI running typecheck, tests, and build, and documents deployment architectures for Vercel, Render, Railway, and Neon.

## Technical Project Summary

TalentOS is a TypeScript monorepo using pnpm workspaces. It separates concerns into `artifacts/talentos` (React frontend), `artifacts/api-server` (Express API), `lib/api-spec` (OpenAPI source of truth), `lib/api-client-react` (generated React Query client), `lib/api-zod` (generated Zod schemas), and `lib/db` (Drizzle ORM + schema). The API enforces Clerk session authentication, extracts workspace context, and scopes all queries to the current user. CRUD endpoints use Zod-validated request bodies and sanitized response mappers. The AI layer abstracts OpenAI behind a service module, returning structured evaluation objects and grounded RAG responses. The MCP layer exposes six read-only tools via JSON-RPC. Production hardening includes environment validation, Helmet-style security headers, in-memory rate limiting for AI/RAG routes, 1MB body limits, and unauthenticated health/readiness endpoints. CI runs on GitHub Actions. Docker support includes multi-stage builds and docker-compose for local orchestration.

## Recruiter-Oriented Summary

TalentOS is a complete recruitment platform built by a full-stack engineer who cares about clean architecture, secure authentication, typed APIs, and responsible AI integration. The system supports candidate and job management, technical assessments, knowledge base search, and workflow automations—all scoped to authenticated workspaces. It is not a toy project: it includes real security headers, rate limiting, environment validation, CI pipelines, containerization, and deployment documentation. The engineer chose PostgreSQL full-text search over vector search because it fits the current data scale and avoids unnecessary infrastructure, demonstrating pragmatic technical decision-making.

## Interview Explanation

TalentOS is a recruitment platform I built to practice and demonstrate full-stack engineering at a production-like quality level. The frontend is React with Vite, the backend is Express with TypeScript, and the database is PostgreSQL with Drizzle. Authentication is handled by Clerk, which gives me managed sessions and user management without building auth from scratch. Every workspace is isolated, so users only see their own candidates, jobs, and knowledge. I used OpenAPI 3.1 as the single source of truth for API contracts and generated both the React Query client and Zod validation schemas from it. For AI, I added a candidate evaluation endpoint that returns structured scores and a RAG assistant that retrieves knowledge using PostgreSQL full-text search and grounds answers in those sources. I also added security basics—CORS, rate limiting, security headers, body limits, and environment validation—plus GitHub Actions CI and Docker support. The project is designed to be deployable, not just runnable.

## Architecture Explanation

The architecture follows a clean separation between frontend, API, database, and external services. The React frontend lives in `artifacts/talentos` and calls the Express API under `/api`, either through Vite dev proxy or a production base URL. The API in `artifacts/api-server` mounts routers, applies Clerk middleware, validates requests with Zod, queries PostgreSQL through Drizzle, and returns sanitized JSON. The database schema lives in `lib/db` and defines workspace-scoped tables. OpenAPI contracts in `lib/api-spec/openapi.yaml` drive code generation for both the frontend client and backend validation. AI features are isolated in `artifacts/api-server/src/services/ai`, and the MCP tool layer lives in `src/services/tools` and `src/services/mcp`. CI, Docker, and deployment docs sit at the repo root. This makes the system easy to test, build, and deploy independently.

## Key Engineering Challenges Solved

1. **Cross-platform local development** — Replaced Unix-only export scripts with a Node.js bootstrap that loads the root `.env` before spawning child processes, and configured Vite `envDir` so both API and frontend share the same configuration.
2. **Typed API boundary** — Established OpenAPI 3.1 as the contract source, then used Orval to generate the React Query client and Zod schemas, eliminating hand-written request/response drift.
3. **Workspace isolation** — Ensured every query filters by `workspace_id` derived from the Clerk session, preventing cross-tenant data leakage.
4. **Production-ready API hardening** — Added security headers, rate limiting, body limits, environment validation, and health/readiness endpoints without rewriting existing working routes.
5. **Pragmatic RAG** — Chose PostgreSQL full-text search over pgvector because the current dataset and deployment target do not require vector infrastructure, avoiding unnecessary operational complexity.
6. **Containerized build pipeline** — Created multi-stage Dockerfiles that pin pnpm to the repo version, use production dependencies only in runtime, and run as a non-root user.

## Measurable / Technical Highlights

- **25 passing tests** (Vitest + Supertest) covering contracts, validation, workspace isolation, environment checks, health/readiness, rate limiting, request hardening, and security headers
- **100% TypeScript** across frontend, backend, database, and generated code
- **OpenAPI 3.1** as the single API source of truth with generated client and schemas
- **Zero secrets in browser bundle** — backend-only env validation and Vite `VITE_` scoping
- **CI pipeline** via GitHub Actions running typecheck, tests, and build on every push/PR
- **Docker multi-stage builds** with non-root runtime users and `.dockerignore`
- **Health/readiness endpoints** implemented without authentication for safe orchestration
- **Rate limiting** implemented in-memory for AI and RAG routes without Redis overhead
