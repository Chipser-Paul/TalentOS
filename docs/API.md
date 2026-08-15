# TalentOS API

The API is served below `/api` and described by `lib/api-spec/openapi.yaml`.

## Phase 1 endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/healthz` | Service health |
| GET | `/dashboard/summary` | Recruiter overview metrics |
| GET | `/dashboard/activity` | Recent activity feed |
| GET | `/jobs` | Active job requisitions |
| GET | `/candidates` | Candidate screening signals |
| GET | `/assessments` | Technical assessment inventory |
| GET | `/knowledge/sources` | Recruitment knowledge sources |
| GET | `/automations` | Workflow automation inventory |
| GET | `/analytics/funnel` | Application funnel stages |

These are read-only Phase 1 surfaces. Mutations, authentication, and persistence will be introduced with the corresponding roadmap phase rather than simulated in the UI.