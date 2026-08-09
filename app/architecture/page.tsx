import type { Metadata } from "next";

import FeaturePage from "@/app/components/feature-page";

export const metadata: Metadata = { title: "Architecture | RollbackReady", description: "The isolated architecture behind RollbackReady migration simulation and recovery verification." };

export default function ArchitecturePage() {
  return <FeaturePage eyebrow="ARCHITECTURE / ISOLATED BY DESIGN" title="Production never enters" accent="the simulation boundary." summary="Next.js coordinates the evidence experience. FastAPI validates and orchestrates. A disposable PostgreSQL cluster executes through a Unix socket with a non-superuser role. Gemini receives only normalized findings and redacted SQL shapes." metric="0" metricLabel="Production links" variant="architecture" stages={[
    { number:"01", title:"Edge interface", body:"Next.js stages project bundles and renders sanitized findings, timelines, plans, and reports." },
    { number:"02", title:"Deterministic core", body:"FastAPI owns validation, rules, pipeline orchestration, evidence aggregation, and verdicts." },
    { number:"03", title:"Disposable database", body:"PostgreSQL runs locally to the worker over a Unix socket under strict resource limits." },
    { number:"04", title:"Bounded AI", body:"LangGraph constrains plan generation; Pydantic and fresh execution decide what is presentable." },
  ]} signals={[
    { label:"Upload lifecycle", value:"Raw artifacts deleted", status:"PASS" },
    { label:"Database role", value:"Non-superuser", status:"ISOLATED" },
    { label:"Gemini prompt", value:"Normalized + redacted", status:"PASS" },
    { label:"Production access", value:"Connection strings rejected", status:"BLOCKED" },
  ]} />;
}
