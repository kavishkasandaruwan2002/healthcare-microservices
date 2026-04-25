"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className, hover = true }: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "glass rounded-3xl p-6 transition-all duration-300",
        hover && "hover:shadow-primary-500/20 hover:border-primary-500/30",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
