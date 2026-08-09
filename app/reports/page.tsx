import type { Metadata } from "next";

import FeaturePage from "@/app/components/feature-page";

export const metadata: Metadata = {
  title: "Evidence Reports | dbsentinal",
  description: "Review dbsentinal migration safety evidence dimensions and verdict boundaries.",
  alternates: { canonical: "/reports" },
  openGraph: { url: "/reports" },
};

export default function ReportsPage() {
  return <FeaturePage eyebrow="EVIDENCE REPORTS / EXPLAINABLE VERDICTS" title="A verdict is only useful" accent="when you can inspect why." summary="dbsentinal reports schema replay, data integrity, backward compatibility, interruption behavior, recovery execution, and limitations independently. Not tested never becomes pass, and verified never becomes safe to deploy." metric="24h" metricLabel="Report retention" variant="reports" stages={[
    { number:"01", title:"Findings", body:"Each risk includes severity, category, affected object, statement shape, evidence source, and remediation." },
    { number:"02", title:"Timeline", body:"Ordered events show what ran, where execution stopped, and how retry or recovery behaved." },
    { number:"03", title:"Dimensions", body:"Every evidence dimension is explicitly pass, fail, or not tested with a human-readable summary." },
    { number:"04", title:"Limitations", body:"Missing artifacts, heuristic lock analysis, and untested production behavior remain visible." },
  ]} signals={[
    { label:"Schema replay", value:"History rebuilt", status:"PASS" },
    { label:"Data integrity", value:"Required column conflict", status:"FAIL" },
    { label:"Compatibility", value:"Gated by earlier failure", status:"NOT TESTED" },
    { label:"Recovery plan", value:"Fresh baseline replay", status:"VERIFIED" },
  ]} />;
}

