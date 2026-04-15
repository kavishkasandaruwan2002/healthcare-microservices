"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
  Users,
  User,
  Pill,
  ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useState } from "react";

interface SidebarProps {
  role: "PATIENT" | "DOCTOR" | "ADMIN";
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = {
    PATIENT: [
      { name: "Dashboard", href: "/patient/dashboard", icon: <LayoutDashboard /> },
      { name: "Appointments", href: "/patient/appointments", icon: <Calendar /> },
      { name: "Prescriptions", href: "/patient/prescriptions", icon: <Pill /> },
      { name: "Medical Records", href: "/patient/records", icon: <FileText /> },
      { name: "Telemedicine", href: "/telemedicine", icon: <Video /> },
      { name: "Messages", href: "/patient/messages", icon: <MessageSquare /> },
    ],
    DOCTOR: [
      { name: "Dashboard", href: "/doctor/dashboard", icon: <LayoutDashboard /> },
      { name: "Appointments", href: "/doctor/appointments", icon: <ClipboardList /> },
      { name: "Schedule", href: "/doctor/schedule", icon: <Calendar /> },
      { name: "Availability", href: "/doctor/availability", icon: <Clock className="w-5 h-5" /> },
      { name: "Prescriptions", href: "/doctor/prescriptions", icon: <Pill /> },
      { name: "Patients", href: "/doctor/patients", icon: <Users /> },
      { name: "Consultations", href: "/doctor/consultations", icon: <Video /> },
      { name: "Messages", href: "/doctor/messages", icon: <MessageSquare /> },
      { name: "Profile", href: "/doctor/profile", icon: <User /> },
    ],
    ADMIN: [
      { name: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard /> },
      { name: "Users", href: "/admin/users", icon: <User /> },
      { name: "Verification", href: "/admin/verify", icon: <Activity /> },
      { name: "Reports", href: "/admin/reports", icon: <FileText /> },
    ],
  };

  const currentMenu = menuItems[role] || [];

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-xl lg:hidden"
      >
        {isOpen ? <X /> : <Menu />}
      </button>

      <motion.aside
        initial={false}
        animate={{ width: isOpen ? "280px" : "80px" }}
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-slate-200 bg-white transition-all duration-300 ease-in-out",
          !isOpen && "hidden lg:block"
        )}
      >
        <div className="flex h-full flex-col p-4">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg">
              <Activity className="h-6 w-6" />
            </div>
            {isOpen && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xl font-bold tracking-tight text-slate-900"
              >
                HealthCare
              </motion.span>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {currentMenu.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div className={cn(
                    "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300",
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
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {item.name}
                      </motion.span>
                    )}
                    {isActive && (
                      <motion.div 
                        layoutId="activeBar"
                        className="absolute right-0 h-6 w-1 rounded-l-full bg-primary-600"
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="pt-4 mt-auto border-t border-slate-100">
            <Link href="/settings">
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all">
                <Settings className="h-5 w-5" />
                {isOpen && <span>Settings</span>}
              </div>
            </Link>
            <button 
              onClick={() => logout()}
              className="mt-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-rose-500 hover:bg-rose-50 transition-all"
            >
              <LogOut className="h-5 w-5" />
              {isOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

// Import Clock icon
import { Clock } from "lucide-react";
