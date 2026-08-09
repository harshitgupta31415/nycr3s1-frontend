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
    const requireDatabase = process.env.NODE_ENV === "production"
      || process.env.ROLLBACKREADY_REQUIRE_DATABASE === "true";
    const healthResponse = await fetch(
      `${backend}${requireDatabase ? "/health/ready" : "/health"}`,
      {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
      },
    );
    if (!healthResponse.ok) {
      throw new Error("Backend health check failed.");
    }
    const health = await healthResponse.json() as {
      database?: { connected?: boolean };
    };
    if (!requireDatabase) {
      return Response.json({
        status: "ready",
        checks: { ready: true, health: true, database: false },
        mode: "local_ephemeral",
      });
    }
    const databaseConnected = health.database?.connected === true;
    const checks = {
      ready: true,
      health: true,
      database: databaseConnected,
    };
    if (!databaseConnected) {
      throw new Error("Backend database readiness check failed.");
    }
    return Response.json({
      status: "ready",
      checks,
      mode: "durable",
    });
  } catch {
    return Response.json(
      { status: "unavailable", message: "The analysis backend is not reachable." },
      { status: 503 },
    );
  }
}
