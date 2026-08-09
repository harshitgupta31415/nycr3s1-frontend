# nycr3s1-frontend

Next.js frontend foundation for NYC Round 3, hosted as a Docker container on
Google Cloud Run and connected to the managed FastAPI backend.

- Production: `https://nycr3s1-frontend-s2tvvhxdpa-el.a.run.app`
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
the frontend Cloud Run service at deployment time.
