"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { Heart, ChevronDown, Menu, X, ArrowRight, User, LogOut, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Features", href: "#features" },
  { label: "Stats", href: "#stats" },
  { label: "Telemedicine", href: "/telemedicine" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const { scrollYProgress } = useScroll();
  const [mounted, setMounted] = useState(false);
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    // Intersection Observer for active section highlighting
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(`#${entry.target.id}`);
        }
      });
    }, observerOptions);

    const sections = ["features", "stats", "contact"];
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  const handleLogout = () => {
    logout();
    router.refresh();
  };

  const getDashboardUrl = () => {
    if (!user?.role) return '/';
    const role = user.role.toUpperCase();
    if (role.includes('ADMIN')) return '/admin/dashboard';
    if (role.includes('DOCTOR')) return '/doctor/dashboard';
    if (role.includes('PATIENT')) return '/patient/dashboard';
    return '/';
  };

  const dashboardUrl = getDashboardUrl();

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out px-4 md:px-8",
          isScrolled
            ? "py-3 bg-white/80 backdrop-blur-2xl border-b border-slate-200/50 shadow-sm"
            : "py-6 bg-transparent"
        )}
      >
        <div className="container mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-500/30 group-hover:bg-primary-500 group-hover:scale-105 transition-all duration-300">
              <Heart className="h-6 w-6 fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl transition-colors group-hover:text-primary-600">
              HealthPulse
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/50 backdrop-blur-sm p-1 rounded-2xl border border-slate-200/50">
            {navItems.map((item) => {
              const isActive = activeSection === item.href || (pathname === item.href && !item.href.startsWith("#"));
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "relative px-5 py-2 text-sm font-semibold rounded-xl transition-all duration-300",
                    isActive
                      ? "text-primary-600 bg-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                  )}
                >
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 rounded-xl border border-primary-100 pointer-events-none"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Auth Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {mounted && (
              isAuthenticated ? (
                <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm p-1 rounded-2xl border border-slate-200/50">
                  <Link href={dashboardUrl}>
                    <div className="flex items-center gap-2 pl-3 pr-4 py-2 text-sm font-bold text-slate-700 hover:text-primary-600 transition-colors">
                      <User className="h-4 w-4" />
                      <span>Account</span>
                    </div>
                  </Link>
                  <div className="h-4 w-[1px] bg-slate-200" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-rose-500 hover:text-rose-600 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Exit</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <div className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-primary-600 transition-all">
                      Sign In
                    </div>
                  </Link>
                  <Link href="/register">
                    <div className="flex items-center justify-center rounded-xl bg-slate-900 text-white shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all h-11 px-8 text-sm font-bold">
                      Join HealthPulse
                    </div>
                  </Link>
                </div>
              )
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-900 hover:bg-slate-200 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Scroll Progress Bar - More subtle */}
        <motion.div
          className="absolute bottom-0 left-0 h-[2px] right-0 bg-primary-600/30"
          style={{ scaleX, transformOrigin: "0%" }}
        />
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-[55] bg-slate-950/20 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-[60] w-[300px] bg-white shadow-2xl lg:hidden flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-slate-100">
                <span className="font-bold text-lg">Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between p-4 rounded-2xl text-lg font-bold text-slate-700 hover:bg-primary-50 hover:text-primary-600 transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                    <ArrowRight size={18} className="opacity-0 group-hover:opacity-100" />
                  </Link>
                ))}

                <div className="h-[1px] bg-slate-100 my-4" />

                {mounted && (
                  isAuthenticated ? (
                    <div className="space-y-3">
                      <Link href={dashboardUrl} onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-500/20">
                          <LayoutDashboard size={20} />
                          <span>Go to Dashboard</span>
                        </div>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 w-full p-4 rounded-2xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition-colors"
                      >
                        <LogOut size={20} />
                        <span>Log Out</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="p-4 rounded-2xl bg-slate-100 text-slate-900 font-bold text-center">
                          Sign In
                        </div>
                      </Link>
                      <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="p-4 rounded-2xl bg-slate-900 text-white font-bold text-center shadow-lg">
                          Get Started Free
                        </div>
                      </Link>
                    </div>
                  )
                )}
              </div>

              <div className="p-8 border-t border-slate-100">
                <p className="text-xs text-slate-400 text-center font-medium italic">
                  HealthPulse Medical Network © 2026
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
