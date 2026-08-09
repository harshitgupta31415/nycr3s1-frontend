# dbsentinal frontend

dbsentinal is a Next.js interface for evidence-based Prisma migration review.
It stages a project bundle through a server-side API proxy, runs the PostgreSQL
analysis pipeline, explains deterministic findings, visualizes interruption
evidence, generates a constrained recovery plan, and verifies that plan from a
clean baseline.

## Hackathon alignment

This project is positioned in the **Build What Survives Failure** track.

The core problem we solve is the invisible operational fragility people have
accepted as normal: database migration decisions are made from static analysis and
assumptions, without deterministic failure simulation or recovery verification.
RollbackReady survives imperfect conditions by validating migrations under injected
failures, reporting evidence by dimension, and producing bounded recovery options
only after an independent re-run verifies them.

The product promise is **verified for human review**, never "safe to deploy."
The browser never receives production credentials and never sends an uploaded
bundle directly to the backend origin.

## Hackathon alignment

This frontend is built for the **Build What Survives Failure** track.

People often accept “best effort” migration confidence as normal, even though
runtime failures are invisible until deploy. This interface turns that hidden risk
into visible progress by surfacing deterministic evidence dimensions, failure
timelines, and recovery-plan verification states so teams can make review decisions
from evidence instead of a single pass/fail signal.

## Product flow

1. Run the built-in unsafe-phone demo or upload a Prisma project ZIP.
2. Review migration history, deterministic findings, and the candidate verdict.
3. Inspect normal execution, legacy-query replay, and interruption evidence.
4. Generate an expand-and-contract recovery plan through the backend planner.
5. Verify the generated SQL in a fresh disposable PostgreSQL 18 sandbox.
6. Download the sanitized JSON evidence report.

The candidate verdict and recovery-plan verdict are deliberately independent. An
unsafe candidate remains `UNSAFE` even when a replacement plan earns
`VERIFIED_FOR_REVIEW`.

## Application routes

| Route | Purpose |
| --- | --- |
| `/` | Complete interactive analysis and recovery workflow |
| `/product` | Product capabilities and safety promise |
| `/simulation` | Sandbox and failure-injection explanation |
| `/architecture` | System boundaries and component overview |
| `/reports` | Evidence model and report explanation |
| `/api/rollbackready/[...path]` | Server-side proxy to backend `/api/v1/*` routes |

## Technology

- Next.js 16.3 and React 19
- TypeScript 6
- Clerk 7 for optional authentication
- Motion, GSAP, and Lenis for interaction and scroll behavior
- Monaco Editor for SQL presentation
- XYFlow for the migration pipeline
- Radix UI, Lucide, and Sonner for accessible UI primitives and feedback
- Tailwind CSS 4 plus application-level styles
- Node.js 24 in the production container

## Local development

### Prerequisites

- Node.js 24 and npm
- A running dbsentinal backend, normally at `http://localhost:8080`

### Start the app

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The frontend server proxies API calls to the value
of `BACKEND_URL`.

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `BACKEND_URL` | Yes | Server-only FastAPI origin; defaults to `http://localhost:8080` |
| `SITE_URL` | Yes in production | Canonical URL used by Next.js metadata |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | No | Enables Clerk UI when paired with backend credentials |
| `CLERK_SECRET_KEY` | No | Server-only Clerk credential used by the API proxy |
| `NEXT_PUBLIC_CLERK_AUTH_REQUIRED` | No | Set to `true` only when both frontend and backend require sign-in |

Keep Clerk disabled for the anonymous hackathon flow by leaving the publishable
key blank and `NEXT_PUBLIC_CLERK_AUTH_REQUIRED=false`.

## Commands

```powershell
npm run dev        # development server
npm run lint       # ESLint
npm run typecheck  # TypeScript without emitting files
npm run build      # production build
npm run start      # run the production build
```

## API proxy and authentication

All browser requests use `/api/rollbackready/*`. The route handler:

- maps the request to backend `/api/v1/*`;
- forwards the HTTP method, body, content type, and query string;
- obtains and forwards a Clerk bearer token when Clerk is configured;
- does not forward unrelated browser cookies;
- preserves `WWW-Authenticate` and `Retry-After` response headers;
- enforces a 120-second upstream timeout; and
- adds a safe download filename for JSON reports.

Authorization is enforced again by FastAPI. In anonymous mode, possession of the
opaque analysis UUID is the temporary access boundary. In Clerk mode, the backend
also checks report ownership.

## Project structure

```text
app/
|-- api/rollbackready/[...path]/  # backend-for-frontend API proxy
|-- architecture/                # architecture explainer route
|-- components/                  # product visuals and interaction layers
|-- product/                     # product explainer route
|-- reports/                     # evidence-report route
|-- simulation/                  # simulator explainer route
|-- globals.css                  # design system and responsive layout
|-- layout.tsx                   # metadata, Clerk provider, global shell
`-- page.tsx                     # complete interactive workflow
components/ui/                   # reusable UI primitives
lib/                             # shared frontend helpers
public/                          # static assets
proxy.ts                         # optional Clerk middleware
```

The backend design is documented in
[`../backend/architecture.md`](../backend/architecture.md).

## Deployment

The production Dockerfile builds a standalone Next.js image and runs it as an
unprivileged user on port `8080`. GitHub Actions tests every branch; pushes to
`main` build an immutable image, publish it to Google Artifact Registry, and
deploy that image to Cloud Run through Workload Identity Federation.

Configured deployment targets:

- Public application: [https://dbsentinal.get200.qd.je](https://dbsentinal.get200.qd.je)
- Cloud Run origin: [https://nycr3s1-frontend-s2tvvhxdpa-el.a.run.app](https://nycr3s1-frontend-s2tvvhxdpa-el.a.run.app)
- Public docs endpoint: [https://dbsentinal.get200.qd.je/product](https://dbsentinal.get200.qd.je/product)
- Product simulator: [https://dbsentinal.get200.qd.je/simulation](https://dbsentinal.get200.qd.je/simulation)
- Architecture explainer: [https://dbsentinal.get200.qd.je/architecture](https://dbsentinal.get200.qd.je/architecture)
- Evidence report page: [https://dbsentinal.get200.qd.je/reports](https://dbsentinal.get200.qd.je/reports)

Backend endpoint:

- API base: [https://nycr3s1-backend-s2tvvhxdpa-el.a.run.app](https://nycr3s1-backend-s2tvvhxdpa-el.a.run.app)
- API docs: [https://nycr3s1-backend-s2tvvhxdpa-el.a.run.app/docs](https://nycr3s1-backend-s2tvvhxdpa-el.a.run.app/docs)

`BACKEND_URL` is injected at runtime and is never exposed as a public browser
environment variable. The public hostname terminates Google-managed TLS at an
external HTTPS load balancer backed by Cloud Run.

## Current scope

The hackathon MVP executes PostgreSQL Prisma migrations only. It uses synthetic
fixtures, does not connect to production, and treats lock risk as a heuristic.
Raw artifacts are managed by the backend and expire with the analysis lifecycle;
the frontend displays only sanitized evidence returned by the API.

