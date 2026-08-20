# TalentOS API

The API is served below `/api` and described by `lib/api-spec/openapi.yaml`.

## Authentication

All workspace endpoints require a valid Clerk session. The API rejects unauthenticated requests and scopes workspace records to the authenticated user's workspace.

## Workspace isolation

Every mutation and list operation is scoped to the current user's workspace. Cross-workspace access is not permitted; requests for resources outside the caller's workspace return `404`.

## Endpoints

### Health

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/healthz` | Service health |

### Jobs

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/jobs` | List job requisitions |
| POST | `/jobs` | Create a job requisition |
| PATCH | `/jobs/{jobId}` | Update a job requisition |
| DELETE | `/jobs/{jobId}` | Delete a job requisition |

### Candidates

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/candidates` | List candidate screening signals |
| POST | `/candidates` | Create a candidate record |
| PATCH | `/candidates/{candidateId}` | Update a candidate record |
| DELETE | `/candidates/{candidateId}` | Delete a candidate record |

### AI Evaluation

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/candidates/{candidateId}/evaluate/{jobId}` | Evaluate candidate fit for a job |

Request body: none. The endpoint evaluates the candidate against the job using only persisted workspace data.

Response: `CandidateEvaluation` with structured scores, strengths, gaps, recommendation, and summary.

Requires `OPENAI_API_KEY` to be configured. Output is decision support only; it does not make autonomous hiring decisions.

### Assessments

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/assessments` | List technical assessments |
| POST | `/assessments` | Create a technical assessment |
| PATCH | `/assessments/{assessmentId}` | Update a technical assessment |
| DELETE | `/assessments/{assessmentId}` | Delete a technical assessment |

### Knowledge Sources

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/knowledge/sources` | List recruitment knowledge sources |
| POST | `/knowledge/sources` | Create a knowledge source |
| PATCH | `/knowledge/sources/{sourceId}` | Update a knowledge source |
| DELETE | `/knowledge/sources/{sourceId}` | Delete a knowledge source |

### Knowledge RAG

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/knowledge/query` | Query knowledge sources with retrieval-augmented generation |

Request body:
```json
{ "query": "string" }
```

Response: `RagQueryResponse` with `answer` and `sources`.

Behavior:
- Retrieves relevant knowledge sources using PostgreSQL full-text search scoped to the caller's workspace.
- If no relevant sources are found, returns `answer: "The available knowledge does not answer this question."` with an empty `sources` array.
- Answers are grounded only in retrieved knowledge; the model is instructed not to invent missing facts.

Requires `OPENAI_API_KEY` to be configured.

### MCP Tools (read-only)

TalentOS exposes read-only tools through an internal MCP-style tool layer. Available tools:

- `get_candidate`
- `list_candidates`
- `get_job`
- `list_jobs`
- `list_knowledge_sources`
- `get_dashboard_metrics`

All tools enforce workspace isolation and do not expose destructive operations.

### Automations

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/automations` | List automation workflows |
| POST | `/automations` | Create an automation |
| PATCH | `/automations/{automationId}` | Update an automation |
| DELETE | `/automations/{automationId}` | Delete an automation |

### Dashboard

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/dashboard/summary` | Recruiter overview metrics |
| GET | `/dashboard/activity` | Recent activity feed |

### Analytics

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/analytics/funnel` | Application funnel stages |
