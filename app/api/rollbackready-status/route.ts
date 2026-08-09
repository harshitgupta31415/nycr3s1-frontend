export const dynamic = "force-dynamic";

export async function GET() {
  const backend = process.env.BACKEND_URL?.replace(/\/$/, "");
  if (!backend) {
    return Response.json(
      { status: "unavailable", message: "BACKEND_URL is not configured." },
      { status: 503 },
    );
  }
  try {
    const [readyResponse, healthResponse, databaseResponse] = await Promise.all([
      fetch(`${backend}/health/ready`, { cache: "no-store", signal: AbortSignal.timeout(5_000) }),
      fetch(`${backend}/health`, { cache: "no-store", signal: AbortSignal.timeout(5_000) }),
      fetch(`${backend}/health/database`, { cache: "no-store", signal: AbortSignal.timeout(5_000) }),
    ]);
    const checks = {
      ready: readyResponse.ok,
      health: healthResponse.ok,
      database: databaseResponse.ok,
    };
    if (!readyResponse.ok) throw new Error(`Backend readiness returned ${readyResponse.status}.`);
    if (!checks.health || !checks.database) {
      throw new Error("Auxiliary backend checks failed.");
    }
    return Response.json({ status: "ready", checks });
  } catch {
    return Response.json(
      { status: "unavailable", message: "The analysis backend is not reachable." },
      { status: 503 },
    );
  }
}
