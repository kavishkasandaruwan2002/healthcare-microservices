"use client"

import { useState, useEffect, useCallback } from 'react'
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
  Bell,
  LogOut,
  ArrowLeft,
  Activity,
  CheckCircle,
  AlertCircle,
  Edit2,
  X,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'

interface AvailabilitySlot {
  id: string
  date: string
  startTime: string
  endTime: string
  isBooked: boolean
}

interface DoctorProfile {
  id: string
  name: string
  email: string
  availabilitySlots?: AvailabilitySlot[]
  [key: string]: any
}

export default function DoctorAvailability() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()

  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null)
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)
  const [showAddSlot, setShowAddSlot] = useState(false)
  const [newSlot, setNewSlot] = useState({ date: '', startTime: '', endTime: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingSlot, setEditingSlot] = useState<string | null>(null)
  const [editData, setEditData] = useState({ date: '', startTime: '', endTime: '' })

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (!hasMounted) return
    if (!isAuthenticated) {
      router.push('/login')
    } else if (user?.role !== 'ROLE_DOCTOR' && user?.role !== 'DOCTOR') {
      router.push('/')
    }
  }, [isAuthenticated, user, router, hasMounted])

  const fetchDoctorProfile = useCallback(async () => {
    try {
      setLoading(true)
      if (user?.id) {
        const res = await api.get(`/doctors/${user.id}`)
        setDoctorProfile(res.data)
        setSlots(res.data.availabilitySlots || [])
      }
    } catch (err: any) {
      console.error('Failed to fetch doctor profile:', err)
      toast.error('Failed to load availability slots')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isAuthenticated && user?.id && hasMounted) {
      fetchDoctorProfile()
    }
  }, [isAuthenticated, user?.id, hasMounted, fetchDoctorProfile])

  const handleAddSlot = async () => {
    if (!newSlot.date || !newSlot.startTime || !newSlot.endTime) {
      toast.error('Please fill all slot details')
      return
    }

    // Validate times
    if (newSlot.startTime >= newSlot.endTime) {
      toast.error('End time must be after start time')
      return
    }

    try {
      setIsSubmitting(true)
      if (!doctorProfile?.id) {
        toast.error('Doctor profile not found')
        return
      }

      await api.post(`/doctors/${doctorProfile.id}/slots`, newSlot)
      toast.success('Availability slot added successfully!')
      setNewSlot({ date: '', startTime: '', endTime: '' })
      setShowAddSlot(false)
      await fetchDoctorProfile()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add slot')
      console.error('Add slot error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this slot?')) return

    try {
      if (!doctorProfile?.id) {
        toast.error('Doctor profile not found')
        return
      }
      await api.delete(`/doctors/${doctorProfile.id}/slots/${slotId}`)
      toast.success('Slot deleted successfully')
      await fetchDoctorProfile()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete slot')
      console.error('Delete error:', err)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!hasMounted || !isAuthenticated) return null

  const bookedSlots = slots.filter(s => s.isBooked)
  const availableSlots = slots.filter(s => !s.isBooked)

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
            <div className="flex items-center gap-2 mb-2">
              <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Manage Availability
            </h1>
            <p className="text-slate-500 font-medium">
              Set your consultation time slots and manage your schedule
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-all hover:bg-slate-50 hover:text-blue-600">
              <Bell className="h-5 w-5" />
            </button>
            <AnimatedButton 
              onClick={() => setShowAddSlot(!showAddSlot)} 
              className="h-12 gap-2"
            >
              <Plus className="h-4 w-4" /> Add Slot
            </AnimatedButton>
            <button onClick={handleLogout} className="flex h-12 w-12 items-center justify-center rounded-2xl hover:bg-red-50 transition-colors">
              <LogOut className="h-5 w-5 text-red-600" />
            </button>
          </motion.div>
        </header>

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Activity className="h-10 w-10 text-blue-600 animate-spin mb-4" />
            <p className="text-slate-500">Loading availability slots...</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-6">
              <GlassCard className="p-6 border-none shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Total Slots</p>
                    <p className="text-2xl font-bold text-slate-900">{slots.length}</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6 border-none shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Available</p>
                    <p className="text-2xl font-bold text-slate-900">{availableSlots.length}</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6 border-none shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Booked</p>
                    <p className="text-2xl font-bold text-slate-900">{bookedSlots.length}</p>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Add Slot Form */}
            <AnimatePresence>
              {showAddSlot && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <GlassCard className="p-8 border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50/30">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-slate-900">Create New Availability Slot</h3>
                      <button 
                        onClick={() => setShowAddSlot(false)}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <X className="h-5 w-5 text-slate-400" />
                      </button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                      <div className="space-y-2">
                        <Label>Date *</Label>
                        <Input 
                          type="date"
                          value={newSlot.date}
                          onChange={e => setNewSlot({...newSlot, date: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Start Time *</Label>
                        <Input 
                          type="time"
                          value={newSlot.startTime}
                          onChange={e => setNewSlot({...newSlot, startTime: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time *</Label>
                        <Input 
                          type="time"
                          value={newSlot.endTime}
                          onChange={e => setNewSlot({...newSlot, endTime: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button 
                        onClick={() => setShowAddSlot(false)}
                        className="px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors font-bold text-slate-900"
                      >
                        Cancel
                      </button>
                      <AnimatedButton 
                        onClick={handleAddSlot} 
                        disabled={isSubmitting}
                        className="h-12"
                      >
                        {isSubmitting ? 'Adding...' : 'Add Slot'}
                      </AnimatedButton>
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Slots Grid */}
            <div className="space-y-6">
              {slots.length === 0 ? (
                <GlassCard className="p-16 text-center border-dashed border-slate-200 shadow-none">
                  <Calendar className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Availability Slots</h3>
                  <p className="text-slate-500 mb-6">Create your first availability slot to start accepting appointments</p>
                  <AnimatedButton onClick={() => setShowAddSlot(true)} className="mx-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add First Slot
                  </AnimatedButton>
                </GlassCard>
              ) : (
                <>
                  {/* Available Slots */}
                  {availableSlots.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                        Available Slots ({availableSlots.length})
                      </h3>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {availableSlots.map((slot, i) => (
                          <motion.div
                            key={slot.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <GlassCard className="p-6 border-l-4 border-l-emerald-500 group hover:shadow-lg transition-all">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <Calendar className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-slate-500">Date</p>
                                    <p className="text-sm font-bold text-slate-900">{slot.date}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteSlot(slot.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </button>
                              </div>

                              <div className="flex items-center gap-2 mb-4">
                                <Clock className="h-4 w-4 text-slate-400" />
                                <p className="text-sm font-bold text-slate-900">
                                  {slot.startTime} - {slot.endTime}
                                </p>
                              </div>

                              <div className="pt-4 border-t border-slate-200">
                                <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                                  ✓ Available
                                </span>
                              </div>
                            </GlassCard>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Booked Slots */}
                  {bookedSlots.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-rose-600" />
                        Booked Slots ({bookedSlots.length})
                      </h3>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {bookedSlots.map((slot, i) => (
                          <motion.div
                            key={slot.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <GlassCard className="p-6 border-l-4 border-l-rose-500 group hover:shadow-lg transition-all opacity-75">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                                    <Calendar className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-slate-500">Date</p>
                                    <p className="text-sm font-bold text-slate-900">{slot.date}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteSlot(slot.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </button>
                              </div>

                              <div className="flex items-center gap-2 mb-4">
                                <Clock className="h-4 w-4 text-slate-400" />
                                <p className="text-sm font-bold text-slate-900">
                                  {slot.startTime} - {slot.endTime}
                                </p>
                              </div>

                              <div className="pt-4 border-t border-slate-200">
                                <span className="inline-block px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold uppercase tracking-wider">
                                  🔒 Booked
                                </span>
                              </div>
                            </GlassCard>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">{children}</label>
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

function Input({ ...props }: InputProps) {
  return (
    <input 
      {...props} 
      className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50 disabled:bg-slate-50 transition-all" 
    />
  )
}