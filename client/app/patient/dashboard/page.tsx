"use client"

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import { Sidebar } from '@/components/ui/Sidebar'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import {
  Calendar,
  Clock,
  Activity,
  Video,
  Search,
  Plus,
  Bell,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  HeartPulse,
  BrainCircuit,
  Stethoscope,
  ShieldCheck,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

const chartData = [
  { name: 'Mon', value: 72 },
  { name: 'Tue', value: 75 },
  { name: 'Wed', value: 68 },
  { name: 'Thu', value: 80 },
  { name: 'Fri', value: 78 },
  { name: 'Sat', value: 85 },
  { name: 'Sun', value: 82 },
]

export default function PatientDashboard() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    const fetchAppointments = async () => {
      try {
        const res = await api.get(`/appointments/patient/${user?.id || 'me'}`)
        setAppointments(res.status === 200 ? res.data : [])
      } catch (err) {
        console.error('Failed to fetch appointments')
      } finally {
        setLoading(false)
      }
    }
    fetchAppointments()
  }, [user, isAuthenticated, router])

  if (!hasMounted || !isAuthenticated) return null

  const stats = [
    { label: 'Upcoming', value: appointments.length, icon: <Calendar className="h-6 w-6" />, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Consultations', value: '12', icon: <Video className="h-6 w-6" />, color: 'text-accent-600', bg: 'bg-accent-50' },
    { label: 'Heart Rate', value: '72 bpm', icon: <HeartPulse className="h-6 w-6" />, color: 'text-rose-600', bg: 'bg-rose-50', trend: '+2%' },
    { label: 'Health Score', value: '94/100', icon: <Activity className="h-6 w-6" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="PATIENT" />

      <main className="flex-1 lg:ml-[80px] xl:ml-[280px] p-4 md:p-8 pt-20 lg:pt-8 transition-all duration-300">
        {/* Header */}
        <header className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back, {user?.name || 'Guest'}!</h1>
            <p className="text-slate-500">Here&apos;s a summary of your health and upcoming appointments.</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-all hover:bg-slate-50 hover:text-primary-600">
              <Bell className="h-5 w-5" />
            </button>
            <AnimatedButton asChild className="h-12 gap-2 shadow-none w-full sm:w-auto">
              <Link href="/patient/appointments">
                <Plus className="h-4 w-4" /> Book Appointment
              </Link>
            </AnimatedButton>
          </motion.div>
        </header>

        {/* Stats Grid */}
        <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard className="flex items-center gap-4 border-none shadow-sm hover:shadow-md transition-shadow">
                <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl", stat.bg, stat.color)}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
                    {stat.trend && (
                      <span className="flex items-center text-xs font-bold text-emerald-600">
                        <TrendingUp className="mr-0.5 h-3 w-3" /> {stat.trend}
                      </span>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-10 lg:grid-cols-3">
          {/* Main Content Areas */}
          <div className="lg:col-span-2 space-y-10">
            {/* Health Activity Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <GlassCard className="p-0 overflow-hidden border-none shadow-sm h-full">
                <div className="p-6 pb-0">
                  <h3 className="text-xl font-bold text-slate-900">Heart Rate Monitoring</h3>
                  <p className="text-sm text-slate-500">Stability data from your connected devices</p>
                </div>
                <div className="h-[300px] w-full p-4 min-h-[300px]">
                  {hasMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </GlassCard>
            </motion.div>

            {/* Appointments List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Upcoming Appointments</h3>
                <button
                  onClick={() => router.push('/patient/appointments')}
                  className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 group"
                >
                  View All <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
              <div className="space-y-4">
                {appointments.length > 0 ? (
                  appointments.map((apt: { id: string; doctorName?: string; reason?: string; date?: string; time?: string }, i) => (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className="group flex flex-col items-start gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-lg hover:border-primary-100 md:flex-row md:items-center"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                        <Stethoscope className="h-7 w-7" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 group-hover:text-primary-900 transition-colors">Dr. {apt.doctorName || 'Specialist'}</h4>
                        <p className="text-sm text-slate-500 italic">{apt.reason || 'General Consultation'}</p>
                      </div>
                      <div className="flex flex-col items-start gap-1 md:items-end md:px-8">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <Calendar className="h-4 w-4 text-primary-500" /> {apt.date || 'April 20, 2026'}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <Clock className="h-4 w-4 text-primary-500" /> {apt.time || '10:30 AM'}
                        </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <AnimatedButton variant="glass" size="sm" className="flex-1 md:flex-none h-10 px-6">
                          Details
                        </AnimatedButton>
                        <AnimatedButton variant="primary" size="sm" className="flex-1 md:flex-none h-10 px-6 bg-primary-600 shadow-primary-500/20" onClick={() => router.push(`/telemedicine/${apt.id}`)}>
                          Join Call
                        </AnimatedButton>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <GlassCard className="flex flex-col items-center justify-center py-16 border-dashed border-slate-200 bg-transparent text-center shadow-none">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-300 ring-8 ring-slate-50/50">
                      <Calendar className="h-10 w-10" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900">No appointments scheduled</h4>
                    <p className="max-w-[280px] text-slate-500 mt-2 mb-8 italic">Your upcoming virtual consultations will appear here.</p>
                    <AnimatedButton variant="outline" size="md" asChild>
                      <Link href="/doctor">
                        Find a Doctor
                      </Link>
                    </AnimatedButton>
                  </GlassCard>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Sidebar Widgets */}
          <div className="space-y-10">
            {/* AI Symptom Checker Widget */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
            >
              <GlassCard className="bg-linear-to-br from-primary-600 to-accent-600 text-white border-none shadow-2xl shadow-primary-500/30 overflow-hidden relative group">
                <div className="relative z-10">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-inner">
                    <BrainCircuit className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold leading-tight">AI Symptom <br /> Checker</h3>
                  <p className="mb-8 text-primary-50 text-sm font-medium leading-relaxed opacity-90">
                    Proprietary diagnostic engine to assess your health in seconds.
                  </p>
                  <AnimatedButton variant="glass" className="w-full bg-white text-primary-900 hover:bg-slate-100 border-none font-bold shadow-lg">
                    Check Symptoms Now
                  </AnimatedButton>
                </div>
                {/* Decorative element */}
                <div className="absolute -right-4 -bottom-4 h-32 w-32 rounded-full bg-white/10 blur-3xl group-hover:scale-150 transition-transform duration-700" />
              </GlassCard>
            </motion.div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h3 className="text-2xl font-extrabold text-[#0f172a] px-1 tracking-tight">Actions</h3>
              <div className="grid gap-4">
                {[
                  { 
                    label: 'Upload Record', 
                    icon: <Plus className="h-6 w-6" />, 
                    bg: 'bg-[#eff6ff] text-[#2563eb]',
                    arrowColor: 'text-slate-200',
                    path: '/patient/records/upload'
                  },
                  { 
                    label: 'Pharmacy Near Me', 
                    icon: <Search className="h-6 w-6" />, 
                    bg: 'bg-[#fffbeb] text-[#d97706]',
                    arrowColor: 'text-[#2563eb]',
                    path: '/patient/pharmacy'
                  },
                  { 
                    label: 'Prescriptions', 
                    icon: <FileText className="h-6 w-6" />, 
                    bg: 'bg-[#fff1f2] text-[#e11d48]',
                    arrowColor: 'text-slate-200',
                    path: '/patient/prescriptions'
                  },
                ].map((action, i) => (
                  <motion.button
                    key={action.label}
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(action.path)}
                    className="flex w-full items-center justify-between rounded-[2rem] border border-slate-50 bg-white p-6 font-bold text-[#1e293b] shadow-sm transition-all hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 active:scale-95 group"
                  >
                    <span className="flex items-center gap-5">
                      <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner", action.bg)}>
                        {action.icon}
                      </div>
                      <span className="text-xl font-bold tracking-tight">{action.label}</span>
                    </span>
                    <ArrowRight className={cn("h-5 w-5 transition-transform group-hover:translate-x-1", action.arrowColor)} />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Support/Emergency Widget */}
            <GlassCard className="border-2 border-dashed border-blue-100 bg-white/50 p-8 text-center shadow-lg shadow-blue-500/5">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 border-2 border-rose-100">
                  <ShieldCheck className="h-8 w-8 text-[#e11d48]" />
                </div>
              </div>
              <h4 className="text-xl font-extrabold text-[#881337] mb-1">Need Urgent Help?</h4>
              <p className="text-sm text-[#e11d48] mb-6 font-bold italic tracking-tight italic">Our emergency line is available 24/7</p>
              
              <AnimatedButton 
                variant="outline" 
                className="w-full h-14 rounded-3xl border-2 border-[#e11d48]/20 bg-white text-[#e11d48] hover:bg-[#e11d48] hover:text-white hover:border-[#e11d48] font-bold text-lg transition-all shadow-sm active:scale-95"
                onClick={() => router.push('/patient/support/emergency')}
              >
                Call Support
              </AnimatedButton>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  )
}
