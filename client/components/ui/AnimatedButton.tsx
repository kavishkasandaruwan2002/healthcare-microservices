"use client"

import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { Slot } from "@radix-ui/react-slot"

interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isLoading?: boolean
  asChild?: boolean
  children: React.ReactNode
}

const MotionSlot = motion(Slot)

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, asChild = false, children, disabled, ...props }, ref) => {
    
    const Comp = (asChild ? MotionSlot : motion.button) as any
    const variants = {
      primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-600/20",
      secondary: "bg-accent-600 text-white hover:bg-accent-700 shadow-lg shadow-accent-600/20",
      outline: "border-2 border-slate-200 bg-transparent text-slate-700 hover:bg-slate-50",
      ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
      glass: "glass-dark text-white hover:bg-white/10"
    }

    const sizes = {
      sm: "h-9 px-4 text-xs",
      md: "h-11 px-6 text-sm",
      lg: "h-14 px-10 text-base",
      xl: "h-16 px-12 text-lg"
    }

    return (
      <Comp
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "inline-flex items-center justify-center rounded-2xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Please wait
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
AnimatedButton.displayName = "AnimatedButton"
