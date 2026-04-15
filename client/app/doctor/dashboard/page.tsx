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
  Activity, 
  Calendar, 
  Users, 
  Stethoscope, 
  LogOut, 
  CheckCircle, 
  Edit2, 
  Save, 
  X, 
  Clock, 
  FileText,
  Video,
  XCircle,
  Bell,
  ArrowRight,
  TrendingUp,
  UserCheck,
  ClipboardList,
  ChevronRight
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

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

interface Patient {
  id: string;
  name: string;
  email: string;
}

interface Prescription {
  id: string;
  patientName: string;
  medications: string;
  instructions: string;
  dateIssued: number;
}

export default function DoctorDashboard() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<DoctorProfile>>({})
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [appointments, setAppointments] = useState([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [newSlot, setNewSlot] = useState({ date: '', startTime: '', endTime: '' })
  const [newPrescription, setNewPrescription] = useState({ patientId: '', patientName: '', medications: '', instructions: '' })
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const fetchDoctorProfile = useCallback(async () => {
    try {
      setProfileLoading(true)
      if (user?.id) {
        const res = await api.get(`/doctors/${user.id}`)
        setDoctorProfile(res.data)
        setEditData(res.data)
      }
    } catch (err: any) {
      console.error('Failed to fetch profile:', err)
    } finally {
      setProfileLoading(false)
    }
  }, [user?.id])

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await api.get(`/appointments/doctor/${user?.id || 'me'}`)
      setAppointments(res.status === 200 ? res.data : [])
    } catch (err) {
      console.error('Failed to fetch doctor appointments')
    }
  }, [user?.id])

  const fetchPrescriptions = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await api.get(`/doctors/${user.id}/prescriptions`);
      setPrescriptions(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [user?.id]);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await api.get(`/patients/all`);
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    if (!isAuthenticated) {
      router.push('/login')
      return;
    }

    fetchDoctorProfile()
    fetchAppointments()
  }, [isAuthenticated, user, router, hasMounted, fetchDoctorProfile, fetchAppointments])

  useEffect(() => {
    if (activeTab === 'prescriptions') {
      fetchPrescriptions();
      fetchPatients();
    }
  }, [activeTab, fetchPrescriptions, fetchPatients]);

  const handleUpdateProfile = async () => {
    try {
      setLoading(true)
      if (!doctorProfile?.id) return
      await api.put(`/doctors/${doctorProfile.id}`, editData)
      toast.success('Profile updated successfully!')
      setIsEditing(false)
      fetchDoctorProfile()
    } catch (err: any) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSlot = async () => {
    try {
      await api.post(`/doctors/${user?.id}/slots`, newSlot);
      toast.success('Slot added successfully');
      fetchDoctorProfile();
      setNewSlot({ date: '', startTime: '', endTime: '' });
    } catch (err) {
      toast.error('Failed to add slot');
    }
  };

  const handleIssuePrescription = async () => {
    if (!newPrescription.patientId || !newPrescription.medications) {
      toast.error('Please fill required fields');
      return;
    }
    try {
      const patient = patients.find(p => p.id === newPrescription.patientId);
      const payload = {
         ...newPrescription,
         patientName: patient ? patient.name : 'Unknown Patient',
         patientEmail: patient ? patient.email : ''
      };
      await api.post(`/doctors/${user?.id}/prescriptions`, payload);
      toast.success('Prescription issued successfully');
      fetchPrescriptions();
      setNewPrescription({ patientId: '', patientName: '', medications: '', instructions: '' });
    } catch (err) {
      toast.error('Failed to issue prescription');
    }
  };

  if (!hasMounted || !isAuthenticated) return null
  if (user?.role !== 'ROLE_DOCTOR' && user?.role !== 'DOCTOR') return null

  const stats = [
    { label: 'Today Orders', value: appointments.length, icon: <ClipboardList />, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Patient Count', value: patients.length || '42', icon: <Users />, color: 'text-accent-600', bg: 'bg-accent-50' },
    { label: 'Avg Rating', value: '4.9', icon: <UserCheck />, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+0.2' },
    { label: 'Consultations', value: '128', icon: <Video />, color: 'text-rose-600', bg: 'bg-rose-50' },
  ]

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="DOCTOR" />
      
      <main className="flex-1 lg:ml-[80px] xl:ml-[280px] p-4 md:p-8 pt-20 lg:pt-8 transition-all duration-300">
        {/* Header */}
        <header className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Welcome, Dr. {user?.name || 'Practitioner'}!</h1>
            <p className="text-slate-500 font-medium italic">You have {appointments.length} consultations scheduled for today.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
             {doctorProfile?.isVerified ? (
                 <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-black uppercase tracking-widest">
                    <CheckCircle className="h-4 w-4" /> Verified Pro
                 </span>
             ) : (
                 <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 text-xs font-black uppercase tracking-widest">
                    <Clock className="h-4 w-4" /> Verification Pending
                 </span>
             )}
            <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-all hover:bg-slate-50 hover:text-primary-600">
              <Bell className="h-5 w-5" />
            </button>
          </motion.div>
        </header>

        {/* Dynamic Tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Dashboard', icon: Activity },
            { id: 'profile', label: 'My Profile', icon: Stethoscope },
            { id: 'slots', label: 'Availability', icon: Clock },
            { id: 'prescriptions', label: 'Prescriptions', icon: FileText }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300",
                activeTab === tab.id 
                  ? "bg-slate-900 text-white shadow-xl" 
                  : "text-slate-400 hover:text-slate-600 hover:bg-white"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => (
                  <GlassCard key={stat.label} className="flex items-center gap-4 border-none shadow-sm hover:shadow-md transition-shadow">
                    <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl", stat.bg, stat.color)}>
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-slate-900 leading-none">{stat.value}</span>
                        {stat.trend && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-lg border text-emerald-600 bg-emerald-50 border-emerald-100">{stat.trend}</span>}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>

              <div className="grid gap-8 lg:grid-cols-3">
                 <GlassCard className="lg:col-span-2 p-8 border-none shadow-sm h-fit">
                    <h3 className="text-xl font-black text-slate-900 mb-6">Consultation Queue</h3>
                    {appointments.length > 0 ? (
                        <div className="space-y-4">
                            {appointments.map((apt: any) => (
                                <div key={apt.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-primary-600">
                                            {apt.patientName?.[0] || 'P'}
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-900">{apt.patientName}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{apt.appointmentTime} — {apt.type || 'General'}</div>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-300" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-slate-400 font-bold italic">No appointments for today.</div>
                    )}
                 </GlassCard>

                 <div className="space-y-6">
                    <GlassCard className="p-8 border-none shadow-sm bg-primary-600 text-white">
                        <h3 className="text-lg font-black mb-4 italic">Next Session</h3>
                        {appointments.length > 0 ? (
                            <div>
                                <div className="text-3xl font-black mb-1">10:30 AM</div>
                                <div className="text-sm font-bold opacity-80 uppercase tracking-widest">Starting in 15 mins</div>
                                <AnimatedButton className="w-full mt-6 bg-white text-primary-600 hover:bg-slate-50 h-12">
                                    <Video className="h-4 w-4" /> Start Video
                                </AnimatedButton>
                            </div>
                        ) : (
                            <div className="text-sm font-bold opacity-80 italic">Clear schedule for now.</div>
                        )}
                    </GlassCard>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto">
               <GlassCard className="p-8 border-none shadow-lg">
                  <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                     <h3 className="text-2xl font-black text-slate-900">Professional Profile</h3>
                     {!isEditing && (
                         <AnimatedButton onClick={() => setIsEditing(true)} className="gap-2">
                            <Edit2 className="h-4 w-4" /> Edit Profile
                         </AnimatedButton>
                     )}
                  </div>

                  {isEditing ? (
                      <div className="space-y-6">
                          <div className="grid md:grid-cols-2 gap-6">
                               <div className="space-y-2">
                                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                                   <input name="name" value={editData.name || ''} onChange={(e) => setEditData({...editData, name: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all" />
                               </div>
                               <div className="space-y-2">
                                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Consultation Fee (Rs)</label>
                                   <input type="number" name="consultationFee" value={editData.consultationFee || 0} onChange={(e) => setEditData({...editData, consultationFee: Number(e.target.value)})} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all" />
                               </div>
                          </div>
                          <div className="space-y-2">
                               <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Professional Bio</label>
                               <textarea name="bio" value={editData.bio || ''} onChange={(e) => setEditData({...editData, bio: e.target.value})} rows={4} className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all resize-none" />
                          </div>
                          <div className="flex gap-3 pt-6">
                              <AnimatedButton onClick={handleUpdateProfile} loading={loading} className="px-8">Save Changes</AnimatedButton>
                              <AnimatedButton variant="outline" onClick={() => setIsEditing(false)}>Cancel</AnimatedButton>
                          </div>
                      </div>
                  ) : (
                      <div className="grid gap-10 md:grid-cols-2">
                         <div className="space-y-6">
                            {[
                                { label: 'Specialization', val: doctorProfile?.specialization },
                                { label: 'Experience', val: `${doctorProfile?.yearsOfExperience} Years` },
                                { label: 'Hospital', val: doctorProfile?.hospitalAffiliation }
                            ].map(item => (
                                <div key={item.label} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</div>
                                   <div className="font-black text-slate-900">{item.val || '—'}</div>
                                </div>
                            ))}
                         </div>
                         <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-bold italic">About Doctor</div>
                            <p className="text-slate-500 font-medium leading-relaxed italic">"{doctorProfile?.bio || 'No bio provided.'}"</p>
                         </div>
                      </div>
                  )}
               </GlassCard>
            </motion.div>
          )}

          {activeTab === 'slots' && (
            <motion.div key="slots" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="max-w-4xl mx-auto space-y-10">
               <GlassCard className="p-8 border-none shadow-sm">
                  <h3 className="text-xl font-black text-slate-900 mb-6">Create Availability</h3>
                  <div className="grid md:grid-cols-4 gap-4 items-end">
                      <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Date</label>
                          <input type="date" value={newSlot.date} onChange={e => setNewSlot({...newSlot, date: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 font-black text-xs" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Start</label>
                          <input type="time" value={newSlot.startTime} onChange={e => setNewSlot({...newSlot, startTime: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 font-black text-xs" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">End</label>
                          <input type="time" value={newSlot.endTime} onChange={e => setNewSlot({...newSlot, endTime: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 font-black text-xs" />
                      </div>
                      <AnimatedButton onClick={handleAddSlot} className="h-11">Add Slot</AnimatedButton>
                  </div>
               </GlassCard>

               <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {doctorProfile?.availabilitySlots?.map(slot => (
                      <GlassCard key={slot.id} className={cn("border-none shadow-sm hover:bg-white transition-colors", slot.isBooked ? "bg-rose-50/30" : "bg-emerald-50/30")}>
                         <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{slot.date}</span>
                            <div className={cn("h-2 w-2 rounded-full", slot.isBooked ? "bg-rose-500" : "bg-emerald-500")} />
                         </div>
                         <div className="font-black text-slate-900 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" /> {slot.startTime} - {slot.endTime}
                         </div>
                      </GlassCard>
                  ))}
               </div>
            </motion.div>
          )}

          {activeTab === 'prescriptions' && (
            <motion.div key="prescriptions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-10">
               <GlassCard className="p-8 border-none shadow-lg">
                  <h3 className="text-xl font-black text-slate-900 mb-6 italic">New Digital Prescription</h3>
                  <div className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Patient</label>
                          <select value={newPrescription.patientId} onChange={e => setNewPrescription({...newPrescription, patientId: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 outline-none focus:border-primary-500 transition-all">
                              <option value="">-- Choose Patient --</option>
                              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Medications & Dosage</label>
                          <textarea value={newPrescription.medications} onChange={e => setNewPrescription({...newPrescription, medications: e.target.value})} rows={3} placeholder="E.g. Paracetamol 500mg - 1x3" className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-900 outline-none focus:border-primary-500 transition-all resize-none" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Usage Instructions</label>
                          <textarea value={newPrescription.instructions} onChange={e => setNewPrescription({...newPrescription, instructions: e.target.value})} rows={2} placeholder="E.g. Take after meals" className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-900 outline-none focus:border-primary-500 transition-all resize-none" />
                      </div>
                      <AnimatedButton onClick={handleIssuePrescription} className="px-10">Issue & Encrypt</AnimatedButton>
                  </div>
               </GlassCard>

               <div className="space-y-4">
                  <h3 className="text-xl font-black text-slate-900 mb-6 italic px-4">Recent Submissions</h3>
                  {prescriptions.map(p => (
                      <GlassCard key={p.id} className="border-none shadow-sm hover:bg-white transition-all flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary-600 transition-colors">
                                  <FileText className="h-5 w-5" />
                              </div>
                              <div>
                                  <div className="font-black text-slate-900">{p.patientName}</div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{new Date(p.dateIssued).toLocaleDateString()}</div>
                              </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-300" />
                      </GlassCard>
                  ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
