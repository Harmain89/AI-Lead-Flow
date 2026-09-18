# AI Lead Flow Guidelines

## Workflow Sync Requirement
- Whenever any modification, update, or tuning is made to the live n8n workflow **AI Lead Flow** (ID: `Eh7s0XF0NSJEIECN`), you MUST immediately export and sync the updated workflow JSON into:
  `workflows/AI Lead Flow.json`
- This ensures the local git repository remains the complete, version-controlled source of truth.

## Repository Layout
- `workflows/AI Lead Flow.json` — Latest exported n8n workflow definition.
- `docs/AI-Lead-Flow-Architecture.md` — Complete system architecture, scoring rubrics, and phase breakdown.
- `frontend/` — Next.js 16 application with SQLite (Drizzle ORM) backend routes (`/api/leads`, `/api/conversations`) and client intake portal.
- `tests/sample-payloads/` — Sample leads for end-to-end testing (hot, warm, nurture, escalation, invalid).
