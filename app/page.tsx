type DatabaseHealth = {
  status: string;
  database: {
    connected: boolean;
    database: string;
    applicationTableCount: number;
    checkedAt: string;
  };
};

const apiUrl = (
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "https://nycr3s1-backend-s2tvvhxdpa-el.a.run.app"
).replace(/\/$/, "");

export const dynamic = "force-dynamic";

async function readBackendHealth(): Promise<DatabaseHealth | null> {
  try {
    const response = await fetch(`${apiUrl}/health/database`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as DatabaseHealth;
  } catch {
    return null;
  }
}

export default async function Home() {
  const backend = await readBackendHealth();
  const isReady = backend?.database.connected === true;

  return (
    <main>
      <section className="hero">
        <div className="eyebrow">
          <span className="pulse" aria-hidden="true" />
          NYC · ROUND 3 · SYSTEM FOUNDATION
        </div>

        <div className="title-block">
          <p className="sequence">R3 / S1</p>
          <h1>The infrastructure is ready for the idea.</h1>
          <p className="lede">
            A clean Next.js starting point connected to a Python FastAPI API,
            GKE Autopilot, and managed PostgreSQL. Product code can begin here.
          </p>
        </div>

        <div className="actions">
          <a className="primary" href={`${apiUrl}/docs`} target="_blank" rel="noreferrer">
            Open API documentation
            <span aria-hidden="true">↗</span>
          </a>
          <a className="secondary" href={apiUrl} target="_blank" rel="noreferrer">
            View backend
          </a>
        </div>
      </section>

      <section className="status-panel" aria-label="Hosted infrastructure status">
        <div className="panel-heading">
          <div>
            <p className="label">LIVE SYSTEM CHECK</p>
            <h2>Hosted services</h2>
          </div>
          <span className={isReady ? "badge ready" : "badge waiting"}>
            {isReady ? "All systems ready" : "Checking backend"}
          </span>
        </div>

        <div className="status-grid">
          <article>
            <span className="index">01</span>
            <p>Frontend</p>
            <strong>Cloud Run · Next.js</strong>
            <small>Production deployment</small>
          </article>
          <article>
            <span className="index">02</span>
            <p>Backend</p>
            <strong>FastAPI · Python</strong>
            <small>{isReady ? "API responding" : "Response unavailable"}</small>
          </article>
          <article>
            <span className="index">03</span>
            <p>Compute</p>
            <strong>Cloud Run + GKE</strong>
            <small>Automatic deployment</small>
          </article>
          <article>
            <span className="index">04</span>
            <p>Database</p>
            <strong>PostgreSQL 18</strong>
            <small>
              {backend
                ? `${backend.database.database} · ${backend.database.applicationTableCount} app tables`
                : "Managed Cloud SQL"}
            </small>
          </article>
        </div>

        <div className="system-line">
          <span>MAIN COMMIT</span>
          <i aria-hidden="true" />
          <span>TEST + BUILD</span>
          <i aria-hidden="true" />
          <span>PRODUCTION</span>
        </div>
      </section>
    </main>
  );
}
