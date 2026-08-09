"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main style={shellStyle}>
      <p style={kickerStyle}>ROLLBACKREADY / RECOVERABLE ERROR</p>
      <h1 style={titleStyle}>The interface stopped before evidence changed.</h1>
      <p style={bodyStyle} role="alert">
        Retry this view. The application does not treat a rendering failure as migration evidence.
        {error.digest ? ` Reference: ${error.digest}` : ""}
      </p>
      <div style={actionsStyle}>
        <button type="button" onClick={() => retry()} style={primaryActionStyle}>Retry view</button>
        <Link href="/" style={secondaryActionStyle}>Return home</Link>
      </div>
    </main>
  );
}

const shellStyle = { minHeight: "100svh", display: "grid", alignContent: "center", gap: 20, maxWidth: 760, margin: "0 auto", padding: 32, color: "#eef2f7", background: "#030305" };
const kickerStyle = { color: "#36f1ff", font: "700 12px ui-monospace, monospace", letterSpacing: ".12em" };
const titleStyle = { margin: 0, fontSize: "clamp(36px, 7vw, 72px)", lineHeight: 1, letterSpacing: "-.05em" };
const bodyStyle = { maxWidth: 640, margin: 0, color: "#aab4c3", fontSize: 16, lineHeight: 1.7 };
const actionsStyle = { display: "flex", flexWrap: "wrap" as const, gap: 12 };
const primaryActionStyle = { minHeight: 44, padding: "0 20px", border: 0, borderRadius: 999, color: "#020408", background: "#36f1ff", fontWeight: 800, cursor: "pointer" };
const secondaryActionStyle = { minHeight: 44, display: "inline-flex", alignItems: "center", padding: "0 20px", border: "1px solid #303744", borderRadius: 999, color: "#eef2f7", textDecoration: "none" };
