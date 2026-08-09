"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  Blocks,
  Bot,
  Braces,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Code2,
  Database,
  Download,
  FileArchive,
  Fingerprint,
  GitBranch,
  Layers3,
  LockKeyhole,
  Menu,
  Play,
  RotateCcw,
  ServerCog,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast, Toaster } from "sonner";

import { Button } from "@/components/ui/button";
import { HeroEmblem } from "./components/intro-scene";
import SchemaChat from "./components/schema-chat";

const MigrationFlow = dynamic(() => import("./components/migration-flow"), {
  ssr: false,
  loading: () => <VisualLoader label="Loading migration graph" />,
});
const SqlPreview = dynamic(() => import("./components/sql-preview"), {
  ssr: false,
  loading: () => <VisualLoader label="Loading secure SQL preview" />,
});

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
  auth_mode?: string;
  manifest: { archive_sha256: string; archive_byte_count: number; has_seed: boolean; fixture_source?: string; legacy_query_source?: string; legacy_query_count: number; migrations: Array<{ folder: string; sha256: string; statement_count: number; candidate: boolean }> };
};

type SavedWorkspace = {
  analysis: Analysis | null;
  timeline: TimelineEvent[];
  plan: Plan | null;
  verification: Verification | null;
  mode: "none" | "sample" | "upload";
};

const workspaceStorageKey = "dbsentinal:active-workspace:v1";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const clerkAuthRequired = process.env.NEXT_PUBLIC_CLERK_AUTH_REQUIRED === "true";

const navigation = [
  ["Product", "/product"],
  ["Simulation", "/simulation"],
  ["Architecture", "/architecture"],
  ["Reports", "/reports"],
  ["Live demo", "#product"],
];

const riskFamilies = [
  { id: "data-loss", categories: ["DESTRUCTIVE_DATA_LOSS", "TYPE_CHANGE_DATA_LOSS"], icon: TriangleAlert, label: "Data loss", value: "Destructive DDL", tone: "rose", detail: "Drops, rewrites, narrowing casts, and irreversible rollback paths." },
  { id: "integrity", categories: ["CONSTRAINT_EXISTING_DATA"], icon: Fingerprint, label: "Integrity", value: "Constraint conflicts", tone: "amber", detail: "Existing rows that violate NOT NULL, UNIQUE, or foreign-key changes." },
  { id: "compatibility", categories: ["BACKWARD_INCOMPATIBILITY"], icon: GitBranch, label: "Compatibility", value: "Legacy query replay", tone: "violet", detail: "Old application shapes executed against the post-migration schema." },
  { id: "recovery", categories: ["LOCK_RISK_HEURISTIC"], icon: RotateCcw, label: "Recovery", value: "Retry + idempotency", tone: "cyan", detail: "Interrupted execution, remaining state, retry behavior, and repair class." },
];

const deploymentPhases = [
  { name: "Expand", detail: "Add compatible schema", icon: Layers3 },
  { name: "Deploy", detail: "Dual-read/write app", icon: UploadCloud },
  { name: "Backfill", detail: "Bounded data repair", icon: Database },
  { name: "Verify", detail: "Replay + assert", icon: ShieldCheck },
  { name: "Contract", detail: "Remove old shape", icon: CheckCircle2 },
];

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
  return clerkEnabled ? <ClerkHome /> : <RollbackReadyExperience canUseProduct isSignedIn={false} clerkEnabled={false} />;
}

function ClerkHome() {
  const { isSignedIn } = useAuth();
  const signedIn = Boolean(isSignedIn);
  return <RollbackReadyExperience canUseProduct={signedIn || !clerkAuthRequired} isSignedIn={signedIn} clerkEnabled />;
}

function RollbackReadyExperience({ canUseProduct, isSignedIn, clerkEnabled: hasClerk }: { canUseProduct: boolean; isSignedIn: boolean; clerkEnabled: boolean }) {
  const rootRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [candidate, setCandidate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeRiskFamily, setActiveRiskFamily] = useState<string | null>(null);
  const [workspaceMode, setWorkspaceMode] = useState<"none" | "sample" | "upload">("none");
  const [backendStatus, setBackendStatus] = useState<"checking" | "ready" | "unavailable">("checking");
  const [backendMessage, setBackendMessage] = useState<string | null>(null);
  const criticalCount = useMemo(() => analysis?.findings.filter((item) => ["CRITICAL", "HIGH"].includes(item.severity)).length ?? 0, [analysis]);
  const shownFindings = useMemo(() => {
    if (!analysis || !activeRiskFamily) return analysis?.findings ?? [];
    const family = riskFamilies.find((item) => item.id === activeRiskFamily);
    return family ? analysis.findings.filter((finding) => family.categories.includes(finding.category)) : analysis.findings;
  }, [activeRiskFamily, analysis]);

  useEffect(() => {
    let restoreFrame = 0;
    try {
      const saved = window.sessionStorage.getItem(workspaceStorageKey);
      if (!saved) return;
      const workspace = JSON.parse(saved) as SavedWorkspace;
      restoreFrame = window.requestAnimationFrame(() => {
        setAnalysis(workspace.analysis);
        setTimeline(workspace.timeline ?? []);
        setPlan(workspace.plan);
        setVerification(workspace.verification);
        setWorkspaceMode(workspace.mode ?? "none");
      });
    } catch {
      window.sessionStorage.removeItem(workspaceStorageKey);
    }
    return () => window.cancelAnimationFrame(restoreFrame);
  }, []);

  useEffect(() => {
    if (!analysis) return;
    const workspace: SavedWorkspace = { analysis, timeline, plan, verification, mode: workspaceMode };
    window.sessionStorage.setItem(workspaceStorageKey, JSON.stringify(workspace));
  }, [analysis, timeline, plan, verification, workspaceMode]);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/rollbackready-status", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        if (!response.ok) throw new Error(body?.message ?? "The analysis backend is unavailable.");
        setBackendStatus("ready");
        setBackendMessage(null);
      })
      .catch((caught) => {
        if (controller.signal.aborted) return;
        setBackendStatus("unavailable");
        setBackendMessage(caught instanceof Error ? caught.message : "The analysis backend is unavailable.");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (reducedMotion || !rootRef.current) return;
    let cancelled = false;
    let cleanup = () => {};

    async function setupMotion() {
      const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("lenis"),
      ]);
      if (cancelled || !rootRef.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 0.9 });
      const updateScrollTrigger = () => ScrollTrigger.update();
      lenis.on("scroll", updateScrollTrigger);
      let frame = 0;
      const raf = (time: number) => {
        lenis.raf(time);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
      const context = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("[data-gsap-reveal]").forEach((element) => {
          gsap.fromTo(element, { y: 34, opacity: 0 }, {
            y: 0,
            opacity: 1,
            duration: 0.78,
            ease: "power3.out",
            scrollTrigger: { trigger: element, start: "top 88%", once: true },
          });
        });
      }, rootRef);
      ScrollTrigger.refresh();
      cleanup = () => {
        cancelAnimationFrame(frame);
        lenis.off("scroll", updateScrollTrigger);
        lenis.destroy();
        context.revert();
      };
      if (cancelled) cleanup();
    }

    void setupMotion();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [reducedMotion]);

  function moveTo(id: string) {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  }

  function selectProjectFile(selected: File | null) {
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".zip")) {
      setFile(null);
      setError("Project bundles must be uploaded as a ZIP archive.");
      return;
    }
    setError(null);
    setFile(selected);
  }

  function resetWorkspace() {
    setAnalysis(null);
    setTimeline([]);
    setPlan(null);
    setVerification(null);
    setActiveRiskFamily(null);
    setWorkspaceMode("none");
    window.sessionStorage.removeItem(workspaceStorageKey);
    toast.success("Workspace cleared");
    moveTo("product");
  }

  async function stageAndRun(form: FormData, mode: "sample" | "upload") {
    if (!canUseProduct) { setError("Sign in to run an analysis."); return; }
    if (backendStatus !== "ready") { setError("The analysis backend is not ready. Try again after connectivity is restored."); return; }
    const toastId = toast.loading("Staging the migration evidence bundle...");
    setBusy("Staging project bundle"); setError(null); setPlan(null); setVerification(null);
    try {
      const staged = await api<Analysis>("/analyses", { method: "POST", body: form });
      setWorkspaceMode(mode);
      setAnalysis(staged); setBusy("Running deterministic PostgreSQL evidence pipeline");
      toast.loading("Breaking the migration at every supported boundary...", { id: toastId });
      const completed = await api<Analysis>(`/analyses/${staged.id}/run`, { method: "POST" });
      setAnalysis(completed); setTimeline(await api<TimelineEvent[]>(`/analyses/${staged.id}/timeline`));
      toast.success("Evidence run complete", { id: toastId, description: completed.verdict.replaceAll("_", " ") });
      moveTo("risks");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Analysis failed.";
      setError(message); toast.error("Analysis stopped", { id: toastId, description: message });
    } finally { setBusy(null); }
  }

  async function runDemo() { const form = new FormData(); form.set("use_demo", "true"); await stageAndRun(form, "sample"); }
  async function uploadProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !candidate.trim()) { setError("Choose a ZIP bundle and enter the candidate migration folder."); return; }
    const form = new FormData(); form.set("project_bundle", file); form.set("candidate_migration", candidate.trim()); await stageAndRun(form, "upload");
  }
  async function generatePlan() {
    if (!canUseProduct) { setError("Sign in to generate a recovery plan."); return; }
    if (!analysis) return;
    const toastId = toast.loading("Generating a constrained recovery plan...");
    setBusy("Running LangGraph recovery planner"); setError(null);
    try {
      const generated = await api<Plan>(`/analyses/${analysis.id}/plans`, { method: "POST" }); setPlan(generated);
      setAnalysis(await api<Analysis>(`/analyses/${analysis.id}`)); setTimeline(await api<TimelineEvent[]>(`/analyses/${analysis.id}/timeline`));
      toast.success("Recovery plan generated", { id: toastId }); moveTo("recovery");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Plan generation failed.";
      setError(message); toast.error("Planner rejected the request", { id: toastId, description: message });
    } finally { setBusy(null); }
  }
  async function verifyPlan() {
    if (!canUseProduct) { setError("Sign in to verify a recovery plan."); return; }
    if (!analysis || !plan) return;
    const toastId = toast.loading("Replaying the plan from a clean baseline...");
    setBusy("Verifying plan from a clean PostgreSQL baseline"); setError(null);
    try {
      const result = await api<Verification>(`/analyses/${analysis.id}/plans/${plan.id}/verify`, { method: "POST" }); setVerification(result);
      const updated = await api<Analysis>(`/analyses/${analysis.id}`); setAnalysis(updated); setPlan(updated.plans.find((item) => item.id === plan.id) ?? plan);
      setTimeline(await api<TimelineEvent[]>(`/analyses/${analysis.id}/timeline`));
      toast.success("Verification complete", { id: toastId, description: result.verdict.replaceAll("_", " ") }); moveTo("evidence");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Plan verification failed.";
      setError(message); toast.error("Plan verification failed", { id: toastId, description: message });
    } finally { setBusy(null); }
  }
  function downloadReport() {
    if (!canUseProduct) { setError("Sign in to download a report."); return; }
    if (!analysis) return;
    const link = document.createElement("a");
    link.href = `/api/rollbackready/analyses/${analysis.id}/report?download=1`;
    link.download = `rollbackready-${analysis.id}.json`; document.body.append(link); link.click(); link.remove();
    toast.success("Sanitized evidence report downloaded");
  }

  const candidateSql = analysis?.findings.find((finding) => finding.statement_shape)?.statement_shape ?? null;
  const planSql = plan?.phases.flatMap((phase) => phase.sql).join("\n\n") ?? null;
  const planVerified = plan?.state === "VERIFIED_FOR_REVIEW" && verification?.status === "PASS";
  const reportVerdict = verification?.verdict ?? analysis?.verdict ?? "AWAITING_ANALYSIS";
  const reportDimensions: Evidence[] = verification?.dimensions ?? analysis?.evidence ?? [
    {
      key: "no-evidence",
      label: "Evidence status",
      status: "NOT_TESTED",
      source: "NO_ANALYSIS",
      summary: "Run an analysis before treating any migration or recovery claim as evidence.",
    },
  ];
  const retryEvidence = analysis?.evidence.find((item) => item.key === "idempotent_retry");
  const recoveryEvidence = verification?.dimensions.find((item) => item.key === "failure_recovery") ?? analysis?.evidence.find((item) => item.key === "failure_recovery");
  const pipelineState = {
    migrationCount: analysis?.manifest.migrations.length ?? 0,
    candidate: analysis?.candidate_migration ?? null,
    findingCount: analysis?.findings.length ?? 0,
    timelineCount: timeline.length,
    evidenceCount: analysis?.evidence.length ?? 0,
    planState: plan?.state ?? null,
  };
  const generatedPhases = plan?.phases ?? [];
  const operationsDisabled = Boolean(busy) || backendStatus !== "ready";

  return (
    <Tooltip.Provider delayDuration={180}>
      <main ref={rootRef} className="site-shell">
        <a href="#main-content" className="skip-link">Skip to content</a>
        <div className="ambient-orb ambient-orb-one" aria-hidden="true" />
        <div className="ambient-orb ambient-orb-two" aria-hidden="true" />

        <header className="navbar">
          <a href="#top" className="brand" aria-label="dbsentinal home">
            <span className="brand-mark"><RotateCcw size={17} /></span>
            <span>Rollback<span>Ready</span></span>
          </a>
          <nav className={menuOpen ? "nav-links nav-links-open" : "nav-links"} aria-label="Primary navigation">
            {navigation.map(([label, href]) => <Link key={label} href={href} onClick={() => setMenuOpen(false)}>{label}</Link>)}
          </nav>
          <div className="nav-actions">
            <Tooltip.Root>
              <Tooltip.Trigger asChild><span className="live-badge"><i /> PostgreSQL sandbox</span></Tooltip.Trigger>
              <Tooltip.Portal><Tooltip.Content className="tooltip" sideOffset={8}>Disposable execution only. Never production.<Tooltip.Arrow className="tooltip-arrow" /></Tooltip.Content></Tooltip.Portal>
            </Tooltip.Root>
            {hasClerk ? (isSignedIn ? <UserButton /> : <SignInButton mode="modal"><Button size="sm" variant="secondary">Sign in</Button></SignInButton>) : <span className="anonymous-mode">Anonymous demo</span>}
            <button className="menu-button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-label="Toggle navigation"><Menu size={20} /></button>
          </div>
        </header>

        <div id="main-content">
          <section className="hero" id="top">
            <div className="hero-noise" aria-hidden="true" />
            <div className="hero-copy" data-gsap-reveal>
              <div className="eyebrow"><span>Migration intelligence</span><i /> Prisma + PostgreSQL</div>
              <h1>See the failure.<br /><span>Verify the recovery.</span></h1>
              <p className="hero-lede">dbsentinal replays Prisma migration history, injects failures at statement boundaries, checks old application queries, and proves whether a recovery plan actually works.</p>
              <div className="hero-actions">
                <Button size="lg" onClick={runDemo} disabled={operationsDisabled || !canUseProduct}><Play size={16} fill="currentColor" /> Run sample unsafe demo <ArrowRight size={16} /></Button>
                <Button size="lg" variant="secondary" onClick={() => moveTo("product")}>Explore the pipeline <ArrowDown size={16} /></Button>
              </div>
              <div className="hero-proof" aria-label="Product safety boundaries">
                <span><Check size={13} /> Synthetic evidence only</span>
                <span><Check size={13} /> Deterministic verification</span>
                <span><Check size={13} /> No production credentials</span>
              </div>
            </div>
            <HeroEmblem verdict={analysis?.verdict.replaceAll("_", " ") ?? "AWAITING ANALYSIS"} />
          </section>

          <AnimatePresence>
            {busy && <motion.div className="activity-bar" role="status" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}><span className="spinner" />{busy}<i /></motion.div>}
          </AnimatePresence>
          <AnimatePresence>
            {error && <motion.div className="error-banner" role="alert" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><TriangleAlert size={18} /><div><strong>Analysis stopped</strong><span>{error}</span></div><button onClick={() => setError(null)} aria-label="Dismiss error"><X size={18} /></button></motion.div>}
          </AnimatePresence>
          {backendStatus === "unavailable" && <div className="connectivity-banner" role="alert"><ServerCog size={17} /><div><strong>Analysis backend unavailable</strong><span>{backendMessage} Uploads, sample runs, planning, and verification are temporarily disabled.</span></div></div>}
          {workspaceMode === "sample" && <div className="sample-mode-banner"><Sparkles size={15} /><span>Sample mode: all rows, queries, and migration inputs are built-in synthetic judge fixtures.</span></div>}

          <section className="section migration-section" id="product">
            <SectionHeading kicker="01 / Interactive pipeline" title="A migration is more than a SQL file." body="Click through the evidence graph. dbsentinal reconstructs what existed before, tests what changes next, and preserves why a verdict was reached." />
            <div data-gsap-reveal><MigrationFlow state={pipelineState} onNavigate={moveTo} /></div>
            <div className="command-center" data-gsap-reveal>
              <article className="demo-card">
                 <div className="card-label"><Sparkles size={14} /> Explicit sample mode · built-in judge demo</div>
                <h3>The unsafe phone column</h3>
                <code>ALTER TABLE users ADD COLUMN phone TEXT NOT NULL;</code>
                <ul><li>3 existing synthetic users</li><li>Old registration query omits phone</li><li>Constraint fails before compatibility replay</li></ul>
                 {canUseProduct ? <Button onClick={runDemo} disabled={Boolean(busy) || backendStatus !== "ready"}>Run sample failure <ArrowRight size={16} /></Button> : <SignInButton mode="modal"><Button>Sign in to run <ArrowRight size={16} /></Button></SignInButton>}
              </article>
              <form className="upload-card" onSubmit={uploadProject}>
                <div className="card-label"><FileArchive size={14} /> Analyze your project</div>
                <label className="file-drop" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); selectProjectFile(event.dataTransfer.files?.[0] ?? null); }}>
                   <input type="file" accept=".zip,application/zip" disabled={!canUseProduct || backendStatus !== "ready"} onChange={(event) => selectProjectFile(event.target.files?.[0] ?? null)} />
                  <UploadCloud size={25} />
                  <strong>{file?.name ?? "Drop a project bundle"}</strong>
                  <small>ZIP · complete migrations · synthetic fixtures · 10 MiB max</small>
                </label>
                 <label className="field-label">Candidate migration folder<input value={candidate} disabled={!canUseProduct || backendStatus !== "ready"} onChange={(event) => setCandidate(event.target.value)} placeholder="20260809100000_add_phone" /></label>
                 <Button type="submit" variant="secondary" disabled={operationsDisabled || !canUseProduct}>Validate and analyze <ArrowRight size={16} /></Button>
              </form>
            </div>
          </section>

          <section className="section problem-section" id="problem">
            <SectionHeading kicker="02 / The production gap" title="“Migration passed” is not the same as “production survives.”" body="Deployment tools can apply SQL successfully and still leave old clients broken, rows invalid, locks contested, or retries unsafe." />
            <div className="problem-grid">
              {[
                ["01", "Deploy checks syntax", "Production contains the rows, query shapes, and timing your empty test database does not."],
                ["02", "Rollback can lose data", "Schema reversal does not restore values deleted or rewritten by the forward migration."],
                ["03", "Retries change state", "An interrupted multi-statement migration can leave the next attempt facing a different database."],
              ].map(([number, title, body]) => <motion.article key={number} data-gsap-reveal whileHover={reducedMotion ? undefined : { y: -5 }}><span>{number}</span><h3>{title}</h3><p>{body}</p><div className="problem-scan" /></motion.article>)}
            </div>
          </section>

          <section className="section" id="risks">
            <SectionHeading kicker="03 / Risk detection" title="Four deterministic lenses. One explainable result." body="Every finding retains the statement shape, evidence source, affected object, and a safer direction. AI is never the risk classifier." />
            <div className="risk-grid">
              {riskFamilies.map(({ id, categories, icon: Icon, label, value, tone: color, detail }, index) => {
                const count = analysis?.findings.filter((finding) => categories.includes(finding.category)).length ?? 0;
                const active = activeRiskFamily === id;
                return (
                  <motion.button key={label} type="button" className={`risk-card risk-${color}${active ? " risk-card-active" : ""}`} data-gsap-reveal whileHover={reducedMotion ? undefined : { scale: 1.012 }} onClick={() => setActiveRiskFamily(active ? null : id)} aria-pressed={active}>
                    <div><span>{String(index + 1).padStart(2, "0")}</span><Icon size={18} /></div><small>{label}</small><h3>{value}</h3><p>{detail}</p><b>{analysis ? `${count} FINDING${count === 1 ? "" : "S"}` : "RULE FAMILY"}</b>
                  </motion.button>
                );
              })}
            </div>
            <div className="live-results" data-gsap-reveal>
              <div className="result-summary"><span>Current candidate</span><strong className={tone(analysis?.verdict ?? "NOT_TESTED")}>{(analysis?.verdict ?? "AWAITING_ANALYSIS").replaceAll("_", " ")}</strong><div><Metric label="High / critical" value={analysis ? String(criticalCount) : "—"} /><Metric label="Evidence" value={analysis?.evidence_level.replaceAll("_", " ") ?? "NOT TESTED"} /></div></div>
              <div className="finding-stack">
                {!analysis ? (
                  <article><span className="severity warn">NOT TESTED</span><div><small>NO ANALYSIS</small><strong>No candidate evidence yet</strong><p>Run the built-in demo or upload a project bundle. Illustrative findings are not presented as live results.</p></div></article>
                ) : shownFindings.length ? shownFindings.slice(0, 6).map((finding) => (
                  <article key={finding.id}><span className={`severity ${tone(finding.severity)}`}>{finding.severity}</span><div><small>{finding.category.replaceAll("_", " ")}</small><strong>{finding.affected_object ?? "Migration contract"}</strong><p>{finding.reason}</p></div><ChevronRight size={18} /></article>
                )) : (
                  <article><span className="severity good">NONE</span><div><small>{activeRiskFamily ? "FILTER COMPLETE" : "ANALYSIS COMPLETE"}</small><strong>No deterministic findings{activeRiskFamily ? " in this family" : ""}</strong><p>{activeRiskFamily ? "Select the active card again to show every finding." : "Review the independent evidence dimensions and limitations before drawing a conclusion."}</p></div></article>
                )}
              </div>
              {analysis && <button type="button" className="workspace-reset" onClick={resetWorkspace}><RotateCcw size={14} /> Clear analysis workspace</button>}
            </div>
          </section>

          <section className="section simulation-section" id="simulation">
            <SectionHeading kicker="04 / Failure injection" title="Break it on purpose. Inspect what remains." body="dbsentinal stops after supported statement boundaries, records committed state, attempts retry or recovery, and distinguishes transaction rollback from partial execution." />
            <div className="simulation-layout" data-gsap-reveal>
              <div className="timeline-panel">
                <div className="panel-head"><div><Activity size={16} /><span>Execution timeline</span></div><small>{timeline.length ? "LIVE RESULT" : "NOT RUN"}</small></div>
                <ol className="timeline-list">
                  {timeline.length ? timeline.slice(0, 8).map((event, index) => <li key={`${event.sequence}-${event.event_type}`}><span className={`timeline-node ${tone(event.status)}`}><i /></span><div><small>{String(event.sequence).padStart(2, "0")} · {event.event_type.replaceAll("_", " ")}</small><strong>{event.message}</strong></div><b className={tone(event.status)}>{event.status.replaceAll("_", " ")}</b>{!reducedMotion && <motion.i className="timeline-progress" initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ delay: index * 0.08, duration: 0.45 }} />}</li>) : <li className="timeline-empty"><Activity size={20} /><div><strong>No simulation events yet</strong><small>Run the sample or analyze a ZIP to populate this timeline from the backend.</small></div><Button size="sm" onClick={runDemo} disabled={operationsDisabled || !canUseProduct}>Run sample</Button></li>}
                </ol>
              </div>
              <div className="simulation-stats">
                <Stat icon={Clock3} label="Events recorded" value={String(timeline.length)} />
                <Stat icon={RotateCcw} label="Retry result" value={retryEvidence?.status.replaceAll("_", " ") ?? "NOT TESTED"} />
                <Stat icon={Database} label="Production data" value="Never touched" />
                <div className="state-machine"><span className={analysis ? "active" : ""}>BASELINE</span><i /><span className={timeline.some((event) => event.event_type.includes("INTERRUPT") || event.status === "FAIL") ? "active" : ""}>INTERRUPTED</span><i /><span className={recoveryEvidence?.status === "PASS" ? "active" : ""}>RECOVERED</span></div>
              </div>
            </div>
          </section>

          <section className="section recovery-section" id="recovery">
            <SectionHeading kicker="05 / AI recovery plan" title="AI proposes the plan. PostgreSQL earns the verdict." body="Gemini sees normalized findings and redacted SQL shapes. Structured output is validated, blocked operations are rejected, and every statement is replayed in a fresh sandbox." />
            <div className="recovery-layout" data-gsap-reveal>
              <div className="ai-rail">
                <div className="ai-orb"><Bot size={28} /><i /></div>
                <span>LangGraph recovery planner</span><strong>{plan?.strategy ?? "No plan generated"}</strong><p>{plan?.summary ?? (analysis ? "Generate a plan from this analysis's normalized findings." : "Run an analysis first. The planner will use its normalized findings, not a hardcoded recovery script.")}</p>
                <div className="ai-boundaries"><span><LockKeyhole size={14} /> No fixture values</span><span><Braces size={14} /> Pydantic validated</span><span><ServerCog size={14} /> Fresh sandbox replay</span></div>
                {canUseProduct ? <Button onClick={generatePlan} disabled={!analysis || !analysis.findings.length || operationsDisabled}>{plan ? "Regenerate plan" : "Generate safer plan"}<Sparkles size={16} /></Button> : <SignInButton mode="modal"><Button>Sign in to generate</Button></SignInButton>}
              </div>
              <SqlPreview candidateSql={candidateSql} planSql={planSql} verified={planVerified} />
            </div>
            {plan && <div className="generated-plan" data-gsap-reveal><div><span>Generated phases</span><strong>{plan.state.replaceAll("_", " ")}</strong></div><div>{plan.phases.map((phase, index) => <article key={phase.name}><span>{String(index + 1).padStart(2, "0")}</span><h4>{phase.name}</h4><p>{phase.objective}</p>{phase.sql.slice(0, 1).map((sql) => <code key={sql}>{sql}</code>)}<details><summary>Review complete phase</summary><strong>SQL</strong>{phase.sql.map((sql) => <code key={sql}>{sql}</code>)}<strong>Application changes</strong><ul>{phase.application_changes.map((change) => <li key={change}>{change}</li>)}</ul><strong>Verification SQL</strong>{phase.verification_sql.map((sql) => <code key={sql}>{sql}</code>)}<strong>Rollback guidance</strong><p>{phase.rollback_guidance}</p></details></article>)}</div><details><summary>Review plan assumptions and limitations</summary><strong>Assumptions</strong><ul>{plan.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul><strong>Limitations</strong><ul>{plan.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul></details><Button onClick={verifyPlan} disabled={operationsDisabled || plan.state === "VERIFIED_FOR_REVIEW"}>Verify from a clean baseline <ShieldCheck size={16} /></Button></div>}
            <SchemaChat key={analysis?.id ?? "no-analysis"} analysisId={analysis?.id ?? null} disabled={backendStatus !== "ready"} />
          </section>

          <section className="section deployment-section" id="deployment">
            <SectionHeading kicker="06 / Safer execution" title="Expand → Deploy → Backfill → Verify → Contract" body="The recovery plan becomes an ordered release protocol with explicit application changes, verification gates, and rollback guidance." />
            {generatedPhases.length ? <div className="phase-track" data-gsap-reveal>
              {generatedPhases.map((phase, index) => { const Icon = deploymentPhases[index % deploymentPhases.length].icon; return <motion.article key={`${index}-${phase.name}`} whileHover={reducedMotion ? undefined : { y: -4 }}><div><Icon size={18} /><span>{String(index + 1).padStart(2, "0")}</span></div><h3>{phase.name}</h3><p>{phase.objective}</p>{index < generatedPhases.length - 1 && <i className="phase-connector"><ChevronRight size={15} /></i>}</motion.article>; })}
            </div> : <div className="dynamic-empty" data-gsap-reveal><Layers3 size={24} /><div><strong>No generated deployment phases</strong><p>Run an analysis and generate a recovery plan. Its actual phases will appear here.</p></div><Button variant="secondary" onClick={() => analysis?.findings.length ? generatePlan() : moveTo("product")} disabled={operationsDisabled}>{analysis?.findings.length ? "Generate plan" : "Choose an analysis"}<ArrowRight size={15} /></Button></div>}
          </section>

          <section className="section evidence-section" id="evidence">
            <SectionHeading kicker="07 / Evidence report" title="A scoped answer your team can inspect." body="Every safety dimension is independent: pass, fail, or not tested. A verified verdict is impossible without a successful clean-baseline execution." />
            <div className="report-card" data-gsap-reveal>
              <div className="report-top"><div><span>dbsentinal / {analysis ? "EVIDENCE REPORT" : "AWAITING ANALYSIS"}</span><h3 className={tone(reportVerdict)}>{reportVerdict.replaceAll("_", " ")}</h3><p>Scoped to synthetic evidence · Human review required</p></div><div className="report-seal"><ShieldCheck size={29} /><span>{planVerified ? <>Plan evidence<br />verified</> : analysis ? <>Analysis evidence<br />available</> : <>No evidence<br />yet</>}</span></div></div>
              <div className="evidence-grid">
                {reportDimensions.map((item) => <article key={item.key}><StatusIcon status={item.status} /><div><span>{item.label}</span><strong>{item.status.replaceAll("_", " ")}</strong><p>{item.summary}</p><small>{item.source.replaceAll("_", " ")}</small></div></article>)}
              </div>
              <div className="report-actions"><p><LockKeyhole size={14} /> Raw uploads expire after the analysis lifecycle.</p>{analysis ? <Button variant="secondary" onClick={downloadReport}><Download size={15} /> Download JSON report</Button> : <Button variant="secondary" onClick={runDemo} disabled={operationsDisabled || !canUseProduct}>Create sample evidence <Play size={15} /></Button>}</div>
            </div>
          </section>

          <section className="section architecture-section" id="architecture">
            <SectionHeading kicker="08 / Technical architecture" title="Isolated by design. Explainable by default." body="The UI orchestrates a deterministic evidence pipeline; AI is confined to recovery-plan generation and never assigns risk or verdicts." />
            <div className="architecture-map" data-gsap-reveal>
              <ArchitectureNode icon={Code2} label="Next.js" detail="Upload + evidence UI" />
              <ArchitectureArrow label="SANITIZED BUNDLE" />
              <ArchitectureNode icon={Blocks} label="FastAPI" detail="Rules + orchestration" accent />
              <ArchitectureArrow label="UNIX SOCKET" />
              <ArchitectureNode icon={Database} label="PostgreSQL 18" detail="Disposable sandbox" />
              <div className="architecture-branch"><i /><ArchitectureNode icon={Bot} label="Gemini" detail="Recovery plans only" /></div>
            </div>
            <div className="architecture-principles">
              <span><ShieldCheck size={16} /> Non-superuser migration role</span><span><Zap size={16} /> Runtime and statement limits</span><span><Fingerprint size={16} /> Hashes, not raw artifacts</span><span><LockKeyhole size={16} /> Zero production connections</span>
            </div>
          </section>

          <section className="cta-section" id="cta" data-gsap-reveal>
            <div className="cta-grid" aria-hidden="true" />
            <div><span>BREAK IT BEFORE PRODUCTION DOES.</span><h2>Turn migration confidence<br />into recovery evidence.</h2><p>Run the unsafe phone-column demo in under five minutes.</p></div>
            <div className="cta-actions"><Button size="lg" onClick={runDemo} disabled={operationsDisabled || !canUseProduct}><Play size={16} fill="currentColor" /> Run sample demo</Button><Link href="/architecture" className="text-link">Review architecture <ArrowRight size={15} /></Link></div>
          </section>
        </div>

        <footer className="footer">
          <div><a href="#top" className="brand"><span className="brand-mark"><RotateCcw size={16} /></span><span>Rollback<span>Ready</span></span></a><p>Migration recovery evidence for Prisma teams.</p></div>
          <div className="footer-links"><Link href="/product">Product</Link><Link href="/simulation">Simulation</Link><Link href="/architecture">Architecture</Link><Link href="/reports">Reports</Link><a href="https://github.com/harshitgupta31415" target="_blank" rel="noreferrer"><Code2 size={14} /> GitHub</a></div>
          <div className="footer-meta"><span>NYC R3S1 / HACKATHON MVP</span><span>PostgreSQL only · Reports expire in 24h</span></div>
        </footer>
        <Toaster theme="dark" richColors position="bottom-right" closeButton />
      </main>
    </Tooltip.Provider>
  );
}

function SectionHeading({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return <div className="section-heading" data-gsap-reveal><span>{kicker}</span><div><h2>{title}</h2><p>{body}</p></div></div>;
}
function VisualLoader({ label }: { label: string }) { return <div className="visual-loader" role="status"><span className="spinner" />{label}</div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="metric"><span>{label}</span><strong>{value}</strong></div>; }
function Stat({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) { return <article><Icon size={17} /><span>{label}</span><strong>{value}</strong></article>; }
function StatusIcon({ status }: { status: EvidenceStatus }) { return <span className={`status-icon ${tone(status)}`}>{status === "PASS" ? <Check size={17} /> : status === "FAIL" ? <X size={17} /> : <CircleDot size={17} />}</span>; }
function ArchitectureNode({ icon: Icon, label, detail, accent = false }: { icon: typeof Code2; label: string; detail: string; accent?: boolean }) { return <article className={accent ? "architecture-node architecture-node-accent" : "architecture-node"}><Icon size={20} /><div><strong>{label}</strong><span>{detail}</span></div></article>; }
function ArchitectureArrow({ label }: { label: string }) { return <div className="architecture-arrow"><span>{label}</span><i /><ArrowRight size={15} /></div>; }
function tone(value: string) { const key = value.toUpperCase(); if (["PASS", "VERIFIED", "VERIFIED_FOR_REVIEW", "VERIFIED_PLAN"].includes(key)) return "good"; if (["FAIL", "UNSAFE", "ERROR", "CRITICAL", "HIGH", "REJECTED"].includes(key)) return "bad"; if (["MEDIUM", "CONDITIONAL", "CONDITIONALLY_VERIFIED", "RUNNING"].includes(key)) return "warn"; return "muted"; }
