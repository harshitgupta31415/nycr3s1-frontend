"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { FormEvent, useMemo, useState } from "react";

type EvidenceStatus = "PASS" | "FAIL" | "NOT_TESTED";
type Finding = { id: string; severity: string; category: string; statement_index: number | null; statement_shape: string | null; affected_object: string | null; reason: string; evidence_source: string; remediation_hint: string; confirmed: boolean };
type Evidence = { key: string; label: string; status: EvidenceStatus; source: string; summary: string };
type TimelineEvent = { sequence: number; occurred_at: string; event_type: string; status: string; message: string; statement_index: number | null };
type PlanPhase = { name: string; objective: string; sql: string[]; application_changes: string[]; verification_sql: string[]; rollback_guidance: string };
type Plan = { id: string; state: string; provider: string; model: string; strategy: string; summary: string; assumptions: string[]; phases: PlanPhase[]; limitations: string[] };
type Verification = { id: string; status: EvidenceStatus; verdict: string; dimensions: Evidence[] };
type Analysis = {
  id: string; status: string; evidence_level: string; verdict: string; provider: string | null; candidate_migration: string;
  findings: Finding[]; evidence: Evidence[]; limitations: string[]; plans: Plan[];
  manifest: { archive_sha256: string; archive_byte_count: number; has_seed: boolean; legacy_query_count: number; migrations: Array<{ folder: string; sha256: string; statement_count: number; candidate: boolean }> };
};

const steps = ["Upload", "Schema", "Risk", "Timeline", "Safer plan", "Evidence"];
const anchors = ["upload", "schema", "risk", "timeline", "plan", "evidence"];
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const clerkAuthRequired = process.env.NEXT_PUBLIC_CLERK_AUTH_REQUIRED === "true";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/rollbackready${path}`, init);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? `Request failed with ${response.status}.`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export default function Home() {
  return clerkEnabled ? <ClerkHome/> : <RollbackReadyExperience canUseProduct isSignedIn={false} clerkEnabled={false}/>;
}

function ClerkHome() {
  const { isSignedIn } = useAuth();
  const signedIn = Boolean(isSignedIn);
  return <RollbackReadyExperience canUseProduct={signedIn || !clerkAuthRequired} isSignedIn={signedIn} clerkEnabled/>;
}

function RollbackReadyExperience({ canUseProduct, isSignedIn, clerkEnabled: hasClerk }: { canUseProduct: boolean; isSignedIn: boolean; clerkEnabled: boolean }) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [candidate, setCandidate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const criticalCount = useMemo(() => analysis?.findings.filter((item) => ["CRITICAL", "HIGH"].includes(item.severity)).length ?? 0, [analysis]);

  async function stageAndRun(form: FormData) {
    if (!canUseProduct) { setError("Sign in to run an analysis."); return; }
    setBusy("Staging project bundle"); setError(null); setPlan(null); setVerification(null);
    try {
      const staged = await api<Analysis>("/analyses", { method: "POST", body: form });
      setAnalysis(staged); setBusy("Running deterministic PostgreSQL evidence pipeline");
      const completed = await api<Analysis>(`/analyses/${staged.id}/run`, { method: "POST" });
      setAnalysis(completed); setTimeline(await api<TimelineEvent[]>(`/analyses/${staged.id}/timeline`));
      document.querySelector("#risk")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Analysis failed."); }
    finally { setBusy(null); }
  }

  async function runDemo() { const form = new FormData(); form.set("use_demo", "true"); await stageAndRun(form); }
  async function uploadProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !candidate.trim()) { setError("Choose a ZIP bundle and enter the candidate migration folder."); return; }
    const form = new FormData(); form.set("project_bundle", file); form.set("candidate_migration", candidate.trim()); await stageAndRun(form);
  }
  async function generatePlan() {
    if (!canUseProduct) { setError("Sign in to generate a recovery plan."); return; }
    if (!analysis) return; setBusy("Running LangGraph recovery planner"); setError(null);
    try {
      const generated = await api<Plan>(`/analyses/${analysis.id}/plans`, { method: "POST" }); setPlan(generated);
      setAnalysis(await api<Analysis>(`/analyses/${analysis.id}`)); setTimeline(await api<TimelineEvent[]>(`/analyses/${analysis.id}/timeline`));
      document.querySelector("#plan")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Plan generation failed."); }
    finally { setBusy(null); }
  }
  async function verifyPlan() {
    if (!canUseProduct) { setError("Sign in to verify a recovery plan."); return; }
    if (!analysis || !plan) return; setBusy("Verifying plan from a clean PostgreSQL baseline"); setError(null);
    try {
      const result = await api<Verification>(`/analyses/${analysis.id}/plans/${plan.id}/verify`, { method: "POST" }); setVerification(result);
      const updated = await api<Analysis>(`/analyses/${analysis.id}`); setAnalysis(updated); setPlan(updated.plans.find((item) => item.id === plan.id) ?? plan);
      setTimeline(await api<TimelineEvent[]>(`/analyses/${analysis.id}/timeline`)); document.querySelector("#evidence")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Plan verification failed."); }
    finally { setBusy(null); }
  }
  function downloadReport() {
    if (!canUseProduct) { setError("Sign in to download a report."); return; }
    if (!analysis) return;
    const link = document.createElement("a");
    link.href = `/api/rollbackready/analyses/${analysis.id}/report?download=1`;
    link.download = `rollbackready-${analysis.id}.json`;
    document.body.append(link);
    link.click();
    link.remove();
  }

  return <main>
    <header className="topbar"><a href="#top" className="brand"><span className="brand-mark">RR</span><span>RollbackReady</span></a><div className="topbar-actions"><div className="safety-promise"><span>◆</span> Verified for human review</div>{hasClerk ? (isSignedIn ? <UserButton/> : <SignInButton mode="modal"><button className="auth-button">Sign in</button></SignInButton>) : <span className="auth-mode">Anonymous demo</span>}</div></header>
    <section className="hero" id="top"><p className="eyebrow">PRISMA MIGRATION SAFETY AGENT / POSTGRESQL 18</p><div className="hero-grid"><div><h1>Know how it fails.<br/><em>Before production does.</em></h1><p className="lede">Replay the complete migration history, test production-shaped fixtures, break execution at every boundary, and verify a recovery path with evidence—not confidence.</p></div><aside className="promise-card"><span className="card-index">SAFETY PROMISE</span><strong>Never “safe to deploy.”</strong><p>Every verdict is scoped to uploaded synthetic evidence and requires human review.</p></aside></div></section>
    <nav className="stepper" aria-label="Analysis stages">{steps.map((step, index) => <a key={step} href={`#${anchors[index]}`}><span>{String(index + 1).padStart(2, "0")}</span>{step}</a>)}</nav>
    {busy && <div className="activity" role="status"><span className="spinner"/>{busy}</div>}
    {error && <div className="error-banner" role="alert"><strong>Analysis stopped</strong><span>{error}</span><button onClick={() => setError(null)} aria-label="Dismiss error">×</button></div>}

    <section className="stage" id="upload"><StageHeading number="01" label="Upload" title="Choose your evidence source"/><div className="upload-grid">
      <article className="demo-card"><div><span className="pill">BUILT-IN JUDGE DEMO</span><h3>The unsafe phone column</h3></div><pre><code>ALTER TABLE users{`\n`}ADD COLUMN phone TEXT NOT NULL;</code></pre><ul><li>3 existing synthetic users</li><li>Old registration query omits phone</li><li>Constraint fails before compatibility replay</li></ul>{canUseProduct ? <button className="primary-button" onClick={runDemo} disabled={Boolean(busy)}>Run unsafe demo <span>→</span></button> : <SignInButton mode="modal"><button className="primary-button">Sign in to run demo <span>→</span></button></SignInButton>}</article>
      <form className="upload-card" onSubmit={uploadProject}><span className="pill neutral">YOUR PRISMA PROJECT</span><label className="file-zone"><input type="file" accept=".zip,application/zip" disabled={!canUseProduct} onChange={(event) => setFile(event.target.files?.[0] ?? null)}/><span className="upload-icon">↑</span><strong>{file?.name ?? "Select project.zip"}</strong><small>{canUseProduct ? "10 MiB compressed · synthetic data only" : "Sign in before selecting a project"}</small></label><label className="field-label">Candidate migration folder<input value={candidate} disabled={!canUseProduct} onChange={(event) => setCandidate(event.target.value)} placeholder="20260809100000_add_phone"/></label>{canUseProduct ? <button className="secondary-button" type="submit" disabled={Boolean(busy)}>Validate and analyze</button> : <SignInButton mode="modal"><button className="secondary-button" type="button">Sign in to upload</button></SignInButton>}</form>
    </div></section>

    <section className="stage" id="schema"><StageHeading number="02" label="Schema comparison" title="Migration history is the source of truth"/>{!analysis ? <EmptyState text="Run the demo or upload a bundle to reconstruct the pre-candidate schema."/> : <div className="schema-panel"><div className="metric-row"><Metric label="Provider" value={analysis.provider ?? "Unknown"}/><Metric label="History" value={`${analysis.manifest.migrations.length} migrations`}/><Metric label="Fixtures" value={analysis.manifest.has_seed ? "Included" : "Missing"}/><Metric label="Legacy queries" value={String(analysis.manifest.legacy_query_count)}/></div><div className="migration-list">{analysis.manifest.migrations.map((migration, index) => <div className={migration.candidate ? "migration candidate" : "migration"} key={migration.folder}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{migration.folder}</strong><small>{migration.statement_count} statement{migration.statement_count === 1 ? "" : "s"} · {migration.sha256.slice(0, 12)}</small></div><b>{migration.candidate ? "CANDIDATE" : "PRIOR"}</b></div>)}</div></div>}</section>

    <section className="stage" id="risk"><StageHeading number="03" label="Risk dashboard" title="Deterministic findings, separated from evidence"/>{!analysis ? <EmptyState text="Risk rules will appear here after archive validation."/> : <><div className="verdict-strip"><div><span>CANDIDATE VERDICT</span><strong className={`verdict ${tone(analysis.verdict)}`}>{analysis.verdict.replaceAll("_", " ")}</strong></div><div><span>HIGH / CRITICAL</span><strong>{criticalCount}</strong></div><div><span>EVIDENCE LEVEL</span><strong>{analysis.evidence_level.replaceAll("_", " ")}</strong></div></div><div className="finding-list">{analysis.findings.length === 0 ? <EmptyState text="No deterministic risks matched the candidate SQL."/> : analysis.findings.map((finding) => <article className="finding" key={finding.id}><div className="finding-meta"><span className={`severity ${tone(finding.severity)}`}>{finding.severity}</span><span>{finding.category.replaceAll("_", " ")}</span><span>STATEMENT {finding.statement_index ?? "—"}</span><span>{finding.evidence_source}</span></div><h3>{finding.affected_object ?? "Migration contract"}</h3><p>{finding.reason}</p>{finding.statement_shape && <pre><code>{finding.statement_shape}</code></pre>}<div className="remediation"><span>SAFER DIRECTION</span>{finding.remediation_hint}</div></article>)}</div></>}</section>

    <section className="stage" id="timeline"><StageHeading number="04" label="Failure timeline" title="What happened at each execution boundary"/>{timeline.length === 0 ? <EmptyState text="Simulation events will appear after the PostgreSQL run."/> : <ol className="timeline">{timeline.map((event) => <li key={event.sequence}><span className={`event-dot ${tone(event.status)}`}/><div className="event-time">{String(event.sequence).padStart(2, "0")}<small>{new Date(event.occurred_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</small></div><div><strong>{event.event_type.replaceAll("_", " ")}</strong><p>{event.message}</p></div><b className={tone(event.status)}>{event.status.replaceAll("_", " ")}</b></li>)}</ol>}</section>

    <section className="stage" id="plan"><StageHeading number="05" label="Safer plan" title="AI proposes. Deterministic systems decide."/>{!plan ? <div className="plan-empty"><p>Only normalized findings and redacted SQL shapes enter the LangGraph planner. No fixture values or raw uploads are sent to Gemini.</p>{canUseProduct ? <button className="primary-button" disabled={!analysis || analysis.findings.length === 0 || Boolean(busy)} onClick={generatePlan}>Generate safer plan <span>→</span></button> : <SignInButton mode="modal"><button className="primary-button">Sign in to generate a plan <span>→</span></button></SignInButton>}</div> : <div className="plan-panel"><div className="plan-heading"><div><span className="pill">{plan.state.replaceAll("_", " ")}</span><h3>{plan.strategy}</h3><p>{plan.summary}</p></div><div className="model-tag"><span>PLANNER</span><strong>{plan.provider}</strong><small>{plan.model}</small></div></div><div className="phase-grid">{plan.phases.map((phase, index) => <article className="phase" key={phase.name}><span className="phase-number">{String(index + 1).padStart(2, "0")}</span><h4>{phase.name}</h4><p>{phase.objective}</p>{phase.sql.map((sql) => <pre key={sql}><code>{sql};</code></pre>)}<div className="rollback"><span>ROLLBACK GUIDANCE</span>{phase.rollback_guidance}</div></article>)}</div>{canUseProduct ? <button className="primary-button verify-button" onClick={verifyPlan} disabled={Boolean(busy) || plan.state === "VERIFIED_FOR_REVIEW"}>Verify from clean baseline <span>→</span></button> : <SignInButton mode="modal"><button className="primary-button verify-button">Sign in to verify <span>→</span></button></SignInButton>}</div>}</section>

    <section className="stage" id="evidence"><StageHeading number="06" label="Evidence report" title="A scoped verdict you can review"/>{!analysis ? <EmptyState text="Evidence dimensions remain empty until an analysis runs."/> : <div className="evidence-panel"><div className="evidence-heading"><div><span>FINAL REPORT</span><h3 className={tone(verification?.verdict ?? analysis.verdict)}>{(verification?.verdict ?? analysis.verdict).replaceAll("_", " ")}</h3><p>Verified for human review; never safe to deploy.</p></div>{canUseProduct ? <button className="secondary-button" onClick={downloadReport}>Download JSON report</button> : <SignInButton mode="modal"><button className="secondary-button">Sign in to download</button></SignInButton>}</div><div className="evidence-grid">{(verification?.dimensions ?? analysis.evidence).map((item) => <article key={item.key}><span className={`evidence-icon ${tone(item.status)}`}>{item.status === "PASS" ? "✓" : item.status === "FAIL" ? "×" : "—"}</span><div><strong>{item.label}</strong><p>{item.summary}</p><small>{item.source.replaceAll("_", " ")}</small></div></article>)}<article><span className="evidence-icon muted">—</span><div><strong>Production execution</strong><p>Never performed. RollbackReady accepts no production connection string.</p><small>OUT OF SCOPE</small></div></article></div></div>}</section>
    <footer><span>RollbackReady / NYC R3S1</span><p>PostgreSQL-only hackathon MVP · Reports expire after 24 hours</p></footer>
  </main>;
}

function StageHeading({ number, label, title }: { number: string; label: string; title: string }) { return <div className="stage-heading"><span>{number}</span><div><p>{label}</p><h2>{title}</h2></div></div>; }
function EmptyState({ text }: { text: string }) { return <div className="empty-state"><span>◇</span><p>{text}</p></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="metric"><span>{label}</span><strong>{value}</strong></div>; }
function tone(value: string) { const key = value.toUpperCase(); if (["PASS", "VERIFIED", "VERIFIED_FOR_REVIEW", "VERIFIED_PLAN"].includes(key)) return "good"; if (["FAIL", "UNSAFE", "ERROR", "CRITICAL", "HIGH", "REJECTED"].includes(key)) return "bad"; if (["MEDIUM", "CONDITIONAL", "CONDITIONALLY_VERIFIED", "RUNNING"].includes(key)) return "warn"; return "muted"; }
