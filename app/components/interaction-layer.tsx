"use client";

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useSpring } from "motion/react";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

const particles = Array.from({ length: 16 }, (_, index) => ({
  id: index,
  x: `${7 + ((index * 37) % 88)}vw`,
  delay: `${(index * 0.73) % 8}s`,
  duration: `${8 + (index % 6) * 1.35}s`,
  color: index % 3 === 0 ? "var(--magenta)" : index % 3 === 1 ? "var(--cyan)" : "var(--violet)",
}));

type Burst = { id: number; x: number; y: number };

export default function InteractionLayer() {
  const reducedMotion = useReducedMotion();
  const pointerX = useMotionValue(-500);
  const pointerY = useMotionValue(-500);
  const smoothX = useSpring(pointerX, { stiffness: 280, damping: 32, mass: 0.55 });
  const smoothY = useSpring(pointerY, { stiffness: 280, damping: 32, mass: 0.55 });
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 130, damping: 25, mass: 0.35 });
  const [bursts, setBursts] = useState<Burst[]>([]);
  const burstId = useRef(0);

  useEffect(() => {
    if (reducedMotion || window.matchMedia("(pointer: coarse)").matches) return;
    let frame = 0;
    let nextX = -500;
    let nextY = -500;
    const flush = () => {
      pointerX.set(nextX - 180);
      pointerY.set(nextY - 180);
      frame = 0;
    };
    const move = (event: PointerEvent) => {
      nextX = event.clientX;
      nextY = event.clientY;
      if (!frame) frame = requestAnimationFrame(flush);
    };
    const burst = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const id = ++burstId.current;
      setBursts((current) => [...current.slice(-5), { id, x: event.clientX, y: event.clientY }]);
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", burst, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", burst);
    };
  }, [pointerX, pointerY, reducedMotion]);

  return (
    <div className="interaction-layer" aria-hidden="true">
      <motion.div className="scroll-progress" style={{ scaleX: progress }} />
      <motion.div className="cursor-spotlight" style={{ x: smoothX, y: smoothY }} />
      <div className="data-particles">
        {particles.map((particle) => <i key={particle.id} style={{ "--particle-x": particle.x, "--particle-delay": particle.delay, "--particle-duration": particle.duration, "--particle-color": particle.color } as CSSProperties} />)}
      </div>
      <AnimatePresence>
        {bursts.map((burst) => (
          <motion.i
            key={burst.id}
            className="click-burst"
            style={{ left: burst.x, top: burst.y }}
            initial={{ opacity: .85, scale: .15 }}
            animate={{ opacity: 0, scale: 5.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: .58, ease: "easeOut" }}
            onAnimationComplete={() => setBursts((current) => current.filter((item) => item.id !== burst.id))}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
