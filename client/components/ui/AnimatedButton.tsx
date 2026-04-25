"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "glass";
  size?: "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
}

const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
    const variants = {
      primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/30",
      secondary: "bg-accent-600 text-white hover:bg-accent-700 shadow-lg shadow-accent-500/30",
      outline: "border-2 border-primary-600 text-primary-600 hover:bg-primary-50",
      ghost: "text-slate-600 hover:bg-slate-100",
      glass: "glass hover:bg-white/40 text-primary-700",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-5 py-2.5 text-base",
      lg: "px-8 py-3.5 text-lg font-semibold",
      xl: "px-10 py-4 text-xl font-bold uppercase tracking-tight",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "inline-flex items-center justify-center rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children as React.ReactNode}
      </motion.button>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

export { AnimatedButton };
