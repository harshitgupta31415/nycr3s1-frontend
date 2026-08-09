import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

const backend = process.env.BACKEND_URL?.replace(/\/$/, "");
const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);
const clerkAuthRequired = process.env.NEXT_PUBLIC_CLERK_AUTH_REQUIRED === "true";
type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, context: RouteContext) {
  if (!backend) {
    return Response.json(
      { error: { code: "BACKEND_NOT_CONFIGURED", message: "BACKEND_URL is not configured for this deployment." } },
      { status: 503 },
    );
  }
  let token: string | null = null;
  if (clerkConfigured) {
    const session = await auth();
    if (session.isAuthenticated) {
      token = await session.getToken();
      if (!token) {
        return Response.json(
          { error: { code: "AUTHENTICATION_REQUIRED", message: "Your Clerk session token is unavailable." } },
          { status: 401, headers: { "www-authenticate": "Bearer" } },
        );
      }
    } else if (clerkAuthRequired) {
      return Response.json(
        { error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in to use dbsentinal." } },
        { status: 401, headers: { "www-authenticate": "Bearer" } },
      );
    }
  } else if (clerkAuthRequired) {
    return Response.json(
      { error: { code: "AUTHENTICATION_UNAVAILABLE", message: "Authentication is required but not configured." } },
      { status: 503 },
    );
  }

  const { path } = await context.params;
  const target = `${backend}/api/v1/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  const headers = new Headers({ accept: request.headers.get("accept") ?? "application/json" });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  if (token) headers.set("authorization", `Bearer ${token}`);
  const body = ["GET", "HEAD"].includes(request.method) ? undefined : request.body;
  const requestInit: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(120_000),
  };
  if (body) requestInit.duplex = "half";
  const response = await fetch(target, requestInit);
  const responseHeaders = new Headers({
    "content-type": response.headers.get("content-type") ?? "application/json",
  });
  if (request.nextUrl.searchParams.get("download") === "1") {
    const analysisId = path[1]?.replace(/[^a-zA-Z0-9-]/g, "") || "report";
    responseHeaders.set(
      "content-disposition",
      `attachment; filename="dbsentinal-${analysisId}.json"`,
    );
  }
  const authenticate = response.headers.get("www-authenticate");
  if (authenticate) responseHeaders.set("www-authenticate", authenticate);
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) responseHeaders.set("retry-after", retryAfter);
  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

export const dynamic = "force-dynamic";
export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;

