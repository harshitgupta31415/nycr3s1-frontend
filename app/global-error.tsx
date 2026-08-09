"use client";

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, color: "#eef2f7", background: "#030305", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ minHeight: "100svh", display: "grid", placeContent: "center", gap: 18, maxWidth: 720, margin: "0 auto", padding: 32 }}>
          <p style={{ margin: 0, color: "#ff617c", font: "700 12px ui-monospace, monospace", letterSpacing: ".12em" }}>ROLLBACKREADY / APPLICATION ERROR</p>
          <h1 style={{ margin: 0, fontSize: "clamp(36px, 7vw, 70px)", lineHeight: 1 }}>The safety interface could not load.</h1>
          <p style={{ margin: 0, color: "#aab4c3", fontSize: 16, lineHeight: 1.7 }}>No deployment verdict can be inferred from this error. Retry the application to restore the evidence view.</p>
          <button type="button" onClick={() => retry()} style={{ width: "max-content", minHeight: 44, padding: "0 20px", border: 0, borderRadius: 999, color: "#020408", background: "#36f1ff", fontWeight: 800, cursor: "pointer" }}>Retry application</button>
        </main>
      </body>
    </html>
  );
}
