import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

import "./globals.css";

// RollbackReady is publicly hosted at https://dbsentinal.get200.qd.je.
const siteUrl = process.env.SITE_URL ?? "https://dbsentinal.get200.qd.je";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  title: "RollbackReady — Prisma migration recovery evidence",
  description: "Replay, break, and verify Prisma PostgreSQL migrations before production.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const document = (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return publishableKey ? (
    <ClerkProvider publishableKey={publishableKey}>{document}</ClerkProvider>
  ) : document;
}
