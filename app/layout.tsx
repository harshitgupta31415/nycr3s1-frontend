import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import InteractionLayer from "./components/interaction-layer";

import "./globals.css";

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
if (process.env.NODE_ENV === "production" && !process.env.SITE_URL) {
  throw new Error("SITE_URL is required for production metadata.");
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  title: "dbsentinal — Prisma migration recovery evidence",
  description: "Replay migration history, inject failures, check backward compatibility, and verify recovery before production.",
  keywords: ["Prisma", "PostgreSQL", "database migrations", "migration safety", "developer tools"],
  openGraph: {
    title: "dbsentinal — See the failure. Verify the recovery.",
    description: "Deterministic migration safety evidence for Prisma and PostgreSQL teams.",
    type: "website",
    url: "/",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#030305",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const document = <html lang="en"><body><InteractionLayer />{children}</body></html>;
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return publishableKey ? <ClerkProvider publishableKey={publishableKey}>{document}</ClerkProvider> : document;
}

