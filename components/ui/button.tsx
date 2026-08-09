"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:
          "border-cyan-300/70 bg-cyan-300 text-slate-950 shadow-[0_0_40px_rgba(54,241,255,.18)] hover:bg-white",
        secondary:
          "border-white/15 bg-white/[.045] text-white hover:border-cyan-300/45 hover:bg-cyan-300/[.08]",
        ghost:
          "border-transparent bg-transparent text-slate-300 hover:bg-white/[.055] hover:text-white",
        danger:
          "border-rose-400/35 bg-rose-400/[.08] text-rose-200 hover:bg-rose-400/[.14]",
      },
      size: {
        default: "min-h-11 px-5",
        sm: "min-h-9 px-4 text-xs",
        lg: "min-h-13 px-6 text-[.94rem]",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

type ButtonProps = Omit<ComponentProps<typeof motion.button>, "ref"> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={props.disabled ? undefined : { y: -2 }}
      whileTap={props.disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
