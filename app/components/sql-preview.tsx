"use client";

import Editor, { type BeforeMount } from "@monaco-editor/react";
import * as Tabs from "@radix-ui/react-tabs";
import { ShieldCheck, TriangleAlert } from "lucide-react";

const unsafeSql = `-- Candidate migration: fails with existing rows
ALTER TABLE "users"
ADD COLUMN "phone" TEXT NOT NULL;`;

const saferSql = `-- Expand: nullable first, preserve old clients
ALTER TABLE "users"
ADD COLUMN "phone" TEXT;

-- Backfill in bounded batches
UPDATE "users"
SET "phone" = 'synthetic-redacted'
WHERE "phone" IS NULL;

-- Contract only after compatibility is verified
ALTER TABLE "users"
ALTER COLUMN "phone" SET NOT NULL;`;

const configureTheme: BeforeMount = (monaco) => {
  monaco.editor.defineTheme("rollbackready", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "36F1FF" },
      { token: "string", foreground: "FF71D9" },
      { token: "comment", foreground: "687080", fontStyle: "italic" },
    ],
    colors: {
      "editor.background": "#07080C",
      "editor.foreground": "#E7ECF5",
      "editorLineNumber.foreground": "#414958",
      "editor.selectionBackground": "#3C2B8055",
      "editor.lineHighlightBackground": "#FFFFFF05",
    },
  });
};

function Code({ value }: { value: string }) {
  return (
    <Editor
      height="330px"
      defaultLanguage="sql"
      value={value}
      theme="rollbackready"
      beforeMount={configureTheme}
      loading={<div className="editor-loading">Loading secure SQL preview...</div>}
      options={{
        readOnly: true,
        minimap: { enabled: false },
        fontSize: 13,
        lineHeight: 22,
        fontFamily: "var(--font-mono)",
        scrollBeyondLastLine: false,
        renderLineHighlight: "none",
        overviewRulerLanes: 0,
        folding: false,
        wordWrap: "on",
        padding: { top: 18, bottom: 18 },
        automaticLayout: true,
      }}
    />
  );
}

export default function SqlPreview() {
  return (
    <Tabs.Root className="sql-tabs" defaultValue="unsafe">
      <Tabs.List className="sql-tabs-list" aria-label="Compare unsafe and safer migration SQL">
        <Tabs.Trigger value="unsafe"><TriangleAlert size={15} /> Unsafe candidate</Tabs.Trigger>
        <Tabs.Trigger value="safer"><ShieldCheck size={15} /> Verified shape</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="unsafe"><Code value={unsafeSql} /></Tabs.Content>
      <Tabs.Content value="safer"><Code value={saferSql} /></Tabs.Content>
    </Tabs.Root>
  );
}
