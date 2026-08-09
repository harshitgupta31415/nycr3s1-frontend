import type { Metadata } from "next";

import FeaturePage from "@/app/components/feature-page";

export const metadata: Metadata = { title: "Simulation Lab | RollbackReady", description: "Inject failures into Prisma migrations and inspect retry and recovery behavior." };

export default function SimulationPage() {
  return <FeaturePage eyebrow="SIMULATION LAB / CONTROLLED FAILURE" title="Failure is not an accident." accent="It is a test input." summary="The simulator creates a disposable PostgreSQL environment, applies history and fixtures, then stops execution at supported boundaries to reveal partial state, retry safety, transaction behavior, and recovery classification." metric="<90s" metricLabel="Stage target" variant="simulation" stages={[
    { number:"01", title:"Restore baseline", body:"Start from a fresh cluster and apply the complete migration history before the candidate." },
    { number:"02", title:"Load evidence", body:"Insert bounded synthetic fixtures and register legacy application query shapes." },
    { number:"03", title:"Interrupt", body:"Stop at statement boundaries and distinguish rollback from partially committed execution." },
    { number:"04", title:"Retry and classify", body:"Record the remaining database state, retry outcome, and required recovery class." },
  ]} signals={[
    { label:"Baseline", value:"3 prior migrations", status:"PASS" },
    { label:"Statement 01", value:"ADD phone NOT NULL", status:"FAIL" },
    { label:"Retry", value:"Same constraint conflict", status:"BLOCKED" },
    { label:"Recovery", value:"Forward fix required", status:"READY" },
  ]} />;
}
