"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  Settings,
  LogOut,
  Activity,
  MessageSquare,
  FileText,
  Video,
  Menu,
  X,
  User,
  Pill,
  ClipboardList,
  Clock,
  Bell,
  ShieldCheck
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface SidebarProps {
  className?: string;
  role?: 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'ROLE_PATIENT' | 'ROLE_DOCTOR' | 'ROLE_ADMIN';
}

export function Sidebar({ className, role = 'PATIENT' }: SidebarProps) {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Normalize role
  const normalizedRole = role.replace('ROLE_', '') as 'PATIENT' | 'DOCTOR' | 'ADMIN';

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) setIsOpen(false);
      else setIsOpen(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const menuItems = {
    PATIENT: [
      { name: "Dashboard", href: "/patient/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
      { name: "Appointments", href: "/patient/appointments", icon: <Calendar className="w-5 h-5" /> },
      { name: "Prescriptions", href: "/patient/prescriptions", icon: <Pill className="w-5 h-5" /> },
      { name: "Medical Records", href: "/patient/records", icon: <FileText className="w-5 h-5" /> },
      { name: "Telemedicine", href: "/telemedicine", icon: <Video className="w-5 h-5" /> },
      // { name: "Pharmacy", href: "/patient/pharmacy", icon: <Activity className="w-5 h-5" /> },
    ],
    DOCTOR: [
      { name: "Dashboard", href: "/doctor/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
      { name: "Appointments", href: "/doctor/appointments", icon: <ClipboardList className="w-5 h-5" /> },
      { name: "Availability", href: "/doctor/dashboard", icon: <Clock className="w-5 h-5" />, tab: 'slots' },
      { name: "Profile", href: "/doctor/dashboard", icon: <User className="w-5 h-5" />, tab: 'profile' },
    ],
    ADMIN: [
      { name: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
      { name: "Verification", href: "/admin/verify", icon: <ShieldCheck className="w-5 h-5" /> },
      { name: "Platform Stats", href: "/admin/dashboard", icon: <Activity className="w-5 h-5" /> },
    ],
  };

  const currentMenu = menuItems[normalizedRole] || menuItems.PATIENT;

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-2xl shadow-xl border border-slate-100 text-slate-600 hover:text-primary-600 transition-colors"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Backdrop */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-all"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width: isOpen ? (isMobile ? '280px' : '280px') : (isMobile ? '0px' : '88px'),
          x: isMobile && !isOpen ? -280 : 0
        }}
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-slate-100 bg-white transition-all duration-300 ease-in-out overflow-hidden flex flex-col shadow-sm",
          className
        )}
      >
        <div className="flex h-full flex-col p-4">
          {/* Logo Area */}
          <div className="mb-10 mt-2 flex items-center gap-3 px-2">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-600/20">
              <Activity className="h-7 w-7" />
            </div>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col"
              >
                <span className="text-xl font-black tracking-tight text-slate-900 leading-none">MediSync</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary-500 mt-1">{normalizedRole} Portal</span>
              </motion.div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-2">
            {currentMenu.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div className={cn(
                    "group relative flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-300",
                    isActive
                      ? "bg-primary-50 text-primary-600 shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}>
                    <div className={cn(
                      "shrink-0 transition-transform group-hover:scale-110",
                      isActive ? "text-primary-600" : "text-slate-400 group-hover:text-slate-600"
                    )}>
                      {item.icon}
                    </div>
                    {isOpen && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="whitespace-nowrap"
                      >
                        {item.name}
                      </motion.span>
                    )}
                    {isActive && isOpen && (
                      <motion.div
                        layoutId="activeBar"
                        className="absolute right-0 h-6 w-1 rounded-l-full bg-primary-600"
                      />
                    )}
                  </div>
                </Link>
              );
            })}

            <div className="my-6 border-t border-slate-50 mx-2" />

            <Link href="/settings">
              <div className={cn(
                "group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all",
                pathname === '/settings' ? "bg-primary-50 text-primary-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}>
                <Settings className="h-5 w-5 opacity-70 group-hover:opacity-100" />
                {isOpen && <span>Settings</span>}
              </div>
            </Link>
          </nav>

          {/* User Section / Footer */}
          <div className="pt-4 mt-auto border-t border-slate-50">
            <button
              onClick={() => logout()}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all group"
            >
              <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              {isOpen && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
