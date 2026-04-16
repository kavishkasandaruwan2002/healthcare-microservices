"use client"

import { useEffect, useState, useCallback } from 'react'
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
  ClipboardList,
  Edit2,
  Save,
  X,
  FileText,
  Plus,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

interface DoctorProfile {
  id: string
  name: string
  email: string
  specialization: string
  consultationFee: number
  bio: string
  phone: string
  yearsOfExperience: string
  qualification: string
  hospitalAffiliation: string
  status: string
  isVerified: boolean
  availabilitySlots?: { id: string, date: string, startTime: string, endTime: string, isBooked: boolean }[]
}

interface Appointment {
  id: string
  patientId: string
  patientName: string
  date: string
  time: string
  reason: string
  status: string
}

export default function DoctorDashboard() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState('overview')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<DoctorProfile>>({})
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)

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
      setProfileLoading(true)
      if (user?.id) {
        const res = await api.get(`/doctors/${user.id}`)
        setDoctorProfile(res.data)
        setEditData(res.data)
      }
    } catch (err: any) {
      console.error('Failed to fetch doctor profile:', err)
    } finally {
      setProfileLoading(false)
    }
  }, [user?.id])

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true)
      if (user?.id) {
        const res = await api.get(`/appointments/doctor/${user.id}`)
        setAppointments(res.status === 200 ? res.data : [])
      }
    } catch (err) {
      console.error('Failed to fetch appointments')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isAuthenticated && user?.id && hasMounted) {
      fetchDoctorProfile()
      fetchAppointments()
    }
  }, [isAuthenticated, user?.id, hasMounted, fetchDoctorProfile, fetchAppointments])

  const handleUpdateProfile = async () => {
    try {
      setLoading(true)
      if (!doctorProfile?.id) return
      await api.put(`/doctors/${doctorProfile.id}`, editData)
      toast.success('Profile updated successfully!')
      setIsEditing(false)
      fetchDoctorProfile()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (!hasMounted || !isAuthenticated) return null

  const stats = [
    { label: 'Today Appointments', value: appointments.length, icon: <ClipboardList className="h-6 w-6" />, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Patient Count', value: '12', icon: <Users className="h-6 w-6" />, color: 'text-accent-600', bg: 'bg-accent-50' },
    { label: 'Avg Rating', value: '4.9', icon: <UserCheck className="h-6 w-6" />, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+0.2' },
    { label: 'Consultations', value: '25', icon: <Video className="h-6 w-6" />, color: 'text-rose-600', bg: 'bg-rose-50' },
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
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Welcome, Dr. {user?.name || 'Practitioner'}!
            </h1>
            <p className="text-slate-500 font-medium font-italic">
              {doctorProfile?.isVerified ? 'Verified Specialist' : 'Verification Pending Account'}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-all hover:bg-slate-50 hover:text-primary-600">
              <Bell className="h-5 w-5" />
            </button>
            <AnimatedButton className="h-12 gap-2 shadow-none" onClick={() => setActiveTab('profile')}>
              <Edit2 className="h-4 w-4" /> Manage Profile
            </AnimatedButton>
          </motion.div>
        </header>

        {/* Tab Navigation */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {['overview', 'profile', 'appointments', 'slots'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeTab === tab ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => (
                  <GlassCard key={stat.label} className="flex items-center gap-4 border-none shadow-sm">
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
                ))}
              </div>

              <div className="grid gap-10 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">Upcoming Appointments</h3>
                    <span className="text-xs font-black text-primary-600 hover:underline cursor-pointer">View All</span>
                  </div>

                  <div className="space-y-4">
                    {appointments.length > 0 ? (
                      appointments.map((apt, i) => (
                        <GlassCard key={apt.id} className="flex items-center gap-4 hover:shadow-md transition-shadow">
                          <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                            {apt.patientName?.charAt(0) || 'P'}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900">{apt.patientName}</h4>
                            <p className="text-xs text-slate-500">{apt.reason}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-slate-900">{apt.time}</div>
                            <div className="text-[10px] font-black uppercase text-primary-600">{apt.date}</div>
                          </div>
                          <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
                            <ChevronRight size={18} />
                          </button>
                        </GlassCard>
                      ))
                    ) : (
                      <GlassCard className="flex flex-col items-center justify-center py-12 text-center shadow-none border-dashed border-slate-200">
                        <Calendar className="h-10 w-10 text-slate-300 mb-4" />
                        <h4 className="font-bold text-slate-900">Quiet day today</h4>
                        <p className="text-sm text-slate-500 italic">No appointments scheduled.</p>
                      </GlassCard>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-900">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center gap-3">
                       <Plus className="h-6 w-6 text-primary-600" />
                       <span className="text-xs font-black uppercase tracking-tighter text-slate-900">New Slot</span>
                    </button>
                    <button className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center gap-3">
                       <FileText className="h-6 w-6 text-accent-600" />
                       <span className="text-xs font-black uppercase tracking-tighter text-slate-900">Prescription</span>
                    </button>
                  </div>
                  
                  <GlassCard className="bg-slate-900 text-white">
                    <h4 className="font-bold mb-2">Practice Overview</h4>
                    <p className="text-xs text-slate-400 mb-6">Your patient satisfaction is up 12% this month.</p>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 w-[85%]" />
                    </div>
                  </GlassCard>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-4xl"
            >
              <GlassCard className="p-8">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-2xl font-black text-slate-900">Professional Profile</h3>
                   <AnimatedButton 
                    variant={isEditing ? "outline" : "primary"}
                    onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                   >
                     {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit2 className="h-4 w-4 mr-2" />}
                     {isEditing ? "Cancel" : "Edit Details"}
                   </AnimatedButton>
                </div>

                <div className={cn("grid gap-8", isEditing ? "opacity-100" : "opacity-80")}>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label>Full Name</Label>
                       <Input 
                        disabled={!isEditing} 
                        value={editData.name || ''} 
                        onChange={e => setEditData({...editData, name: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <Label>Specialization</Label>
                       <Input 
                        disabled={!isEditing} 
                        value={editData.specialization || ''} 
                        onChange={e => setEditData({...editData, specialization: e.target.value})}
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Professional Bio</Label>
                    <textarea 
                      disabled={!isEditing}
                      rows={4}
                      className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-medium outline-none focus:border-primary-500 disabled:bg-slate-50 transition-all font-sans"
                      value={editData.bio || ''}
                      onChange={e => setEditData({...editData, bio: e.target.value})}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                       <Label>Consultation Fee (Rs)</Label>
                       <Input 
                        type="number"
                        disabled={!isEditing} 
                        value={editData.consultationFee || 0} 
                        onChange={e => setEditData({...editData, consultationFee: Number(e.target.value)})}
                       />
                    </div>
                    <div className="space-y-2">
                       <Label>Experience (Years)</Label>
                       <Input 
                        disabled={!isEditing} 
                        value={editData.yearsOfExperience || ''} 
                        onChange={e => setEditData({...editData, yearsOfExperience: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <Label>Affiliation</Label>
                       <Input 
                        disabled={!isEditing} 
                        value={editData.hospitalAffiliation || ''} 
                        onChange={e => setEditData({...editData, hospitalAffiliation: e.target.value})}
                       />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                       <AnimatedButton onClick={handleUpdateProfile} isLoading={loading}>
                          <Save className="h-4 w-4 mr-2" /> Save Professional Details
                       </AnimatedButton>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

