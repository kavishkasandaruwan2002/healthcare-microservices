"use client";

import { Sidebar } from "@/components/ui/Sidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { Settings, User, Bell, Shield, Moon, Globe } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={user?.role?.includes('DOCTOR') ? 'DOCTOR' : 'PATIENT'} />

      <main className="flex-1 lg:ml-[80px] xl:ml-[280px] p-4 md:p-8 pt-20 lg:pt-8 transition-all duration-300">
        <header className="mb-10">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary-600" />
            Account Settings
          </h1>
          <p className="text-slate-500 font-medium font-italic">Manage your profile, security, and preferences.</p>
        </header>

        <div className="grid gap-8 max-w-4xl">
          <GlassCard className="p-8 border-none shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <User className="h-5 w-5 text-primary-500" />
              General Information
            </h3>
            <div className="grid gap-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Full Name</label>
                  <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 text-slate-900 font-bold">{user?.name || 'User'}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Email Address</label>
                  <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 text-slate-900 font-bold">{user?.email}</div>
                </div>
              </div>
            </div>
          </GlassCard>

          <div className="grid md:grid-cols-2 gap-8">
            <GlassCard className="p-8 border-none shadow-sm hover:shadow-md transition-shadow">
               <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                 <Bell className="h-5 w-5 text-accent-500" />
                 Notifications
               </h3>
               <p className="text-sm text-slate-500 mb-6">Receive alerts for new messages, appointments, and system updates.</p>
               <AnimatedButton variant="outline" className="w-full">Configure Alerts</AnimatedButton>
            </GlassCard>

            <GlassCard className="p-8 border-none shadow-sm hover:shadow-md transition-shadow">
               <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                 <Shield className="h-5 w-5 text-emerald-500" />
                 Privacy & Security
               </h3>
               <p className="text-sm text-slate-500 mb-6">Manage your password, two-factor authentication, and data sharing.</p>
               <AnimatedButton variant="outline" className="w-full">Security Hub</AnimatedButton>
            </GlassCard>

            <GlassCard className="p-8 border-none shadow-sm hover:shadow-md transition-shadow">
               <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                 <Moon className="h-5 w-5 text-indigo-500" />
                 Appearance
               </h3>
               <p className="text-sm text-slate-500 mb-6">Customize the application theme and visual layout.</p>
               <AnimatedButton variant="outline" className="w-full">UI Preferences</AnimatedButton>
            </GlassCard>

            <GlassCard className="p-8 border-none shadow-sm hover:shadow-md transition-shadow">
               <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                 <Globe className="h-5 w-5 text-amber-500" />
                 Language & Region
               </h3>
               <p className="text-sm text-slate-500 mb-6">Set your preferred language and time zone for communications.</p>
               <AnimatedButton variant="outline" className="w-full">Local Settings</AnimatedButton>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  );
}
