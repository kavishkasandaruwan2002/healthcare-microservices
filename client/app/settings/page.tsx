"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/ui/Sidebar';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Smartphone, 
  Mail, 
  CreditCard,
  LogOut,
  Save,
  Moon,
  Sun,
  Globe,
  Camera
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsDashboard() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!mounted || !isAuthenticated) return null;

  // Normalize role to string
  const getRole = () => {
    if (!user?.role) return "PATIENT";
    if (user.role.includes("DOCTOR")) return "DOCTOR";
    if (user.role.includes("ADMIN")) return "ADMIN";
    return "PATIENT";
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="h-5 w-5" /> },
    { id: 'account', label: 'Account Security', icon: <Shield className="h-5 w-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" /> },
    { id: 'preferences', label: 'Preferences', icon: <Sun className="h-5 w-5" /> },
    { id: 'billing', label: 'Billing & Plans', icon: <CreditCard className="h-5 w-5" /> },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar role={getRole() as any} />

      <main className="flex-1 lg:ml-[80px] xl:ml-[280px] p-4 md:p-8 pt-20 lg:pt-8 transition-all duration-300">
        
        {/* Header */}
        <header className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Settings</h1>
            <p className="text-slate-500 font-medium">Manage your account settings and preferences.</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <AnimatedButton onClick={() => {}} className="gap-2 shadow-xl shadow-primary-500/20 px-8 py-6 rounded-2xl text-md font-bold">
              <Save className="h-5 w-5" /> Save Changes
            </AnimatedButton>
          </motion.div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Settings Navigation */}
          <motion.nav 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full lg:w-72 shrink-0 space-y-2"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-bold",
                    isActive 
                      ? "bg-white text-primary-600 shadow-md shadow-slate-200/50 translate-x-2" 
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-xl transition-colors", 
                    isActive ? "bg-primary-50 text-primary-600" : "bg-slate-100 text-slate-400"
                  )}>
                    {tab.icon}
                  </div>
                  {tab.label}
                </button>
              );
            })}
          </motion.nav>

          {/* Settings Content Area */}
          <div className="flex-1 space-y-8">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Avatar Section */}
                  <GlassCard className="p-8 border-none shadow-sm flex flex-col sm:flex-row items-center gap-8 bg-white rounded-3xl">
                    <div className="relative group">
                      <div className="h-28 w-28 rounded-full bg-linear-to-br from-primary-100 to-primary-200 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                        <User className="h-12 w-12 text-primary-600" />
                      </div>
                      <button className="absolute bottom-0 right-0 p-2.5 bg-primary-600 text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform group-hover:bg-primary-500">
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-center sm:text-left flex-1">
                      <h3 className="text-2xl font-bold text-slate-900 mb-1">{user?.name || 'My Profile'}</h3>
                      <p className="text-slate-500 font-medium mb-4">{user?.email || 'patient@example.com'}</p>
                      <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                        <span className="px-4 py-1.5 bg-primary-50 text-primary-700 font-bold rounded-full text-sm">
                          {getRole() === "PATIENT" ? "Patient Account" : getRole() === "DOCTOR" ? "Doctor Account" : "Admin"}
                        </span>
                        <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 font-bold rounded-full text-sm">
                          Active Status
                        </span>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Personal Info Form */}
                  <GlassCard className="p-8 border-none shadow-sm bg-white rounded-3xl space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Full Name</label>
                        <input type="text" defaultValue={user?.name || ''} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all font-medium text-slate-900" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Email Address</label>
                        <input type="email" defaultValue={user?.email || ''} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all font-medium text-slate-900" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Phone Number</label>
                        <input type="tel" defaultValue="+1 (555) 123-4567" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all font-medium text-slate-900" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Date of Birth</label>
                        <input type="date" defaultValue="1990-01-01" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all font-medium text-slate-900" />
                      </div>
                    </div>
                  </GlassCard>
                </div>
              )}

              {activeTab === 'account' && (
                <div className="space-y-6">
                  {/* Security Form */}
                  <GlassCard className="p-8 border-none shadow-sm bg-white rounded-3xl space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Change Password</h3>
                    <div className="space-y-5">
                      <div className="space-y-2 max-w-lg">
                        <label className="text-sm font-bold text-slate-700">Current Password</label>
                        <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all font-medium text-slate-900" />
                      </div>
                      <div className="space-y-2 max-w-lg">
                        <label className="text-sm font-bold text-slate-700">New Password</label>
                        <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all font-medium text-slate-900" />
                      </div>
                      <div className="space-y-2 max-w-lg">
                        <label className="text-sm font-bold text-slate-700">Confirm New Password</label>
                        <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all font-medium text-slate-900" />
                      </div>
                      <AnimatedButton className="px-6 py-3 mt-2 font-bold" variant="outline">
                         Update Password
                      </AnimatedButton>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-8 border border-rose-100 shadow-sm bg-rose-50/30 rounded-3xl space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-rose-900 mb-1">Danger Zone</h3>
                        <p className="text-sm text-rose-700">Permanently delete your account and all associated data.</p>
                      </div>
                    </div>
                    <button className="px-6 py-3 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold hover:bg-rose-50 hover:border-rose-300 transition-colors shadow-sm active:scale-95">
                      Delete Account
                    </button>
                  </GlassCard>
                </div>
              )}

              {activeTab === 'notifications' && (
                <GlassCard className="p-8 border-none shadow-sm bg-white rounded-3xl space-y-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Notification Preferences</h3>
                  
                  <div className="space-y-6">
                    {[
                      { title: "Appointment Reminders", desc: "Receive alerts for an upcoming consultation", checked: true },
                      { title: "Prescription Updates", desc: "Get notified when a new prescription is added", checked: true },
                      { title: "Marketing Emails", desc: "Health tips and promotional offers", checked: false },
                      { title: "System Alerts", desc: "Critical system updates or security alerts", checked: true },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="font-bold text-slate-900">{item.title}</p>
                          <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
                        </div>
                        <div className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked={item.checked} />
                          <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              {activeTab === 'preferences' && (
                <GlassCard className="p-8 border-none shadow-sm bg-white rounded-3xl space-y-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">App Preferences</h3>
                  
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Globe className="h-4 w-4" /> Language
                      </label>
                      <select className="w-full sm:w-80 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-slate-900 cursor-pointer">
                        <option>English (US)</option>
                        <option>Spanish</option>
                        <option>French</option>
                        <option>Italino</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Moon className="h-4 w-4" /> Theme
                      </label>
                      <div className="flex gap-4">
                        <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-primary-600 bg-primary-50 text-primary-700 font-bold transition-all">
                          <Sun className="h-4 w-4" /> Light
                        </button>
                        <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-500 hover:border-slate-300 font-bold transition-all">
                          <Moon className="h-4 w-4" /> Dark
                        </button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              )}

              {activeTab === 'billing' && (
                <GlassCard className="p-8 border-none shadow-sm bg-white rounded-3xl flex flex-col items-center justify-center text-center py-16">
                  <div className="h-20 w-20 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center mb-4">
                    <CreditCard className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Billing Information</h3>
                  <p className="text-slate-500 max-w-md">Manage your payment methods and subscriptions via Stripe.</p>
                  <AnimatedButton className="mt-8 px-6 bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/20">
                    Open Billing Portal
                  </AnimatedButton>
                </GlassCard>
              )}
            </motion.div>
          </div>

        </div>
      </main>
    </div>
  );
}
