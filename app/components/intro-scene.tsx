"use client";

import { Database, ShieldCheck, Sparkles } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import Image from "next/image";
import type { PointerEvent } from "react";
import { useEffect, useRef, useState } from "react";

export function IntroScene() {
  const [visible, setVisible] = useState(true);
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (reducedMotion) {
      const frame = requestAnimationFrame(() => setVisible(false));
      return () => cancelAnimationFrame(frame);
    }
    let cancelled = false;
    const fallbackTimer = window.setTimeout(() => {
      cancelled = true;
      stopRef.current?.();
      setVisible(false);
    }, 3500);
    void import("gsap").then(({ gsap }) => {
      if (cancelled || !rootRef.current) return;
      const context = gsap.context(() => {
        const timeline = gsap.timeline({
          defaults: { ease: "power3.out" },
          onComplete: () => {
            window.clearTimeout(fallbackTimer);
            setVisible(false);
          },
        });
        timeline
          .fromTo(".intro-grid", { opacity: 0 }, { opacity: 1, duration: 0.35 })
          .fromTo(".intro-ring-outer", { scale: 0.25, rotateZ: -110, opacity: 0 }, { scale: 1, rotateZ: 0, opacity: 1, duration: 1.05 }, 0.05)
          .fromTo(".intro-ring-inner", { scale: 1.5, rotateZ: 90, opacity: 0 }, { scale: 1, rotateZ: 0, opacity: 1, duration: 0.9 }, 0.12)
          .fromTo(".intro-emblem", { scale: 0.36, rotateX: 68, rotateY: -34, z: -320, opacity: 0 }, { scale: 1, rotateX: 0, rotateY: 0, z: 0, opacity: 1, duration: 1.18 }, 0.18)
          .fromTo(".intro-scan", { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.5 }, 0.7)
          .fromTo(".intro-copy > *", { y: 18, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.09, duration: 0.5 }, 0.82)
          .to(".intro-scene", { opacity: 0, scale: 1.025, filter: "blur(12px)", duration: 0.62, ease: "power2.in" }, 2.15);
        stopRef.current = () => timeline.kill();
      }, rootRef);
      stopRef.current = () => context.revert();
    });
    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
      stopRef.current?.();
    };
  }, [reducedMotion]);

  function skip() {
    stopRef.current?.();
    setVisible(false);
  }

  if (!visible) return null;
  return (
    <div ref={rootRef} className="intro-scene" aria-label="RollbackReady introduction">
      <div className="intro-grid" aria-hidden="true" />
      <div className="intro-bloom" aria-hidden="true" />
      <div className="intro-object" aria-hidden="true">
        <i className="intro-ring-outer" />
        <i className="intro-ring-inner" />
        <Image className="intro-emblem" src="/rollbackready-emblem.png" width={520} height={520} priority unoptimized alt="" />
        <i className="intro-scan" />
      </div>
      <div className="intro-copy">
        <span>ROLLBACKREADY / SYSTEM BOOT</span>
        <strong>Failure simulation online.</strong>
        <small>POSTGRESQL SANDBOX · DETERMINISTIC EVIDENCE</small>
      </div>
      <button type="button" onClick={skip}>Skip intro</button>
    </div>
  );
}

export function HeroEmblem({ verdict, score }: { verdict: string; score: number }) {
  const reducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const smoothX = useSpring(x, { stiffness: 110, damping: 18, mass: 0.8 });
  const smoothY = useSpring(y, { stiffness: 110, damping: 18, mass: 0.8 });
  const rotateY = useTransform(smoothX, [-1, 1], [-12, 12]);
  const rotateX = useTransform(smoothY, [-1, 1], [11, -11]);

  function move(event: PointerEvent<HTMLDivElement>) {
    if (reducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(((event.clientX - rect.left) / rect.width - 0.5) * 2);
    y.set(((event.clientY - rect.top) / rect.height - 0.5) * 2);
  }

  function reset() { x.set(0); y.set(0); }

  return (
    <div className="emblem-scene" onPointerMove={move} onPointerLeave={reset}>
      <div className="emblem-grid" aria-hidden="true" />
      <motion.div
        className="emblem-object"
        style={reducedMotion ? undefined : { rotateX, rotateY }}
        initial={reducedMotion ? false : { opacity: 0, scale: 0.68, rotateZ: -8 }}
        animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
        transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
      >
        <i className="emblem-orbit orbit-one" aria-hidden="true" />
        <i className="emblem-orbit orbit-two" aria-hidden="true" />
        <div className="emblem-image-wrap">
          <Image src="/rollbackready-emblem.png" width={680} height={680} priority unoptimized alt="RollbackReady shield protecting a database" draggable={false} />
        </div>
        <span className="emblem-floor" aria-hidden="true" />
      </motion.div>
      <motion.div className="scene-chip scene-chip-one" animate={reducedMotion ? undefined : { y: [0, -9, 0] }} transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut" }}><Database size={14} /><span>Sandbox</span><strong>READY</strong></motion.div>
      <motion.div className="scene-chip scene-chip-two" animate={reducedMotion ? undefined : { y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 4.8, ease: "easeInOut", delay: 0.4 }}><ShieldCheck size={14} /><span>Verdict</span><strong>{verdict}</strong></motion.div>
      <motion.div className="scene-score" animate={reducedMotion ? undefined : { rotate: [0, 2, 0, -2, 0] }} transition={{ repeat: Infinity, duration: 7 }}><Sparkles size={13} /><strong>{score}</strong><span>/100</span></motion.div>
      <span className="scene-instruction">MOVE TO INSPECT DEPTH</span>
    </div>
  );
}
