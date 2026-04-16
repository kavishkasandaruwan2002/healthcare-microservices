"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Calendar, 
  User, 
  Settings, 
  LogOut, 
  Stethoscope, 
  FileText, 
  Video, 
  Search,
  Activity,
  Bell
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

export function Sidebar({ className, role }: { className?: string, role?: 'PATIENT' | 'DOCTOR' | 'ADMIN' }) {
  const { logout } = useAuthStore();
  const pathname = usePathname();

  const patientLinks = [
    { href: "/patient/dashboard", icon: <LayoutDashboard />, label: "Dashboard" },
    { href: "/patient/appointments", icon: <Calendar />, label: "Appointments" },
    { href: "/telemedicine", icon: <Video />, label: "Virtual Care" },
    { href: "/patient/prescriptions", icon: <FileText />, label: "Prescriptions" },
    { href: "/patient/pharmacy", icon: <Search />, label: "Pharmacy" },
  ];

  const doctorLinks = [
    { href: "/doctor/dashboard", icon: <LayoutDashboard />, label: "Overview" },
    { href: "/doctor/appointments", icon: <Calendar />, label: "Schedule" },
    { href: "/doctor/patients", icon: <User />, label: "Patients" },
    { href: "/telemedicine", icon: <Video />, label: "Tele-Consult" },
  ];

  const links = role === 'DOCTOR' ? doctorLinks : patientLinks;

  return (
    <div className={cn("hidden lg:flex fixed left-0 top-0 h-screen w-72 flex-col bg-white border-r border-slate-100 p-6 z-40", className)}>
      <div className="mb-10 px-2 flex items-center gap-3">
        <div className="h-10 w-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/30">
          <Activity className="h-6 w-6 text-white" />
        </div>
        <span className="text-xl font-black text-slate-900 tracking-tight">MediSync</span>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Main Menu</p>
        {links.map((link) => (
          <SidebarItem key={link.href} {...link} />
        ))}
        
        <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-6 mb-2">Systems</p>
        <SidebarItem href="/notifications" icon={<Bell />} label="Alerts" />
        <SidebarItem href="/settings" icon={<Settings />} label="Settings" />
      </div>

      <div className="mt-auto border-t border-slate-50 pt-6">
        <button 
          onClick={() => logout()}
          className="flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all duration-300 group"
        >
          <div className="transition-transform group-hover:-translate-x-1">
            <LogOut className="h-5 w-5" />
          </div>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

function SidebarItem({ href, icon, label }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/patient/dashboard" && pathname.startsWith(href));

  return (
    <Link href={href} className="relative group">
      <div
        className={cn(
          "flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-300",
          isActive
            ? "bg-primary-50 text-primary-600"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        <div className={cn(
          "flex h-5 w-5 items-center justify-center transition-transform group-hover:scale-110",
          isActive ? "text-primary-600" : "text-slate-400 group-hover:text-slate-900"
        )}>
          {React.cloneElement(icon as React.ReactElement, { size: 20 })}
        </div>
        <span className="tracking-tight">{label}</span>
        
        {isActive && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 rounded-r-full bg-primary-600"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </div>
    </Link>
  );
}
