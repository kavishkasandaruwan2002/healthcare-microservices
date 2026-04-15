"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import { Sidebar } from '@/components/ui/Sidebar'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle, 
  ChevronRight,
  TrendingUp,
  Stethoscope,
  Filter,
  ArrowLeft,
  Settings,
  MoreVertical,
  Bell,
  Activity,
  ShieldCheck,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'

interface TimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
}

const mockSlots: TimeSlot[] = [
  { id: '1', time: '09:00 AM', isAvailable: true },
  { id: '2', time: '10:00 AM', isAvailable: false },
  { id: '3', time: '11:00 AM', isAvailable: true },
  { id: '4', time: '12:00 PM', isAvailable: true },
  { id: '5', time: '02:00 PM', isAvailable: false },
  { id: '6', time: '03:30 PM', isAvailable: true },
]

export default function DoctorSchedule() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  
  const [selectedDate, setSelectedDate] = useState('April 15, 2026 Today')
  const [slots, setSlots] = useState<TimeSlot[]>(mockSlots)
  const [activeTab, setActiveTab] = useState('availability')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null

  const toggleSlot = (id: string) => {
    setSlots(slots.map(s => s.id === id ? { ...s, isAvailable: !s.isAvailable } : s))
    toast.success('Availability updated!')
  }

  const deleteSlot = (id: string) => {
    setSlots(slots.filter(s => s.id !== id))
    toast.error('Time slot removed.')
  }

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
            <div className="flex items-center gap-2 mb-2 font-bold text-primary-600 text-sm uppercase tracking-widest">
              <Calendar className="h-4 w-4" /> Practice Intel
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Manage Practice Schedule</h1>
            <p className="text-slate-500 font-medium italic">Configure your availability and manage patient appointments.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-all hover:bg-slate-50 hover:text-primary-600">
              <Bell className="h-5 w-5" />
            </button>
            <AnimatedButton className="h-12 gap-2 shadow-none" onClick={() => router.push('/doctor/dashboard')}>
              <ArrowLeft className="h-4 w-4" /> Back to Overview
            </AnimatedButton>
          </motion.div>
        </header>

        <div className="grid gap-10 lg:grid-cols-4">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-10">
            {/* Control Tabs */}
            <div className="flex gap-4 p-1.5 bg-slate-200/50 rounded-2xl w-fit">
               {['availability', 'sessions', 'settings'].map((tab) => (
                 <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                 >
                   {tab}
                 </button>
               ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'availability' && (
                <motion.div
                  key="availability"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">Daily Slots: {selectedDate}</h3>
                    <AnimatedButton size="sm" className="h-10 gap-2">
                       <Plus className="h-4 w-4" /> Add Slot
                    </AnimatedButton>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {slots.map((slot, i) => (
                      <motion.div
                        key={slot.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <GlassCard className="p-0 border-none shadow-sm overflow-hidden group">
                           <div className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <div className="p-3 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all shadow-inner">
                                  <Clock className="h-6 w-6" />
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-rose-300 hover:text-rose-600" onClick={() => deleteSlot(slot.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                              <h4 className="text-xl font-black text-slate-900 mb-6">{slot.time}</h4>
                              <AnimatedButton 
                                variant={slot.isAvailable ? "primary" : "outline"} 
                                className="w-full h-11"
                                onClick={() => toggleSlot(slot.id)}
                              >
                                {slot.isAvailable ? 'Active' : 'Private'}
                              </AnimatedButton>
                           </div>
                        </GlassCard>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'sessions' && (
                <motion.div
                  key="sessions"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                   <GlassCard className="border-dashed border-slate-200 bg-transparent py-32 text-center shadow-none">
                      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-300 mx-auto">
                        <Activity className="h-10 w-10" />
                      </div>
                      <h4 className="text-xl font-bold text-slate-900">Advanced Analytics Hub</h4>
                      <p className="text-slate-500 mt-2 max-w-sm mx-auto font-medium">Session performance metrics will be automatically populated based on your consultation data.</p>
                      <button className="mt-8 text-primary-600 font-bold uppercase tracking-widest text-xs">Request Full Data Audit</button>
                   </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-10">
             <GlassCard className="bg-slate-900 text-white border-none shadow-2xl">
                <ShieldCheck className="h-8 w-8 text-primary-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">Platform Policy</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">Ensure your presence 5 minutes before scheduled digital consults.</p>
                <div className="h-[1px] w-full bg-white/10 mb-6" />
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                   <span>Identity Status</span>
                   <span className="text-emerald-400">Verified</span>
                </div>
             </GlassCard>

             <div className="space-y-4 px-1">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Quick Config</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Weekly Hours', msg: 'Set standard schedule' },
                    { label: 'Out of Clinic', msg: 'Bulk block time slots' },
                    { label: 'Virtual Only', msg: 'Toggle session type' },
                  ].map((config) => (
                    <button key={config.label} className="w-full text-left p-4 rounded-2xl bg-white border border-slate-100 shadow-xs hover:shadow-md transition-all group">
                       <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                          {config.label}
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:translate-x-1" />
                       </div>
                       <p className="text-xs text-slate-500 italic">{config.msg}</p>
                    </button>
                  ))}
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  )
}
