# TalentOS

TalentOS is an AI-powered recruitment and developer evaluation platform for teams that want to move from applicant volume to high-signal hiring decisions.

The product is being built in deliberate stages. Phase 1 establishes the system boundary, the recruiter workspace, and a typed API contract. Later phases will add managed authentication, persistent recruitment data, AI screening, RAG, technical evaluation, workflow automation, analytics, testing, and deployment.

## Phase 1

The first runnable slice is a recruiter workspace with fixture-backed API data:

- Overview of active hiring work and recent activity
- Jobs and hiring pipeline
- Candidate screening signals
- Technical assessments
- Knowledge sources for the future RAG assistant
- Automation workflows
- Application funnel analytics
- Workspace settings entry point

The fixtures are intentionally served by the API rather than embedded in the frontend. This keeps the client contract honest while we build persistence and authentication in the next phases.

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