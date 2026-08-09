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
    const response = await fetch(`${backend}/health/ready`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error(`Backend readiness returned ${response.status}.`);
    return Response.json({ status: "ready" });
  } catch {
    return Response.json(
      { status: "unavailable", message: "The analysis backend is not reachable." },
      { status: 503 },
    );
  }
}
