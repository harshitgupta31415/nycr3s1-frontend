import type { Metadata } from "next";

import FeaturePage from "@/app/components/feature-page";

export const metadata: Metadata = {
  title: "Product | dbsentinal",
  description: "How dbsentinal turns Prisma migrations into deterministic recovery evidence.",
  alternates: { canonical: "/product" },
  openGraph: { url: "/product" },
};

export default function ProductPage() {
  return <FeaturePage eyebrow="PRODUCT / MIGRATION INTELLIGENCE" title="From migration file to" accent="verified evidence." summary="dbsentinal reconstructs the real migration boundary: complete history, synthetic production-shaped data, legacy query contracts, interruption experiments, and a recovery plan that must execute successfully." metric="4" metricLabel="Risk families" variant="product" stages={[
    { number:"01", title:"Reconstruct", body:"Replay every prior Prisma migration to produce the exact pre-candidate schema." },
    { number:"02", title:"Challenge", body:"Load synthetic fixtures and test deterministic destructive, integrity, and compatibility rules." },
    { number:"03", title:"Break", body:"Interrupt supported statement boundaries, inspect remaining state, and attempt retry." },
    { number:"04", title:"Verify", body:"Execute the recovery plan from a clean baseline before assigning a review verdict." },
  ]} signals={[
    { label:"Migration history", value:"Complete and hashed", status:"PASS" },
    { label:"Candidate SQL", value:"Required phone column", status:"UNSAFE" },
    { label:"Legacy clients", value:"Old insert shape", status:"BLOCKED" },
    { label:"Recovery path", value:"Expand-and-contract", status:"VERIFIED" },
  ]} />;
}

