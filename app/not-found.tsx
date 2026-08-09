import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100svh", display: "grid", alignContent: "center", gap: 18, maxWidth: 720, margin: "0 auto", padding: 32 }}>
      <p style={{ margin: 0, color: "#36f1ff", font: "700 12px ui-monospace, monospace", letterSpacing: ".12em" }}>404 / ROUTE NOT FOUND</p>
      <h1 style={{ margin: 0, fontSize: "clamp(40px, 8vw, 76px)", lineHeight: 1 }}>This evidence route does not exist.</h1>
      <p style={{ margin: 0, color: "#aab4c3", fontSize: 16, lineHeight: 1.7 }}>Return to dbsentinal to start or inspect a migration analysis.</p>
      <Link href="/" style={{ width: "max-content", minHeight: 44, display: "inline-flex", alignItems: "center", padding: "0 20px", borderRadius: 999, color: "#020408", background: "#36f1ff", fontWeight: 800, textDecoration: "none" }}>Return home</Link>
    </main>
  );
}

