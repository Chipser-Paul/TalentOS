# TalentOS Architecture

## Product boundary

TalentOS serves two primary users:

- **Recruiters and hiring managers** create roles, review candidates, and make shortlist decisions.
- **Candidates** submit applications, complete technical assessments, and participate in AI-assisted interviews.

The first release is recruiter-facing. Candidate-facing flows are planned but are not exposed in the Phase 1 workspace.

## Runtime shape

```text
Browser
  │
  │ typed REST calls
  ▼
React + Vite recruiter workspace
  │
  │ /api
  ▼
Express API gateway
  ├── Authentication and authorization
  ├── Recruitment domain services
  ├── AI orchestration
  ├── Workflow/job dispatch
  └── Analytics read models
        │
        ├── PostgreSQL: source-of-truth business data
        ├── Redis: queues, rate limits, and short-lived state
        ├── Object storage: CVs and knowledge documents
        └── AI integration: screening, embeddings, retrieval, and evaluation
```

## Repository map

```text
artifacts/
  api-server/          Express API gateway and route composition
  talentos/            Recruiter web application
  mockup-sandbox/      Visual prototyping surface
lib/
  api-spec/            OpenAPI source of truth
  api-client-react/    Generated React Query client
  api-zod/             Generated request/response schemas
  db/                  Drizzle schema and database access
docs/
  API.md               HTTP contract notes
```

## Domain boundaries

### Identity

Users, organizations, memberships, roles, sessions, and audit events. Authentication will use a managed auth provider rather than a local password/JWT implementation.

### Recruitment

Jobs, candidates, applications, stages, notes, and recruiter decisions.

### Intelligence

Screening runs, structured scorecards, evidence citations, model metadata, prompt versions, and evaluation outcomes.

### Assessments

Challenges, starter repositories, test cases, submissions, sandbox runs, security findings, performance metrics, and AI code reviews.

### Knowledge

Documents, document versions, chunks, embeddings, retrieval traces, and answer sources.

### Automation

Triggers, workflow definitions, steps, executions, retries, notifications, and webhooks.

### Analytics

Event ingestion, funnel aggregates, source performance, time-to-hire, and experiment assignments.

## API-first rule

`lib/api-spec/openapi.yaml` is the source of truth for user-facing HTTP contracts. Generated clients and Zod schemas are rebuilt from that file after every API change. The frontend imports generated hooks from `@workspace/api-client-react`; the server validates response payloads with `@workspace/api-zod`.

## Data and asynchronous work

PostgreSQL remains the source of truth for business entities. Long-running work must not block request handlers:

- AI screening runs are dispatched to workers.
- Document ingestion chunks and embeds asynchronously.
- Assessment execution happens in isolated sandboxes.
- Notifications and webhook delivery are retried jobs.

Each asynchronous execution will carry an idempotency key, attempt count, status, and audit trail.

## Security posture

The planned production boundary includes managed authentication, organization-scoped authorization, server-derived ownership fields, schema validation, secure headers, CORS allowlists, rate limiting, file type/size checks, audit logs, and least-privilege worker credentials.

Candidate documents and assessment submissions are untrusted input. They must never be executed or parsed in the API process.

## Phase 1 trade-off

The first API endpoints use small server-side fixtures. This keeps the UI on the real HTTP contract while the next phase introduces identity and persistent tables. The fixture layer is intentionally isolated in the API route module so it can be replaced by service/repository calls without changing the frontend contract.