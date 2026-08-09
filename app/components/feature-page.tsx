"use client";

import { ArrowLeft, ArrowRight, Check, Code2, Database, GitBranch, Play, RotateCcw, ServerCog, ShieldCheck, Sparkles, TriangleAlert, Zap } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

type FeaturePageProps = {
  eyebrow: string;
  title: string;
  accent: string;
  summary: string;
  metric: string;
  metricLabel: string;
  variant: "product" | "simulation" | "architecture" | "reports";
  stages: Array<{ number: string; title: string; body: string }>;
  signals: Array<{ label: string; value: string; status: string }>;
};

const nav = [
  ["Product", "/product"],
  ["Simulation", "/simulation"],
  ["Architecture", "/architecture"],
  ["Reports", "/reports"],
];

const icons = [Database, GitBranch, ShieldCheck, RotateCcw];

export default function FeaturePage({ eyebrow, title, accent, summary, metric, metricLabel, variant, stages, signals }: FeaturePageProps) {
  const reducedMotion = useReducedMotion();
  return (
    <main className={`feature-page feature-page-${variant}`}>
      <div className="feature-aurora" aria-hidden="true" />
      <header className="feature-nav">
        <Link href="/" className="brand"><span className="brand-mark"><RotateCcw size={17} /></span><span>Rollback<span>Ready</span></span></Link>
        <nav aria-label="Product pages">{nav.map(([label, href]) => {
          const active = href === `/${variant}`;
          return <Link key={href} href={href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>{label}</Link>;
        })}</nav>
        <Link href="/#product" className="feature-nav-demo"><Play size={13} fill="currentColor" /> Live demo</Link>
      </header>

      <section className="feature-hero">
        <motion.div className="feature-hero-copy" initial={reducedMotion ? false : { opacity: 0, y: 35 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .75, ease: [0.16,1,.3,1] }}>
          <span>{eyebrow}</span>
          <h1>{title}<br /><em>{accent}</em></h1>
          <p>{summary}</p>
          <div><Link href="/#product" className="feature-primary-link">Run the unsafe demo <ArrowRight size={16} /></Link><Link href="/"><ArrowLeft size={15} /> Back to overview</Link></div>
        </motion.div>
        <motion.div className="feature-emblem" initial={reducedMotion ? false : { opacity: 0, rotateY: -35, rotateX: 22, scale: .62 }} animate={{ opacity: 1, rotateY: -9, rotateX: 7, scale: 1 }} transition={{ duration: 1.2, ease: [0.16,1,.3,1], delay: .12 }}>
          <i className="feature-emblem-ring" />
          <div className="feature-emblem-fallback" aria-hidden="true"><ShieldCheck size={72} /><Database size={38} /></div>
          <Image src="/rollbackready-emblem.png" width={520} height={520} priority alt="" onError={(event) => { event.currentTarget.hidden = true; }} />
          <span className="sr-only">dbsentinal database protection emblem</span>
          <div><span>{metricLabel}</span><strong>{metric}</strong><small>PRODUCT TARGET</small></div>
        </motion.div>
      </section>

      <div className="feature-ticker" aria-label="dbsentinal safety capabilities"><div>{["MIGRATION HISTORY", "FAILURE INJECTION", "LEGACY QUERY REPLAY", "RECOVERY VERIFICATION", "HUMAN REVIEW", "NO PRODUCTION ACCESS"].map((item) => <span key={item}><i />{item}</span>)}</div></div>

      <section className="feature-story">
        <div className="feature-section-title"><span>01 / HOW IT WORKS</span><h2>Evidence moves through<br />an explicit system.</h2></div>
        <div className="feature-stage-grid">
          {stages.map((stage, index) => {
            const Icon = icons[index % icons.length];
            return <motion.article key={stage.number} initial={reducedMotion ? false : { opacity: 0, y: 42, rotateX: 10 }} whileInView={{ opacity: 1, y: 0, rotateX: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: .65, delay: index * .08 }} whileHover={reducedMotion ? undefined : { y: -8, rotateX: 2 }}><div><span>{stage.number}</span><Icon size={18} /></div><h3>{stage.title}</h3><p>{stage.body}</p><i className="feature-card-beam" /></motion.article>;
          })}
        </div>
      </section>

      <section className="feature-system-section">
        <div className="feature-section-title"><span>02 / ILLUSTRATIVE SYSTEM VIEW</span><h2>{viewTitle(variant)}</h2></div>
        <div className={`feature-system feature-system-${variant}`}>
          <div className="feature-system-grid" aria-hidden="true" />
          <div className="feature-system-core">
            <motion.div animate={reducedMotion ? undefined : { rotate: 360 }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }}><i /><i /><i /></motion.div>
            <span>{variant.toUpperCase()} ENGINE</span><strong>RR</strong><small>DETERMINISTIC CORE</small>
          </div>
          <div className="feature-signal-list">
            {signals.map((signal, index) => <motion.article key={signal.label} initial={reducedMotion ? false : { opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * .08 }}><span>{String(index + 1).padStart(2,"0")}</span><div><small>{signal.label}</small><strong>{signal.value}</strong></div><b className={statusTone(signal.status)}><i />{signal.status}</b></motion.article>)}
          </div>
        </div>
      </section>

      <section className="feature-proof">
        <div><span>03 / SAFETY BOUNDARY</span><h2>Animation communicates state.<br />Evidence communicates truth.</h2><p>Every visual status maps back to a deterministic finding, simulation event, or verified plan result. No decorative confidence scores become deployment claims.</p></div>
        <div className="feature-proof-list"><span><Check size={14} /> Human review required</span><span><TriangleAlert size={14} /> Unsafe states stay visible</span><span><ServerCog size={14} /> Disposable PostgreSQL only</span><span><Code2 size={14} /> Sanitized artifacts</span></div>
      </section>

      <section className="feature-cta">
        <Sparkles size={25} /><span>dbsentinal</span><h2>See the failure.<br />Verify the recovery.</h2><Link href="/#product" className="feature-primary-link">Launch the demo <Zap size={16} /></Link>
      </section>

      <footer className="feature-footer"><Link href="/" className="brand"><span className="brand-mark"><RotateCcw size={16} /></span><span>Rollback<span>Ready</span></span></Link><span>VERIFIED FOR HUMAN REVIEW · NEVER “SAFE TO DEPLOY”</span><Link href="/architecture">Technical architecture <ArrowRight size={13} /></Link></footer>
    </main>
  );
}

function viewTitle(variant: FeaturePageProps["variant"]) {
  if (variant === "simulation") return "Every interruption leaves evidence.";
  if (variant === "architecture") return "Isolation is a product feature.";
  if (variant === "reports") return "Every verdict has dimensions.";
  return "One candidate. Multiple proof paths.";
}

function statusTone(status: string) {
  const key = status.toUpperCase();
  if (["PASS", "VERIFIED", "READY", "ISOLATED"].includes(key)) return "good";
  if (["FAIL", "UNSAFE", "BLOCKED"].includes(key)) return "bad";
  return "warn";
}

