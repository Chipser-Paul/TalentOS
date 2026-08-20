# Screenshot Plan

Capture these screenshots for portfolio, GitHub, and LinkedIn. Use realistic demo data. Do not expose real user data, API keys, or database credentials.

## 1. Landing / Sign-in page
- **Visible**: TalentOS branding, Clerk sign-in form, clean layout.
- **Demo data**: N/A — this is the auth entry point.
- **Avoid**: Do not show backend URLs or environment variables.

## 2. Dashboard
- **Visible**: Summary cards, recent activity, navigation sidebar.
- **Demo data**: Seeded starter workspace records (jobs, candidates, assessments).
- **Avoid**: Do not show internal IDs or secrets.

## 3. Candidates list
- **Visible**: Candidate table with status, role, and applied date.
- **Demo data**: 5–10 realistic candidate rows.
- **Avoid**: Do not show email addresses or phone numbers if they are real.

## 4. Candidate AI evaluation result
- **Visible**: Evaluation panel with fit score, recommendation badge, strengths, gaps, summary.
- **Demo data**: One evaluated candidate with realistic scores and text.
- **Avoid**: Do not show raw OpenAI API keys or provider errors.

## 5. Jobs list
- **Visible**: Job requisitions with status, department, and open slots.
- **Demo data**: 3–5 jobs spanning different roles.
- **Avoid**: Do not show salary data if it is sensitive.

## 6. Knowledge / RAG assistant
- **Visible**: Knowledge source list and query input/output panel with cited sources.
- **Demo data**: A few knowledge sources (interview guides, policies) and one grounded Q&A exchange.
- **Avoid**: Do not show database queries or backend paths.

## 7. Automations
- **Visible**: Automation cards or table with trigger, status, and action summary.
- **Demo data**: Draft and active automations.
- **Avoid**: Do not show webhook URLs or secret tokens.

## 8. API health / readiness (optional)
- **Visible**: `healthz` and `readyz` JSON responses in a terminal or HTTP client.
- **Demo data**: Standard `{ status: "ok" }` and `{ status: "ready", database: "connected" }` responses.
- **Avoid**: Do not show database credentials.

## Screenshot Tips

- Use browser zoom 100% and a standard desktop resolution (1920x1080 or similar).
- Capture the full app shell, not just a cropped component.
- If using mock data, make it clearly demo data.
- Keep the UI in light mode unless dark mode is the intended default.
- Verify no `.env` values, tokens, or secret keys are visible in devtools or network tabs.
