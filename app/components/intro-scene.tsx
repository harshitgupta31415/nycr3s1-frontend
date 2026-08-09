"use client";

import { Activity, Database, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import Image from "next/image";
import type { PointerEvent, SyntheticEvent } from "react";
import { useEffect, useRef, useState } from "react";

function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.hidden = true;
}

function formatTimecode(elapsed: number) {
  const seconds = Math.min(59, Math.floor(elapsed / 1000));
  const frames = Math.min(23, Math.floor((elapsed % 1000) / (1000 / 24)));
  return `00:00:${String(seconds).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
}

export function IntroScene() {
  const [visible, setVisible] = useState(true);
  const [timecode, setTimecode] = useState("00:00:00:00");
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (reducedMotion) {
      const frame = requestAnimationFrame(() => setVisible(false));
      return () => cancelAnimationFrame(frame);
    }
    let cancelled = false;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        stopRef.current?.();
        setVisible(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    const startedAt = performance.now();
    const clock = window.setInterval(() => setTimecode(formatTimecode(performance.now() - startedAt)), 42);
    const fallbackTimer = window.setTimeout(() => {
      cancelled = true;
      stopRef.current?.();
      window.clearInterval(clock);
      setVisible(false);
    }, 7400);

    void import("gsap").then(({ gsap }) => {
      if (cancelled || !rootRef.current) return;
      const context = gsap.context(() => {
        gsap.set([".cine-shot-orbit", ".cine-shot-title", ".cine-flash"], { opacity: 0 });
        const timeline = gsap.timeline({
          defaults: { ease: "power3.out" },
          onComplete: () => {
            window.clearTimeout(fallbackTimer);
            window.clearInterval(clock);
            setVisible(false);
          },
        });
        timeline
          .fromTo(".cine-letterbox-top", { yPercent: -100 }, { yPercent: 0, duration: .45, ease: "power2.out" }, 0)
          .fromTo(".cine-letterbox-bottom", { yPercent: 100 }, { yPercent: 0, duration: .45, ease: "power2.out" }, 0)
          .fromTo(".cine-hud", { opacity: 0 }, { opacity: 1, duration: .35 }, .16)
          .fromTo(".cine-shot-close", { opacity: 0, scale: 1.55, rotateZ: -5, xPercent: 15 }, { opacity: 1, scale: 1.13, rotateZ: -1.5, xPercent: 0, duration: 1.1, ease: "power2.out" }, .08)
          .fromTo(".cine-close-image", { filter: "blur(16px) brightness(.55)" }, { filter: "blur(0px) brightness(1)", duration: .65 }, .18)
          .fromTo(".cine-caption > *", { y: 14, opacity: 0 }, { y: 0, opacity: 1, stagger: .08, duration: .4 }, .48)
          .to(".cine-shot-close", { scale: 1.75, xPercent: -17, yPercent: -5, filter: "blur(8px)", opacity: 0, duration: .58, ease: "power2.in" }, 1.35)
          .fromTo(".cine-flash", { opacity: 0 }, { opacity: .78, duration: .08, yoyo: true, repeat: 1 }, 1.72)
          .fromTo(".cine-shot-orbit", { opacity: 0, scale: .64, rotateX: 52, rotateY: -30, z: -360 }, { opacity: 1, scale: 1, rotateX: 0, rotateY: 0, z: 0, duration: 1.05, ease: "expo.out" }, 1.78)
          .fromTo(".cine-ring", { scale: .45, opacity: 0, rotateZ: -80 }, { scale: 1, opacity: 1, rotateZ: 0, stagger: .1, duration: .72 }, 1.92)
          .fromTo(".cine-data-card", { opacity: 0, y: 20, scale: .88 }, { opacity: 1, y: 0, scale: 1, stagger: .11, duration: .48 }, 2.25)
          .fromTo(".cine-orbit-scan", { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: .55 }, 2.5)
          .to(".cine-emblem-object", { rotateY: 8, rotateX: -4, scale: 1.06, duration: 1.2, ease: "sine.inOut" }, 2.45)
          .to(".cine-shot-orbit", { opacity: 0, scale: 1.35, filter: "blur(12px)", duration: .62, ease: "power2.in" }, 3.55)
          .fromTo(".cine-shot-title", { opacity: 0, scale: .92 }, { opacity: 1, scale: 1, duration: .42 }, 3.75)
          .fromTo(".cine-title-kicker", { letterSpacing: ".45em", opacity: 0 }, { letterSpacing: ".16em", opacity: 1, duration: .55 }, 3.84)
          .fromTo(".cine-title-line", { yPercent: 120, rotateX: -45, opacity: 0 }, { yPercent: 0, rotateX: 0, opacity: 1, stagger: .13, duration: .65, ease: "expo.out" }, 4.02)
          .fromTo(".cine-title-meta > *", { y: 12, opacity: 0 }, { y: 0, opacity: 1, stagger: .08, duration: .4 }, 4.55)
          .to(".cine-shot-title", { opacity: 1, duration: .9, ease: "none" }, 4.95)
          .to(rootRef.current, { opacity: 0, scale: 1.03, filter: "blur(15px) brightness(1.25)", duration: .72, ease: "power2.in" }, 5.72);
        stopRef.current = () => timeline.kill();
      }, rootRef);
      stopRef.current = () => context.revert();
    });
    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
      window.clearInterval(clock);
      window.removeEventListener("keydown", handleKeyDown);
      stopRef.current?.();
    };
  }, [reducedMotion]);

  function skip() {
    stopRef.current?.();
    setVisible(false);
  }

  if (!visible) return null;
  return (
    <div ref={rootRef} className="intro-scene cine-scene" aria-label="dbsentinal cinematic introduction">
      <div className="cine-film-grain" aria-hidden="true" />
      <div className="cine-vignette" aria-hidden="true" />
      <div className="cine-letterbox cine-letterbox-top" aria-hidden="true" />
      <div className="cine-letterbox cine-letterbox-bottom" aria-hidden="true" />
      <div className="cine-hud" aria-hidden="true"><span><i /> RR_FILM / 001</span><time>{timecode}</time><b>REC</b></div>

      <div className="cine-shot cine-shot-close" aria-hidden="true">
        <div className="cine-close-image">
          <div className="cine-image-fallback"><ShieldCheck size={110} /><Database size={62} /></div>
          <Image src="/rollbackready-emblem.png" width={900} height={900} priority alt="" onError={hideBrokenImage} />
        </div>
        <div className="cine-caption"><span>SHOT 01 / RECONSTRUCT</span><strong>Migration history located.</strong><small>Rebuilding the pre-candidate schema</small></div>
      </div>

      <div className="cine-shot cine-shot-orbit" aria-hidden="true">
        <div className="cine-orbit-grid" />
        <div className="cine-emblem-object">
          <i className="cine-ring cine-ring-one" /><i className="cine-ring cine-ring-two" /><i className="cine-ring cine-ring-three" />
          <div className="cine-orbit-image"><div className="cine-image-fallback"><ShieldCheck size={90} /><Database size={48} /></div><Image src="/rollbackready-emblem.png" width={580} height={580} priority alt="" onError={hideBrokenImage} /></div>
          <i className="cine-orbit-scan" />
        </div>
        <div className="cine-data-card cine-data-one"><Activity size={14} /><span>FAILURE BOUNDARY</span><strong>STATEMENT 01</strong></div>
        <div className="cine-data-card cine-data-two"><Database size={14} /><span>SANDBOX</span><strong>ISOLATED</strong></div>
        <div className="cine-data-card cine-data-three"><ShieldCheck size={14} /><span>RECOVERY</span><strong>REQUIRED</strong></div>
      </div>

      <div className="cine-shot cine-shot-title">
        <span className="cine-title-kicker">PRISMA MIGRATION INTELLIGENCE</span>
        <h2><span className="cine-title-mask"><i className="cine-title-line">SEE THE FAILURE.</i></span><span className="cine-title-mask"><i className="cine-title-line">VERIFY THE RECOVERY.</i></span></h2>
        <div className="cine-title-meta"><span><ScanLine size={13} /> BREAK</span><i /><span><Database size={13} /> REPLAY</span><i /><span><ShieldCheck size={13} /> VERIFY</span></div>
      </div>
      <div className="cine-flash" aria-hidden="true" />
      <div className="cine-progress" aria-hidden="true"><i /><i /><i /></div>
      <button type="button" onClick={skip}>Skip film <span>ESC</span></button>
    </div>
  );
}

export function HeroEmblem({ verdict }: { verdict: string }) {
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
      <motion.div className="emblem-object" style={reducedMotion ? undefined : { rotateX, rotateY }} initial={reducedMotion ? false : { opacity: 0, scale: 0.68, rotateZ: -8 }} animate={{ opacity: 1, scale: 1, rotateZ: 0 }} transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}>
        <i className="emblem-orbit orbit-one" aria-hidden="true" /><i className="emblem-orbit orbit-two" aria-hidden="true" />
        <div className="emblem-image-wrap">
          <div className="emblem-fallback" aria-hidden="true"><ShieldCheck size={84} /><Database size={42} /></div>
          <Image src="/rollbackready-emblem.png" width={680} height={680} priority alt="" draggable={false} onError={hideBrokenImage} />
          <span className="sr-only">dbsentinal shield protecting a database</span>
        </div>
        <span className="emblem-floor" aria-hidden="true" />
      </motion.div>
      <motion.div className="scene-chip scene-chip-one" animate={reducedMotion ? undefined : { y: [0, -9, 0] }} transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut" }}><Database size={14} /><span>Sandbox</span><strong>READY</strong></motion.div>
      <motion.div className="scene-chip scene-chip-two" animate={reducedMotion ? undefined : { y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 4.8, ease: "easeInOut", delay: 0.4 }}><ShieldCheck size={14} /><span>Verdict</span><strong>{verdict}</strong></motion.div>
      <motion.div className="scene-score" animate={reducedMotion ? undefined : { rotate: [0, 2, 0, -2, 0] }} transition={{ repeat: Infinity, duration: 7 }}><Sparkles size={13} /><strong>—</strong><span>NO RISK SCORE</span></motion.div>
      <span className="scene-instruction">MOVE TO INSPECT DEPTH</span>
    </div>
  );
}

