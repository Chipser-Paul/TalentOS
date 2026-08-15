# TalentOS

TalentOS is an AI-powered recruitment and developer evaluation platform for teams that want to move from applicant volume to high-signal hiring decisions.

The product is being built in deliberate stages. The foundation now includes the recruiter workspace, typed API contracts, managed Clerk authentication, and per-user PostgreSQL workspaces. Later phases will add recruiter CRUD, AI screening, RAG, technical evaluation, workflow automation, analytics, testing, and deployment.

## Phase 1

The first runnable slice is an authenticated recruiter workspace with a database-seeded starting workspace:

- Overview of active hiring work and recent activity
- Jobs and hiring pipeline
- Candidate screening signals
- Technical assessments
- Knowledge sources for the future RAG assistant
- Automation workflows
- Application funnel analytics
- Workspace settings entry point

New Clerk users receive an isolated Northstar Labs starter workspace on first authenticated access. The starter records are seeded by the API into PostgreSQL, not embedded in the frontend, so the client exercises the same ownership boundary used by future CRUD flows.

## Run

```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/talentos run dev
```

The API is mounted at `/api`; the TalentOS web app is mounted at `/`.

## Workspace commands

```bash
pnpm run typecheck
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/talentos run typecheck
```

## Product roadmap

1. Foundation and architecture
2. Authentication and RBAC
3. Core recruitment workflows
4. AI candidate screening
5. RAG knowledge assistant
6. Technical assessments and sandboxed evaluation
7. Workflow automation and notifications
8. Funnel and product analytics
9. Unit, integration, and end-to-end testing
10. Containerization, CI/CD, and deployment