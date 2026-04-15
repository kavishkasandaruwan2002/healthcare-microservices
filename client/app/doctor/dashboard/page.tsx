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
  ChevronRight,
  LogOut,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'

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
  availabilitySlots?: AvailabilitySlot[]
}

interface AvailabilitySlot {
  id: string
  date: string
  startTime: string
  endTime: string
  isBooked: boolean
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
  const [newSlot, setNewSlot] = useState({ date: '', startTime: '', endTime: '' })
  const [showAddSlot, setShowAddSlot] = useState(false)

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
        
        // Log verification status
        console.log('Doctor Verification Status:', {
          isVerified: res.data.isVerified,
          status: res.data.status,
          name: res.data.name
        })
        
        // Show notification if pending
        if (res.data.status === 'PENDING' && !res.data.isVerified) {
          toast('⏳ Your profile is pending admin verification')
        } else if (res.data.status === 'APPROVED' && res.data.isVerified) {
          toast.success('✓ Your profile is verified!')
        } else if (res.data.status === 'REJECTED') {
          toast.error('✕ Your profile was rejected. Please contact support.')
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch doctor profile:', err)
      toast.error('Failed to load profile')
    } finally {
      setProfileLoading(false)
    }
  }, [user?.id])

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true)
      if (user?.id) {
        const res = await api.get(`/appointments/doctor/${user.id}`)
        setAppointments(Array.isArray(res.data) ? res.data : [])
      }
    } catch (err: any) {
      console.error('Failed to fetch appointments:', err)
      toast.error('Failed to load appointments')
      setAppointments([])
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
      if (!doctorProfile?.id) {
        toast.error('Doctor profile not found')
        return
      }
      await api.put(`/doctors/${doctorProfile.id}`, editData)
      toast.success('Profile updated successfully!')
      setIsEditing(false)
      await fetchDoctorProfile()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
      console.error('Update error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSlot = async () => {
    if (!newSlot.date || !newSlot.startTime || !newSlot.endTime) {
      toast.error('Please fill all slot details')
      return
    }

    try {
      setLoading(true)
      if (!doctorProfile?.id) return
      
      await api.post(`/doctors/${doctorProfile.id}/slots`, newSlot)
      toast.success('Slot added successfully!')
      setNewSlot({ date: '', startTime: '', endTime: '' })
      setShowAddSlot(false)
      await fetchDoctorProfile()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add slot')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Delete this slot?')) return

    try {
      if (!doctorProfile?.id) return
      await api.delete(`/doctors/${doctorProfile.id}/slots/${slotId}`)
      toast.success('Slot deleted')
      await fetchDoctorProfile()
    } catch (err: any) {
      toast.error('Failed to delete slot')
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!hasMounted || !isAuthenticated) return null

  const upcomingAppointments = appointments.filter(apt => apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED')
  
  const stats = [
    { label: 'Today Appointments', value: upcomingAppointments.length, icon: <ClipboardList className="h-6 w-6" />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Patient Count', value: '12', icon: <Users className="h-6 w-6" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Avg Rating', value: '4.9', icon: <UserCheck className="h-6 w-6" />, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+0.2' },
    { label: 'Consultations', value: appointments.length, icon: <Video className="h-6 w-6" />, color: 'text-rose-600', bg: 'bg-rose-50' },
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
            <p className={cn(
              "text-slate-500 font-medium flex items-center gap-2",
              doctorProfile?.isVerified ? "text-emerald-600" : "text-amber-600"
            )}>
              {doctorProfile?.isVerified ? (
                <>✓ Verified Specialist</>
              ) : doctorProfile?.status === 'PENDING' ? (
                <>⏳ Verification Pending - Awaiting Admin Approval</>
              ) : doctorProfile?.status === 'REJECTED' ? (
                <>✕ Profile Rejected - Contact Support</>
              ) : (
                <>⏳ Verification Pending</>
              )}
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
            <AnimatedButton className="h-12 gap-2 shadow-none" onClick={() => setActiveTab('profile')}>
              <Edit2 className="h-4 w-4" /> Profile
            </AnimatedButton>
            <button onClick={handleLogout} className="flex h-12 w-12 items-center justify-center rounded-2xl hover:bg-red-50 transition-colors">
              <LogOut className="h-5 w-5 text-red-600" />
            </button>
          </motion.div>
        </header>

        {/* Tab Navigation */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['overview', 'appointments', 'profile', 'slots'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeTab === tab 
                  ? "bg-slate-900 text-white shadow-lg" 
                  : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <GlassCard key={stat.label} className="flex items-center gap-4 border-none shadow-sm hover:shadow-md transition-shadow">
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
                    <button onClick={() => setActiveTab('appointments')} className="text-xs font-black text-blue-600 hover:underline">
                      View All →
                    </button>
                  </div>

                  <div className="space-y-4">
                    {upcomingAppointments.length > 0 ? (
                      upcomingAppointments.slice(0, 3).map((apt) => (
                        <GlassCard key={apt.id} className="flex items-center gap-4 hover:shadow-md transition-shadow">
                          <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {apt.patientName?.charAt(0) || 'P'}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900">{apt.patientName}</h4>
                            <p className="text-xs text-slate-500">{apt.reason}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-slate-900 flex items-center gap-1"><Clock className="h-4 w-4" /> {apt.time}</div>
                            <div className="text-[10px] font-black uppercase text-blue-600">{apt.date}</div>
                          </div>
                        </GlassCard>
                      ))
                    ) : (
                      <GlassCard className="flex flex-col items-center justify-center py-12 text-center shadow-none">
                        <Calendar className="h-10 w-10 text-slate-300 mb-4" />
                        <h4 className="font-bold text-slate-900">No appointments scheduled</h4>
                        <p className="text-sm text-slate-500 mt-1">Your schedule is clear</p>
                      </GlassCard>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-900">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setActiveTab('slots')} className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center gap-3">
                      <Plus className="h-6 w-6 text-blue-600" />
                      <span className="text-xs font-black uppercase text-slate-900">Add Slot</span>
                    </button>
                    <button className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center gap-3">
                      <FileText className="h-6 w-6 text-indigo-600" />
                      <span className="text-xs font-black uppercase text-slate-900">Prescription</span>
                    </button>
                  </div>
                  
                  <GlassCard className="bg-slate-900 text-white p-6 rounded-2xl">
                    <h4 className="font-bold mb-2">Practice Overview</h4>
                    <p className="text-xs text-slate-400 mb-4">Your patient satisfaction is up 12% this month.</p>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '85%' }}
                        className="h-full bg-emerald-500" 
                      />
                    </div>
                  </GlassCard>
                </div>
              </div>
            </motion.div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <motion.div
              key="appointments"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl"
            >
              <GlassCard className="p-6">
                <h3 className="text-2xl font-black text-slate-900 mb-6">All Appointments</h3>
                
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Activity className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                    <p className="text-slate-500">Loading appointments...</p>
                  </div>
                ) : appointments.length > 0 ? (
                  <div className="space-y-3">
                    {appointments.map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                        <div>
                          <h4 className="font-bold text-slate-900">{apt.patientName}</h4>
                          <p className="text-sm text-slate-500">{apt.reason}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">{apt.date} at {apt.time}</p>
                          <span className={cn(
                            "text-[10px] font-black uppercase px-2 py-1 rounded mt-1 inline-block",
                            apt.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' :
                            apt.status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                            apt.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700' :
                            'bg-red-50 text-red-700'
                          )}>
                            {apt.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500">No appointments found</p>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl"
            >
              <GlassCard className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-slate-900">Professional Profile</h3>
                  <AnimatedButton 
                    onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                  >
                    {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit2 className="h-4 w-4 mr-2" />}
                    {isEditing ? "Cancel" : "Edit Details"}
                  </AnimatedButton>
                </div>

                {profileLoading ? (
                  <div className="text-center py-12">
                    <Activity className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-500">Loading profile...</p>
                  </div>
                ) : (
                  <div className="grid gap-8">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input 
                          disabled={!isEditing} 
                          value={editData.name || ''} 
                          onChange={e => setEditData({...editData, name: e.target.value})}
                          type="text"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Specialization</Label>
                        <Input 
                          disabled={!isEditing} 
                          value={editData.specialization || ''} 
                          onChange={e => setEditData({...editData, specialization: e.target.value})}
                          type="text"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Professional Bio</Label>
                      <textarea 
                        disabled={!isEditing}
                        rows={4}
                        className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-medium outline-none focus:border-blue-500 disabled:bg-slate-50 transition-all font-sans"
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
                          type="text"
                          disabled={!isEditing} 
                          value={editData.yearsOfExperience || ''} 
                          onChange={e => setEditData({...editData, yearsOfExperience: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hospital Affiliation</Label>
                        <Input 
                          type="text"
                          disabled={!isEditing} 
                          value={editData.hospitalAffiliation || ''} 
                          onChange={e => setEditData({...editData, hospitalAffiliation: e.target.value})}
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="pt-6 border-t border-slate-100 flex justify-end gap-2">
                        <button 
                          onClick={() => setIsEditing(false)}
                          className="px-6 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors font-bold"
                        >
                          Cancel
                        </button>
                        <AnimatedButton onClick={handleUpdateProfile} disabled={loading}>
                          <Save className="h-4 w-4 mr-2" /> Save Changes
                        </AnimatedButton>
                      </div>
                    )}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}

          {/* Slots Tab */}
          {activeTab === 'slots' && (
            <motion.div
              key="slots"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-slate-900">Availability Slots</h3>
                  <AnimatedButton onClick={() => setShowAddSlot(!showAddSlot)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Slot
                  </AnimatedButton>
                </div>

                {showAddSlot && (
                  <GlassCard className="p-6 border-2 border-blue-200 bg-white">
                    <h4 className="font-bold text-slate-900 mb-4">Create New Slot</h4>
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input 
                          type="date"
                          value={newSlot.date}
                          onChange={e => setNewSlot({...newSlot, date: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input 
                          type="time"
                          value={newSlot.startTime}
                          onChange={e => setNewSlot({...newSlot, startTime: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input 
                          type="time"
                          value={newSlot.endTime}
                          onChange={e => setNewSlot({...newSlot, endTime: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <AnimatedButton onClick={handleAddSlot} disabled={loading}>
                        Save Slot
                      </AnimatedButton>
                      <button 
                        onClick={() => setShowAddSlot(false)}
                        className="px-6 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  </GlassCard>
                )}

                <GlassCard className="p-6">
                  <h4 className="font-bold text-slate-900 mb-4">Your Slots</h4>
                  {doctorProfile?.availabilitySlots && doctorProfile.availabilitySlots.length > 0 ? (
                    <div className="space-y-3">
                      {doctorProfile.availabilitySlots.map((slot) => (
                        <div key={slot.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                          <div>
                            <p className="font-bold text-slate-900">{slot.date}</p>
                            <p className="text-sm text-slate-500">{slot.startTime} - {slot.endTime} {slot.isBooked ? '(Booked)' : '(Available)'}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-500">No slots available. Create one to get started!</p>
                    </div>
                  )}
                </GlassCard>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
