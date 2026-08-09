"use client";

import { Check, Cpu, Database, Layers3, ShieldCheck } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";

const taskLabels = [
  "Reading visual manifest",
  "Decoding 3D emblem",
  "Loading motion runtime",
  "Registering scroll engine",
  "Preparing migration graph",
  "Warming SQL renderer",
  "Synchronizing interface",
];

export default function BootGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<"loading" | "exiting" | "ready">("loading");
  const [progress, setProgress] = useState(4);
  const [label, setLabel] = useState(taskLabels[0]);

  useEffect(() => {
    let alive = true;
    async function boot() {
      const imageReady = new Promise<void>((resolve) => {
        const image = new window.Image();
        image.src = "/rollbackready-emblem.png";
        if (image.complete) {
          void image.decode().catch(() => undefined).finally(resolve);
          return;
        }
        image.onload = () => void image.decode().catch(() => undefined).finally(resolve);
        image.onerror = () => resolve();
      });
      const tasks: Array<Promise<unknown>> = [
        imageReady,
        document.fonts?.ready ?? Promise.resolve(),
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("lenis"),
        import("./migration-flow"),
        import("./sql-preview"),
      ];
      let completed = 0;
      const tracked = tasks.map((task) => task.finally(() => {
        if (!alive) return;
        completed += 1;
        const next = Math.round(8 + (completed / tasks.length) * 86);
        setProgress(next);
        setLabel(taskLabels[Math.min(completed, taskLabels.length - 1)]);
      }));
      const minimum = new Promise<void>((resolve) => window.setTimeout(resolve, 1250));
      const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, 8500));
      await Promise.race([Promise.allSettled([...tracked, minimum]).then(() => undefined), timeout]);
      if (!alive) return;
      setProgress(100);
      setLabel("All systems ready");
      await new Promise<void>((resolve) => window.setTimeout(resolve, 280));
      if (!alive) return;
      setPhase("exiting");
      await new Promise<void>((resolve) => window.setTimeout(resolve, 620));
      if (alive) setPhase("ready");
    }
    void boot();
    return () => { alive = false; };
  }, []);

  if (phase === "ready") return children;
  return (
    <div className={phase === "exiting" ? "boot-loader boot-loader-exit" : "boot-loader"} role="status" aria-live="polite" aria-label={`Loading RollbackReady: ${progress}%`}>
      <div className="boot-grid" aria-hidden="true" />
      <div className="boot-glow" aria-hidden="true" />
      <header><span>ROLLBACKREADY</span><small>PRE-FLIGHT / VISUAL RUNTIME</small></header>
      <div className="boot-center">
        <div className="boot-dial" style={{ "--boot-progress": `${progress * 3.6}deg` } as CSSProperties}>
          <div><ShieldCheck size={30} /><strong>{progress}</strong><span>%</span></div>
          <i /><i /><i />
        </div>
        <div className="boot-copy"><span>{label}</span><div><i style={{ width: `${progress}%` }} /></div><small>Do not connect production credentials</small></div>
      </div>
      <div className="boot-checks">
        <BootCheck icon={Cpu} label="Motion engine" done={progress >= 42} />
        <BootCheck icon={Layers3} label="3D scene" done={progress >= 58} />
        <BootCheck icon={Database} label="Visual modules" done={progress >= 78} />
        <BootCheck icon={ShieldCheck} label="Safety interface" done={progress >= 96} />
      </div>
      <footer><span>POSTGRESQL SANDBOX</span><span>VERIFIED FOR HUMAN REVIEW</span></footer>
    </div>
  );
}

function BootCheck({ icon: Icon, label, done }: { icon: typeof Cpu; label: string; done: boolean }) {
  return <div className={done ? "boot-check boot-check-done" : "boot-check"}><Icon size={14} /><span>{label}</span>{done ? <Check size={13} /> : <i />}</div>;
}
