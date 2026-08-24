# AI Sales & Lead Qualification Agent — Architecture & Build Plan

> **Portfolio project** built with **n8n** (orchestration) + **OpenAI** (intelligence).
> A realistic, reusable AI-powered lead management system that captures, understands,
> qualifies, follows up with, and books appointments for inbound leads — while
> escalating complex conversations to a human.

- **Status:** Planning / architecture (no workflows built yet)
- **Primary n8n workflow (shell created):** `AI Lead Flow` — `Eh7s0XF0NSJEIECN`
- **Owner:** Harmain Rizwan
- **Last updated:** 2026-08-24

---

## 0. Environment Snapshot (verified in the live n8n instance)

These are the credentials **already configured** in your n8n — the architecture is built around them, not guesswork.

| Capability | Credential (type) | Role in this project |
|---|---|---|
| AI / LLM | **OpenAI account** (`openAiApi`) | Understanding, extraction, qualification, message generation, escalation detection |
| Database | **Supabase account** (`supabaseApi`) | Primary persistent store (Postgres): leads, conversations, appointments, events |
| Email | **Gmail account** (`gmailOAuth2`) | Send AI replies + follow-ups to leads; escalation emails to admin |
| Internal alerts | **Discord Webhook** (`discordWebhookApi`) | Real-time "hot lead" + "human required" notifications to the team |
| Spreadsheet | **Google Sheets** (`googleSheetsOAuth2Api`) | Optional lightweight demo/CRM view of leads |
| Messaging (future) | **WhatsApp** (`whatsAppApi`) | Optional future lead channel — out of MVP scope |

**Gaps to close before the appointment module:**
- ⛔ **Google Calendar** credential is **not** configured yet → must be added for Workflow 4 (booking).
- ℹ️ No **n8n Data Tables** exist yet. Supabase is the recommended store; Data Tables are a valid zero-setup fallback.

---

## 1. Final Understanding of the Project

We are **not** rebuilding the enterprise Upwork scope. We are building a **focused, production-shaped slice** that proves mastery of AI-agent automation.

**The business problem:** Sales teams waste hours manually reading inbound leads, deciding who's worth calling, replying, chasing non-responders, and booking calls. Most of that is repetitive.

**What the system does:**
> A lead arrives → AI reads and structures it → the lead is scored & qualified → n8n routes it by business rules → the system replies naturally → follow-ups fire automatically if there's no response → qualified leads get pushed toward a booked appointment → every state change is stored → anything sensitive or high-value is handed to a human.

**The one-line portfolio story:**
> *"I built an AI-powered lead management system that automatically captures, understands, qualifies, follows up with, and schedules leads — while escalating complex conversations to human agents."*

**Guiding principle (non-negotiable):**
- **n8n = orchestration** (webhooks, routing, conditions, delays, API calls, DB ops, email, scheduling, escalation, retries, logging).
- **OpenAI = intelligence** (understanding language, extracting structured data, scoring, drafting replies, detecting when a human is needed).
- **Business decisions are deterministic in n8n.** The AI *advises* (e.g. returns `lead_score`), n8n *decides* (e.g. `IF score >= 80`). The AI never directly controls external systems.

**Demo business:** a **Dubai real-estate agency** — concrete enough to feel real, but the schema & prompts are generic so it can be re-skinned for any industry by swapping the system prompt and scoring rubric.

---

## 2. Recommended Architecture

### 2.1 Conceptual flow

```
        Lead Form / Landing Page / API
                    │  (HTTP POST)
                    ▼
        ┌───────────────────────────┐
        │  WF1: Lead Intake         │  validate → normalize → lead_id → store (NEW) → log
        └───────────────┬───────────┘
                        │ (call sub-workflow)
                        ▼
        ┌───────────────────────────┐
        │  WF2: AI Qualification    │  OpenAI → structured JSON → validate → score → store
        └───────────────┬───────────┘
                        │  lead_score + qualification
        ┌───────────────┴───────────────────────────────┐
        ▼                     ▼                          ▼
   score >= 80           50–79                        < 50
   HOT / QUALIFIED       WARM                         NURTURE
        │                     │                          │
        ▼                     ▼                          ▼
  AI reply + push       AI reply +                  AI nurture reply
  to appointment        WF3 follow-up seq           + long-cycle drip
        │                     │
        ▼                     │
  WF4: Appointment  ◄─────────┘ (when lead engages / requests call)
  (Google Calendar)
        │
        ▼
  Update lead state  →  Confirmation email  →  Discord notify team

        ⚠ At ANY point, OpenAI may flag human_required = true
                    │
                    ▼
        ┌───────────────────────────┐
        │  WF5: Human Escalation    │  stop automation → set HUMAN_REQUIRED → email + Discord
        └───────────────────────────┘

  Cross-cutting: WF6 Follow-up Scheduler (cron) + central logging on every step.
```

### 2.2 Why multiple workflows (not one giant flow)

- **Separation of concerns** — intake, intelligence, follow-up, booking, escalation each own one job.
- **Reusability** — WF2 (AI Qualification) can be called from a web form *or* an email *or* WhatsApp later.
- **Testability** — each workflow can be executed and pinned independently.
- **Resilience** — a failure in follow-up scheduling doesn't take down intake.
- **Portfolio readability** — a reviewer sees a clean, modular system, not spaghetti.

---

## 3. Complete Feature Breakdown

| # | Feature | Owner | MVP? |
|---|---|---|---|
| F1 | Inbound lead capture via webhook (form/API) | n8n | ✅ MVP |
| F2 | Input validation + normalization + `lead_id` | n8n | ✅ MVP |
| F3 | AI understanding + structured extraction (intent, budget, location…) | OpenAI | ✅ MVP |
| F4 | Deterministic lead scoring + qualification routing | n8n (AI-assisted) | ✅ MVP |
| F5 | Persist lead / conversation / event to Supabase | n8n | ✅ MVP |
| F6 | AI-generated natural first reply (email) | OpenAI + Gmail | ✅ MVP |
| F7 | Automated timed follow-up sequence (24h / 72h / 7d) | n8n (cron) + OpenAI | ✅ MVP |
| F8 | Human escalation (detect → stop → notify) | OpenAI + n8n + Gmail/Discord | ✅ MVP |
| F9 | Lead lifecycle state machine | n8n + Supabase | ✅ MVP |
| F10 | Error handling: retries, JSON validation, fallback, logging | n8n | ✅ MVP |
| F11 | Appointment booking via Google Calendar | n8n + OpenAI intent | 🔶 Phase 2 |
| F12 | Multi-turn memory (don't re-ask known info) | OpenAI + Supabase context | 🔶 Phase 2 |
| F13 | Internal Discord "hot lead" alert | n8n | 🔶 Phase 2 |
| F14 | Google Sheets CRM mirror (demo view) | n8n | 🟢 Optional |
| F15 | WhatsApp channel | n8n | 🟢 Future |
| F16 | Simple lead-form frontend (static HTML) | Frontend | 🟢 Optional (great for demo) |

---

## 4. n8n Workflow Breakdown

Six workflows. `AI Lead Flow` (`Eh7s0XF0NSJEIECN`) becomes **WF1 Lead Intake** (the entry point); the rest are new.

### WF1 — Lead Intake  *(entry point)*
**Trigger:** Webhook (`POST /webhook/lead-intake`)
**Steps:**
1. **Webhook** receives `{ name, email, phone, message, source }`.
2. **Validate** (Code/IF): required fields present, email format valid → else respond `400` + log.
3. **Normalize** (Set): trim, lowercase email, default `source = "web_form"`, add `created_at`.
4. **Generate `lead_id`** (Code): UUID.
5. **Insert lead** into Supabase `leads` with `status = NEW`.
6. **Log event** `lead_intake / received`.
7. **Respond** `200 { lead_id, status: "received" }` to the form immediately.
8. **Call WF2** (Execute Workflow) asynchronously with the lead payload.

### WF2 — AI Qualification  *(the brain)*
**Trigger:** Execute Workflow (called by WF1).
**Steps:**
1. **Build prompt** (Set): system prompt + lead message + any known context.
2. **OpenAI** (Chat, JSON mode / structured output) → returns qualification JSON.
3. **Validate JSON** (Code): schema check; on failure → 1 retry with stricter instruction → fallback `qualification = "needs_review"`.
4. **Store** parsed fields on the lead (`intent`, `requirements`, `budget`, `timeline`, `urgency`, `lead_score`, `qualification`, `missing_information`, `next_action`); set `status = QUALIFYING → QUALIFIED/NURTURE`.
5. **Escalation check** (IF `human_required`) → call **WF5** and stop the automated branch.
6. **Route by score** (Switch):
   - `>= 80` → Hot: generate AI reply → send via Gmail → mark `next_action`, arm appointment path.
   - `50–79` → Warm: generate AI reply → send → enroll in **WF3** follow-up.
   - `< 50` → Nurture: soft AI reply → long-cycle drip.
7. **Log** `ai_qualification / scored`.

### WF3 — Follow-up Sequence  *(re-engagement)*
Driven by **WF6 scheduler** (state + timestamps), not long in-workflow waits.
- Reads leads whose `status ∈ {CONTACTED, QUALIFYING}` and `last_contact_at` older than the next step's interval, and who have **not replied**.
- Steps: `follow_up_1` after 24h → `follow_up_2` after 72h → `follow_up_final` after 7d → then `status = NURTURE/INACTIVE`.
- Each step: OpenAI drafts a context-aware message (references what we already know) → Gmail send → update `follow_up_stage` + `last_contact_at` → log. Idempotent (never double-sends the same stage).

### WF4 — Appointment Booking  *(Phase 2, needs Google Calendar cred)*
- Triggered when OpenAI detects `next_action = offer_appointment` or the lead expresses booking intent.
- Steps: check Google Calendar free/busy → present available slots → lead picks → **create calendar event** → `status = APPOINTMENT_BOOKED` → confirmation email → Discord notify team. Calendar failure → keep lead safe + notify (never lose the lead).

### WF5 — Human Escalation
- **Trigger:** Execute Workflow (called by WF2/WF3/WF4 when `human_required = true`).
- Steps: **stop** autonomous conversation for that lead (`status = HUMAN_REQUIRED`, set a `paused` flag WF3 respects) → **Gmail** email to admin with lead summary + reason → **Discord** alert → log `escalation / raised`.

### WF6 — Follow-up Scheduler  *(cron engine)*
- **Trigger:** Schedule (e.g. every 30–60 min).
- Queries Supabase for leads **due** for a follow-up (based on state + timestamps + not-replied + not-paused) → routes each into **WF3**. This is what makes timing deterministic and n8n-owned rather than relying on fragile long `Wait` nodes.

> **Note on reply capture (Phase 2+):** to know a lead "replied", add either a reply webhook (form/portal) or a Gmail Trigger that matches the thread and updates `last_reply_at` + `status = CONTACTED→ENGAGED`. For MVP, replies can be simulated via a `POST /webhook/lead-reply` endpoint.

---

## 5. OpenAI Responsibilities (and boundaries)

**OpenAI DOES:**
- Read the free-text lead message and **extract structured JSON**.
- **Qualify** the lead + produce a `lead_score` (0–100) with reasoning.
- Identify **missing information** and the **recommended next action**.
- **Draft** natural-language replies and follow-ups (tone: professional, helpful, concise).
- **Detect escalation** need (`human_required` + reason).

**OpenAI does NOT:**
- Decide final routing (n8n does, from the score).
- Call calendars, DBs, or send emails directly.
- Invent facts (property listings/prices) — it works only from the lead's message + provided context.

**Model & call settings:**
- Model: a current OpenAI model (e.g. `gpt-4o` / `gpt-4o-mini` for cost) — extraction can use the cheaper model; reply generation the stronger one.
- **JSON / structured output mode** for all decisions → reliable parsing.
- `temperature`: low (`0–0.3`) for extraction/scoring; moderate (`0.5–0.7`) for message drafting.
- Every AI decision passes through an n8n **JSON validation** gate.

**Target extraction schema (WF2 output):**
```json
{
  "intent": "buy_property",
  "requirements": { "property_type": "apartment", "bedrooms": 3, "location": "Dubai" },
  "budget": 250000,
  "currency": "USD",
  "timeline": "2 months",
  "urgency": "high",
  "customer_type": "buyer",
  "lead_score": 91,
  "qualification": "qualified",
  "missing_information": [],
  "next_action": "offer_appointment",
  "human_required": false,
  "human_reason": null,
  "confidence": 0.94
}
```

---

## 6. Database / Storage Design (Supabase / Postgres)

Four tables. Keep it clean, not enterprise.

### `leads`
| column | type | notes |
|---|---|---|
| id | uuid (PK) | our `lead_id` |
| name | text | |
| email | text | |
| phone | text | |
| source | text | web_form / api / whatsapp |
| original_message | text | |
| intent | text | from AI |
| requirements | jsonb | property_type, bedrooms, location… |
| budget | numeric | |
| currency | text | |
| timeline | text | |
| urgency | text | low/medium/high |
| lead_score | int | 0–100 |
| qualification | text | qualified / warm / nurture / needs_review |
| status | text | lifecycle state (see §7) |
| next_action | text | |
| follow_up_stage | text | none / 1 / 2 / final |
| assigned_agent | text | nullable |
| paused | bool | true when human-owned |
| last_contact_at | timestamptz | last outbound message |
| last_reply_at | timestamptz | last inbound reply |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `conversations`
| id (uuid) | lead_id (fk) | sender (`lead`/`ai`/`human`) | direction (`inbound`/`outbound`) | message (text) | channel (`email`…) | timestamp |

### `appointments`
| id (uuid) | lead_id (fk) | calendar_event_id | scheduled_at | status (`pending`/`booked`/`cancelled`) | created_at |

### `workflow_events`  *(audit log)*
| id (uuid) | lead_id (fk) | workflow | action | status (`ok`/`error`) | detail (jsonb) | error (text) | timestamp |

> **Lightweight alternative:** if we want zero external setup for a quick demo, the same four tables map cleanly to **n8n Data Tables** or **Google Sheets tabs**. Recommendation: **Supabase** (it's already configured and it looks the most professional in a portfolio).

---

## 7. Lead Lifecycle / State Machine

```
NEW ──▶ CONTACTED ──▶ QUALIFYING ──▶ QUALIFIED ──▶ APPOINTMENT_PENDING ──▶ APPOINTMENT_BOOKED ──▶ CONVERTED
                          │                                                          
                          └──▶ NURTURE  ◀── (follow-ups exhausted)
                                 │
                                 └──▶ INACTIVE / LOST

  ANY STATE ──▶ HUMAN_REQUIRED   (escalation; automation paused)
```

**Rules:**
- Transitions happen **only inside n8n** and are always written to `leads.status` + logged to `workflow_events`.
- `HUMAN_REQUIRED` sets `paused = true`; WF3/WF6 skip paused leads.
- No skipping states silently — every hop is auditable.

---

## 8. Required APIs / Integrations

| Integration | Status | Used for |
|---|---|---|
| OpenAI API | ✅ configured | AI qualification + generation |
| Supabase | ✅ configured | Database |
| Gmail | ✅ configured | Lead emails + escalation emails |
| Discord Webhook | ✅ configured | Internal team alerts |
| n8n Webhook | ✅ built-in | Lead intake + reply endpoint |
| Google Sheets | ✅ configured | Optional CRM mirror |
| **Google Calendar** | ⛔ **to add** | Appointment booking (Phase 2) |
| Static lead form (HTML) | 🟢 to build | Demo frontend that POSTs to the webhook |

---

## 9. Project / Folder Structure

n8n workflows live in the cloud instance, but the **repo** documents and version-controls everything (portfolio gold).

```
AI Lead Flow/
├── docs/
│   ├── AI-Lead-Flow-Architecture.md   ← (this file)
│   ├── prompts/                        ← system prompts (qualification, reply, follow-up, escalation)
│   ├── api/                            ← webhook request/response contracts
│   └── diagrams/                       ← architecture + state-machine images
├── workflows/                          ← exported n8n workflow JSON (WF1–WF6)
├── db/
│   └── schema.sql                      ← Supabase table definitions
├── frontend/
│   └── lead-form.html                  ← simple demo lead form
├── tests/
│   └── sample-payloads/                ← example leads (hot / warm / nurture / escalation)
└── README.md                           ← portfolio landing page (story + screenshots + GIF)
```

---

## 10. Development Phases

| Phase | Goal | Deliverables |
|---|---|---|
| **P0 — Foundations** | DB + intake skeleton | `schema.sql` in Supabase; WF1 Lead Intake (webhook → validate → store → respond); sample payloads |
| **P1 — AI Core (MVP heart)** | Intelligence + routing | WF2 AI Qualification with structured output + JSON validation + scoring/routing; first AI email reply via Gmail |
| **P2 — Follow-ups** | Automated re-engagement | WF6 scheduler + WF3 sequence (24h/72h/7d) with idempotency |
| **P3 — Escalation** | Human-in-the-loop | WF5 escalation (email + Discord); `HUMAN_REQUIRED` + pause logic |
| **P4 — Appointments** | Booking | Add Google Calendar cred; WF4 free/busy → book → confirm |
| **P5 — Polish & Portfolio** | Demo-ready | Lead form frontend, Google Sheets mirror, README, screenshots/GIF, error-handling pass |

**MVP = P0 + P1 + P2 + P3.** That alone is a strong, honest portfolio piece. P4/P5 make it shine.

---

## 11. MVP vs Optional

**MVP (must-have to tell the story):**
- Webhook intake + validation + storage
- AI structured qualification + deterministic scoring/routing
- AI-generated first reply
- Automated follow-up sequence
- Human escalation
- State machine + logging + basic error handling

**Optional / future:**
- Google Calendar appointment booking (strongly recommended as the "wow" add-on)
- Multi-turn memory / reply capture
- Google Sheets CRM mirror
- WhatsApp channel, analytics dashboard, multi-tenant

---

## 12. Testing Strategy

- **Sample payloads** for each path: `hot-lead.json`, `warm-lead.json`, `nurture-lead.json`, `escalation-lead.json`, `invalid-lead.json`.
- **Per-workflow execution + pinned data:** run WF2 in isolation with pinned OpenAI output to test routing without burning API calls.
- **JSON contract tests:** assert the AI output matches the schema; verify the fallback path when it doesn't.
- **Routing tests:** score 91 → HOT, 65 → WARM, 30 → NURTURE, `human_required=true` → escalation regardless of score.
- **Idempotency test:** re-run follow-up scheduler twice → no duplicate emails.
- **Failure injection:** bad webhook payload → graceful 400 + log; simulate OpenAI failure → retry then fallback; calendar failure → lead stays safe.
- **End-to-end smoke:** POST a lead via the form → verify Supabase rows (lead + conversation + events), email sent, correct final state.

---

## 13. Example End-to-End Scenarios

**Scenario A — Hot lead → appointment**
> *"Hi, I'm looking for a 3-bedroom apartment in Dubai. Budget ~$250k, want to move within 2 months."*
Intake → AI extracts (score 91, `qualified`, `next_action: offer_appointment`) → Hot route → AI reply offering a call → lead accepts → Calendar event created → `APPOINTMENT_BOOKED` → confirmation email + Discord ping.

**Scenario B — Warm lead → follow-up converts**
> *"Maybe interested in a villa in Dubai someday, not sure on budget."*
Score 62 `warm` → AI reply asking budget/timeline → no response → 24h follow-up → 72h follow-up → lead replies with budget → re-qualified upward → moves to appointment path.

**Scenario C — Human escalation**
> *"I already paid a deposit and there's a problem with my contract. I want a manager."*
AI sets `human_required = true`, `human_reason: "contract dispute / payment issue"` → WF5 stops automation → `HUMAN_REQUIRED` + `paused` → admin email + Discord alert with full context.

**Scenario D — Low quality / nurture**
> *"do u have anything cheap lol"*
Score 22 `nurture` → polite AI reply asking for specifics → long-cycle drip, no aggressive follow-up.

**Scenario E — Bad input (error handling)**
> Webhook body missing `email`.
Validation fails → `400 { error: "email required" }` → logged to `workflow_events` → no partial lead created.

---

## 14. How to Demonstrate This in a Portfolio

- **README with the story** (the one-liner from §1) + an **architecture diagram** + a **state-machine diagram**.
- **A 60–90s GIF/screen recording:** submit a lead on the form → watch n8n light up → show the AI's structured JSON → show the email that went out → show the Supabase row updating → trigger an escalation and show the Discord alert.
- **Annotated screenshots** of each workflow canvas (clean, labelled nodes).
- **"Before / After" framing:** manual sales busywork vs. this automated pipeline.
- **A short technical write-up:** "Why n8n orchestrates and OpenAI only advises" (the architectural principle) — this is what makes you look like a *senior* automation architect, not a workflow copier.
- **Reusability pitch for the Upwork proposal:** "Swap the system prompt + scoring rubric and this runs for dentists, agencies, SaaS, coaches — any inbound-lead business."

---

## Immediate Next Steps (proposed)

1. **P0 kickoff:** finalize `schema.sql` and create the four tables in Supabase.
2. Build **WF1 Lead Intake** on the existing `AI Lead Flow` workflow (webhook → validate → store → respond).
3. Draft the **qualification system prompt** in `docs/prompts/`.
4. Then build **WF2 AI Qualification** and test with the sample payloads.

> When you're ready, say the word and we'll start **P0** — I'll ground everything in the n8n SDK reference and best-practices before writing any workflow code.
