"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  ArrowRight, 
  Activity
} from "lucide-react";

interface NavigationItem {
  label: string;
  hasDropdown?: boolean;
  onClick?: () => void;
}

interface ProgramCard {
  image: string;
  category: string;
  title: string;
  onClick?: () => void;
}

interface PulseFitHeroProps {
  logo?: string;
  navigation?: NavigationItem[];
  isAuthenticated?: boolean;
  user?: Record<string, any> | null;
  onLogout?: () => void;
  ctaButton?: {
    label: string;
    onClick: () => void;
  };
  title: string;
  subtitle: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  disclaimer?: string;
  socialProof?: {
    avatars: string[];
    text: string;
  };
  programs?: ProgramCard[];
  className?: string;
  children?: React.ReactNode;
}

export function PulseFitHero({
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  disclaimer,
  socialProof,
  programs = [],
  className,
  children,
}: PulseFitHeroProps) {
  return (
    <section
      className={cn(
        "relative w-full min-h-screen flex flex-col overflow-hidden",
        className
      )}
      style={{
        background: "linear-gradient(180deg, #F0F7FF 0%, #F5F9FF 50%, #FFFFFF 100%)",
      }}
      role="banner"
      aria-label="Hero section"
    >
      {/* Immersive Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/30 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/30 blur-[120px]" />
      </div>

      {/* Header removed - handled by Global Navbar */}

      {/* Main Content */}
      {children ? (
        <div className="relative z-10 flex-1 flex items-center justify-center w-full">
          {children}
        </div>
      ) : (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col items-center text-center max-w-4xl"
            style={{ gap: "32px" }}
          >
            {/* Title */}
            <h1 className="text-slate-950 font-black text-[clamp(48px,8vw,80px)] leading-[1.05] tracking-tighter max-w-3xl">
              {title}
            </h1>

            {/* Subtitle */}
            <p className="text-slate-500 text-[clamp(16px,2vw,20px)] leading-relaxed font-medium italic max-w-2xl">
              {subtitle}
            </p>

            {/* Action Buttons */}
            {(primaryAction || secondaryAction) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center gap-6"
              >
                {primaryAction && (
                  <button
                    onClick={primaryAction.onClick}
                    className="flex flex-row items-center gap-3 px-10 py-5 rounded-3xl bg-slate-900 text-white text-lg font-black uppercase tracking-widest shadow-2xl shadow-slate-900/40 hover:bg-slate-800 transition-all active:scale-95 group"
                  >
                    {primaryAction.label}
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </button>
                )}

                {secondaryAction && (
                  <button
                    onClick={secondaryAction.onClick}
                    className="px-10 py-5 rounded-3xl bg-white border border-slate-200 text-slate-900 text-lg font-black uppercase tracking-widest shadow-xl shadow-slate-100/50 hover:bg-slate-50 transition-all active:scale-95"
                  >
                    {secondaryAction.label}
                  </button>
                )}
              </motion.div>
            )}

            {/* Disclaimer */}
            {disclaimer && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-[13px] font-black text-slate-400 italic uppercase tracking-[0.2em]"
              >
                {disclaimer}
              </motion.p>
            )}

            {/* Social Proof */}
            {socialProof && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex flex-row items-center gap-4 bg-white/40 backdrop-blur-md p-2 pl-4 pr-6 rounded-full border border-white/50"
              >
                <div className="flex flex-row -space-x-3">
                  {socialProof.avatars.map((avatar, index) => (
                    <img
                      key={index}
                      src={avatar}
                      alt={`User ${index + 1}`}
                      className="rounded-full border-2 border-white shadow-sm h-10 w-10 object-cover"
                    />
                  ))}
                </div>
                <span className="text-sm font-black italic text-slate-700 tracking-tight">
                  <span className="text-primary-600">{socialProof.text.split(' ')[0]}</span> {socialProof.text.split(' ').slice(1).join(' ')}
                </span>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}

      {/* Program Cards Carousel */}
      {programs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="relative z-10 w-full overflow-hidden mt-12"
          style={{
            paddingTop: "60px",
            paddingBottom: "60px",
          }}
        >
          {/* Gradient Overlays */}
          <div className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none w-48 bg-linear-to-r from-white to-transparent" />
          <div className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none w-48 bg-linear-to-l from-white to-transparent" />

          {/* Scrolling Container */}
          <motion.div
            className="flex items-center"
            animate={{
              x: [0, -((programs.length * 380) / 2)],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: programs.length * 4,
                ease: "linear",
              },
            }}
            style={{
              gap: "24px",
              paddingLeft: "24px",
            }}
          >
            {[...programs, ...programs].map((program, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -10 }}
                transition={{ duration: 0.3 }}
                onClick={program.onClick}
                className="flex-shrink-0 cursor-pointer relative overflow-hidden"
                style={{
                  width: "356px",
                  height: "480px",
                  borderRadius: "32px",
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.08)",
                }}
              >
                {/* Image */}
                <img
                  src={program.image}
                  alt={program.title}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-linear-to-b from-transparent via-slate-900/20 to-slate-950/80" />

                {/* Text Content */}
                <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary-400" />
                    <span className="text-[10px] font-black tracking-[0.2em] text-white/70 uppercase">
                      {program.category}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white leading-tight">
                    {program.title}
                  </h3>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
