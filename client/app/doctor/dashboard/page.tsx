"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import { Sidebar } from '@/components/ui/Sidebar'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { 
  Calendar, 
  Clock, 
  Users, 
  Stethoscope, 
  Video, 
  CheckCircle, 
  XCircle, 
  Bell, 
  ArrowRight,
  TrendingUp,
  Activity,
  UserCheck,
  ClipboardList
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function DoctorDashboard() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    const fetchAppointments = async () => {
      try {
        const res = await api.get(`/appointments/doctor/${user?.id || 'me'}`)
        setAppointments(res.status === 200 ? res.data : [])
      } catch (err) {
        console.error('Failed to fetch doctor appointments')
      } finally {
        setLoading(false)
      }
    }
    fetchAppointments()
  }, [user, isAuthenticated, router])

  if (!isAuthenticated) return null

  const stats = [
    { label: 'Today Orders', value: appointments.length, icon: <ClipboardList className="h-6 w-6" />, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Patient Count', value: '42', icon: <Users className="h-6 w-6" />, color: 'text-accent-600', bg: 'bg-accent-50' },
    { label: 'Avg Rating', value: '4.9', icon: <UserCheck className="h-6 w-6" />, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+0.2' },
    { label: 'Consultations', value: '128', icon: <Video className="h-6 w-6" />, color: 'text-rose-600', bg: 'bg-rose-50' },
  ]

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="DOCTOR" />
      
      <main className="flex-1 lg:ml-[80px] xl:ml-[280px] p-4 md:p-8 pt-20 lg:pt-8 transition-all duration-300">
        {/* Header */}
        <header className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome, Dr. {user?.name || 'Practitioner'}!</h1>
            <p className="text-slate-500">You have {appointments.length} consultations scheduled for today.</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-all hover:bg-slate-50 hover:text-primary-600">
              <Bell className="h-5 w-5" />
            </button>
            <AnimatedButton className="h-12 gap-2 shadow-none" onClick={() => router.push('/doctor/schedule')}>
              <Calendar className="h-4 w-4" /> Manage Schedule
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
          {/* Appointment Queue */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Consultation Queue</h3>
              <div className="flex gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 ring-1 ring-blue-100">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" /> Live Now
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {appointments.length > 0 ? (
                appointments.map((apt: any, i) => (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="group flex flex-col items-start gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:border-primary-100 md:flex-row md:items-center"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors capitalize text-lg font-bold">
                      {apt.patientName?.charAt(0) || 'P'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 group-hover:text-primary-900 transition-colors">{apt.patientName || 'Patient'}</h4>
                      <p className="text-sm text-slate-500 italic">{apt.reason || 'General Checkup'}</p>
                    </div>
                    <div className="flex items-center gap-6 md:px-6">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Clock className="h-4 w-4 text-primary-500" /> {apt.time || '10:30 AM'}
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                        Confirmed
                      </span>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <AnimatedButton variant="ghost" size="sm" className="flex-1 md:flex-none h-10">
                        Patient Info
                      </AnimatedButton>
                      <AnimatedButton variant="primary" size="sm" className="flex-1 md:flex-none h-10 px-6 bg-primary-600 shadow-primary-500/20" onClick={() => router.push(`/telemedicine/${apt.id}`)}>
                        Start Call
                      </AnimatedButton>
                    </div>
                  </motion.div>
                ))
              ) : (
                <GlassCard className="flex flex-col items-center justify-center py-20 border-dashed border-slate-200 bg-transparent text-center shadow-none">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-300 ring-8 ring-slate-50/50">
                    <Stethoscope className="h-10 w-10" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">Your queue is empty</h4>
                  <p className="max-w-[280px] text-slate-500 mt-2 mb-8 italic">No upcoming consultations for today. Take a break!</p>
                  <AnimatedButton variant="outline" size="md" onClick={() => router.push('/doctor/schedule')}>
                    Check Schedule
                  </AnimatedButton>
                </GlassCard>
              )}
            </div>
          </div>

          {/* Quick Stats & Actions */}
          <div className="space-y-10">
            {/* Daily Goal Widget */}
            <GlassCard className="border-none shadow-sm bg-white">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Daily Goal</h3>
                <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg">75%</span>
              </div>
              <div className="relative h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "75%" }}
                  className="absolute h-full bg-primary-600"
                />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-medium text-slate-400">
                <span>9/12 Consultations</span>
                <span>3 Left</span>
              </div>
            </GlassCard>

            {/* Quick Consultation Widget */}
            <GlassCard className="bg-linear-to-br from-slate-900 to-slate-800 text-white border-none shadow-2xl shadow-slate-900/20">
              <h3 className="text-xl font-bold mb-4">Instant Meeting</h3>
              <p className="text-slate-400 text-sm mb-6">Create a one-time meeting link to invite a patient immediately.</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Patient Email" 
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-sm outline-none focus:border-primary-500 transition-colors"
                />
                <button className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg hover:bg-primary-700 transition-colors">
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </GlassCard>

            {/* Notifications / Alerts */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 px-1">Alerts</h3>
              <div className="space-y-3">
                {[
                  { title: 'New Review', msg: 'A patient left you a 5-star review!', time: '10m ago', icon: <UserCheck className="text-emerald-600" />, bg: 'bg-emerald-50' },
                  { title: 'Update', msg: 'New platform features are live.', time: '2h ago', icon: <Activity className="text-blue-600" />, bg: 'bg-blue-50' },
                ].map((alert, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", alert.bg)}>
                      {alert.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-slate-900 truncate">{alert.title}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{alert.time}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{alert.msg}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
