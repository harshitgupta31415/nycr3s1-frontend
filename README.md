# RollbackReady frontend

Next.js evidence stepper for the RollbackReady Prisma migration safety agent.
It includes the unsafe-phone judge demo, project upload, schema history, risk
dashboard, failure timeline, safer plan, clean-baseline verification, and JSON
evidence report. Browser uploads are proxied through the Next.js server route;
the browser never sends artifacts directly to the backend origin.

The proxy forwards only the Authorization header and Clerk session cookies,
while leaving unrelated browser cookies behind. This supports owner-isolated
Clerk mode when configured and the opaque-ID anonymous hackathon mode when it
is not.

- Public production URL: `https://dbsentinal.get200.qd.je`
- Cloud Run origin: `https://nycr3s1-frontend-s2tvvhxdpa-el.a.run.app`
- Cloud Run service: `nycr3s1-frontend` in GCP `asia-south1`
- Framework: Next.js 16.3 with React 19
- Hosted runtime: Cloud Run with Node.js 24

## Development

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

## Continuous deployment

GitHub Actions tests every pushed branch. A push to `main` additionally builds an
immutable Docker image, publishes it to Google Artifact Registry, and deploys a
new public Cloud Run revision. Authentication uses Google Workload Identity
Federation, so GitHub stores no GCP service-account key.

`BACKEND_URL` points to the stable HTTPS Cloud Run backend and is configured on
the frontend Cloud Run service at deployment time. `SITE_URL` is the canonical
public hostname used by Next.js metadata and is configured as
`https://dbsentinal.get200.qd.je` in the deployment workflow.

The public hostname is served through a Google Cloud external HTTPS load
balancer backed by the `nycr3s1-frontend` Cloud Run service. Google-managed TLS
provides the certificate for `dbsentinal.get200.qd.je`.
