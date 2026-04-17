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
  User,
  FileText,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Stethoscope,
  Search,
  MessageSquare,
  Mail,
  Pill,
  Video,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'

interface Appointment {
  id: string
  patientId: string
  patientName: string
  patientEmail?: string
  patientPhone?: string
  date?: string
  time?: string
  appointmentTime?: string
  reason?: string
  status: 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  appointmentType?: 'IN_PERSON' | 'TELEMEDICINE'
  notes?: string
  createdAt?: string
}

interface Patient {
  id: string
  name: string
  email: string
  phone?: string
}

interface AppointmentStats {
  total: number
  confirmed: number
  pending: number
  completed: number
  cancelled: number
}

interface DoctorProfile {
  id: string
  name: string
  email: string
  specialization?: string
  [key: string]: any
}

interface PrescriptionForm {
  patientId: string
  diagnosis: string
  medications: string
  dosage: string
  duration: string
  notes: string
  sendEmail: boolean
}

// ── Helpers

function safeDisplayDate(apt: Appointment): string {
  const raw = apt.date || apt.appointmentTime
  if (!raw) return 'N/A'
  try {
    return new Date(raw).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    })
  } catch { return raw }
}

function safeDisplayTime(apt: Appointment): string {
  return apt.time || (apt.appointmentTime ? new Date(apt.appointmentTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '')
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  NO_SHOW:   'bg-slate-50 text-slate-700 border-slate-200',
}

export default function DoctorAppointments() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('ALL')
  const [stats, setStats] = useState<AppointmentStats>({ total: 0, confirmed: 0, pending: 0, completed: 0, cancelled: 0 })
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const [isSubmittingPrescription, setIsSubmittingPrescription] = useState(false)

  const [prescriptionForm, setPrescriptionForm] = useState<PrescriptionForm>({
    patientId: '', diagnosis: '', medications: '',
    dosage: '', duration: '', notes: '', sendEmail: true,
  })

  useEffect(() => { setHasMounted(true) }, [])

  useEffect(() => {
    if (!hasMounted) return
    if (!isAuthenticated) { router.push('/login'); return }
    if (user?.role !== 'ROLE_DOCTOR' && user?.role !== 'DOCTOR') { router.push('/'); return }
  }, [isAuthenticated, user, router, hasMounted])

  // ── Fetch Doctor Profile
  const fetchDoctorProfile = useCallback(async () => {
    if (!user?.id) return
    try {
      const res = await api.get(`/doctors/${user.id}`)
      setDoctorProfile(res.data)
    } catch (err: any) {
      console.error('Failed to fetch doctor profile:', err)
    }
  }, [user?.id])

  // ── Fetch Appointments
  const fetchAppointments = useCallback(async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const res = await api.get(`/appointments/doctor/${user.id}`)
      const data: Appointment[] = Array.isArray(res.data) ? res.data : []
      setAppointments(data)
      setStats({
        total: data.length,
        confirmed: data.filter(a => a.status === 'CONFIRMED').length,
        pending: data.filter(a => a.status === 'PENDING').length,
        completed: data.filter(a => a.status === 'COMPLETED').length,
        cancelled: data.filter(a => a.status === 'CANCELLED').length,
      })
    } catch {
      toast.error('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // ── Fetch Patients (for prescription dropdown)
  const fetchPatients = useCallback(async () => {
    try {
      const res = await api.get('/patients/all')
      setPatients(Array.isArray(res.data) ? res.data : [])
    } catch (err: any) {
      console.warn('Could not load patients list:', err?.message)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && user?.id && hasMounted) {
      fetchAppointments()
      fetchDoctorProfile()
      fetchPatients()
    }
  }, [isAuthenticated, user?.id, hasMounted, fetchAppointments, fetchDoctorProfile, fetchPatients])

  // ── Client-side filtering
  useEffect(() => {
    let filtered = [...appointments]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(apt =>
        apt.patientName?.toLowerCase().includes(q) ||
        apt.patientEmail?.toLowerCase().includes(q) ||
        apt.reason?.toLowerCase().includes(q)
      )
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(apt => apt.status === statusFilter)
    }

    if (dateFilter !== 'ALL') {
      const today = new Date(); today.setHours(0,0,0,0)
      filtered = filtered.filter(apt => {
        const raw = apt.date || apt.appointmentTime
        if (!raw) return true
        try {
          const aptDate = new Date(raw); aptDate.setHours(0,0,0,0)
          if (dateFilter === 'TODAY')    return aptDate.getTime() === today.getTime()
          if (dateFilter === 'UPCOMING') return aptDate.getTime() >= today.getTime()
          if (dateFilter === 'PAST')     return aptDate.getTime() < today.getTime()
        } catch { return true }
        return true
      })
    }

    setFilteredAppointments(filtered)
  }, [appointments, searchQuery, statusFilter, dateFilter])

  // ── Update Appointment Status — uses dedicated PATCH endpoints
  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      setUpdating(appointmentId)

      if (newStatus === 'CONFIRMED') {
        await api.patch(`/appointments/${appointmentId}/confirm`)
      } else if (newStatus === 'CANCELLED') {
        await api.patch(`/appointments/${appointmentId}/cancel`)
      } else if (newStatus === 'COMPLETED') {
        await api.patch(`/appointments/${appointmentId}/complete?prescription=`)
      } else {
        // Fallback for NO_SHOW or other statuses
        await api.put(`/appointments/${appointmentId}`, { status: newStatus })
      }

      toast.success(`Appointment ${newStatus.toLowerCase().replace('_', ' ')}!`)
      await fetchAppointments()

      // Update selectedAppointment in place so modal reflects new status
      if (selectedAppointment?.id === appointmentId) {
        setSelectedAppointment(prev =>
          prev ? { ...prev, status: newStatus as Appointment['status'] } : prev
        )
      }

      if (newStatus === 'CANCELLED' || newStatus === 'CONFIRMED') {
        setShowDetailModal(false)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Failed to ${newStatus.toLowerCase()} appointment`)
    } finally {
      setUpdating(null)
    }
  }

  // ── Issue Prescription
  const handleIssuePrescription = async () => {
    if (!prescriptionForm.patientId || !prescriptionForm.diagnosis || !prescriptionForm.medications) {
      toast.error('Please fill all required fields (Patient, Diagnosis, Medications)')
      return
    }
    if (!doctorProfile?.id) { toast.error('Doctor profile not found'); return }

    const selectedPatient = patients.find(p => p.id === prescriptionForm.patientId)
    if (!selectedPatient) { toast.error('Selected patient not found'); return }

    setIsSubmittingPrescription(true)
    try {
      const medicationArray = prescriptionForm.medications
        .split(',').map(m => m.trim()).filter(m => m.length > 0)

      const prescriptionData = {
        doctorId: doctorProfile.id,
        doctorName: doctorProfile.name,
        doctorEmail: doctorProfile.email,
        patientId: prescriptionForm.patientId,
        patientName: selectedPatient.name,
        patientEmail: selectedPatient.email,
        diagnosis: prescriptionForm.diagnosis,
        medications: medicationArray,
        dosage: prescriptionForm.dosage,
        duration: prescriptionForm.duration,
        notes: prescriptionForm.notes,
        status: 'Active',
        issuedDate: new Date().toISOString(),
      }

      // 1. Save prescription
      await api.post(`/doctors/${doctorProfile.id}/prescriptions`, prescriptionData)

      // 2. Send email if enabled
      if (prescriptionForm.sendEmail && selectedPatient.email) {
        try {
          await api.post('/notifications/send-prescription-email', {
            to: selectedPatient.email,
            patientId: prescriptionForm.patientId,
            patientName: selectedPatient.name,
            doctorName: doctorProfile.name,
            doctorEmail: doctorProfile.email,
            doctorSpecialization: doctorProfile.specialization || '',
            diagnosis: prescriptionForm.diagnosis,
            medications: medicationArray,
            dosage: prescriptionForm.dosage,
            duration: prescriptionForm.duration,
            notes: prescriptionForm.notes,
            issuedDate: new Date().toLocaleDateString(),
          })
          toast.success('Prescription issued and email sent to patient!')
        } catch (emailErr) {
          console.warn('Email sending failed (non-critical):', emailErr)
          toast.success('Prescription issued! (Email failed — patient not notified)')
        }
      } else {
        toast.success('Prescription issued successfully!')
      }

      // Reset form
      setPrescriptionForm({ patientId: '', diagnosis: '', medications: '', dosage: '', duration: '', notes: '', sendEmail: true })
      setShowPrescriptionModal(false)
      setShowDetailModal(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to issue prescription')
    } finally {
      setIsSubmittingPrescription(false)
    }
  }

  if (!hasMounted || !isAuthenticated) return null

  const statCards = [
    { label: 'Total', value: stats.total, icon: <Calendar className="h-5 w-5" />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Confirmed', value: stats.confirmed, icon: <CheckCircle className="h-5 w-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending', value: stats.pending, icon: <AlertCircle className="h-5 w-5" />, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Completed', value: stats.completed, icon: <CheckCircle className="h-5 w-5" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ]

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="DOCTOR" />

      <main className="flex-1 lg:ml-[80px] xl:ml-[280px] p-4 md:p-8 pt-20 lg:pt-8 transition-all duration-300">

        {/* ── Header */}
        <header className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-2 mb-2 font-bold text-blue-600 text-sm uppercase tracking-widest">
              <Stethoscope className="h-4 w-4" /> Appointments
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Your Appointments</h1>
            <p className="text-slate-500 font-medium italic">Manage and track all your patient appointments</p>
          </motion.div>

          <motion.button
            id="btn-refresh-doctor"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={fetchAppointments}
            className="h-12 px-6 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </motion.button>
        </header>

        {/* ── Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        >
          {statCards.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <GlassCard className={cn('p-5 border border-slate-200', stat.bg)}>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn('p-2 rounded-xl bg-white/60', stat.color)}>{stat.icon}</span>
                  <span className="text-2xl font-black text-slate-900">{stat.value}</span>
                </div>
                <p className="text-sm font-bold text-slate-600">{stat.label}</p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              id="search-appointments"
              type="text"
              placeholder="Search by patient name, email or reason..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
          <select
            id="filter-status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-12 px-4 rounded-2xl border border-slate-200 bg-white font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="ALL">All Status</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No Show</option>
          </select>
          <select
            id="filter-date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="h-12 px-4 rounded-2xl border border-slate-200 bg-white font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="ALL">All Dates</option>
            <option value="TODAY">Today</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="PAST">Past</option>
          </select>
        </motion.div>

        {/* ── Appointments List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-6">
            <h3 className="text-xl font-black text-slate-900 mb-6">
              Appointments ({filteredAppointments.length})
            </h3>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Activity className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-bold">Loading appointments...</p>
              </div>
            ) : filteredAppointments.length > 0 ? (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredAppointments.map((apt, i) => (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => { setSelectedAppointment(apt); setShowDetailModal(true) }}
                      className="cursor-pointer"
                    >
                      <GlassCard className="p-5 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-black text-lg flex-shrink-0">
                              {apt.patientName?.charAt(0) || 'P'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-black text-slate-900">{apt.patientName}</h4>
                              <p className="text-sm text-slate-500 mb-1">{apt.reason || 'Consultation'}</p>
                              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600">
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                                  {safeDisplayDate(apt)}
                                </span>
                                {safeDisplayTime(apt) && (
                                  <span className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-orange-500" />
                                    {safeDisplayTime(apt)}
                                  </span>
                                )}
                                {apt.appointmentType && (
                                  <span className="flex items-center gap-1.5">
                                    {apt.appointmentType === 'TELEMEDICINE'
                                      ? <Video className="h-3.5 w-3.5 text-indigo-600" />
                                      : <User className="h-3.5 w-3.5 text-slate-500" />}
                                    {apt.appointmentType === 'TELEMEDICINE' ? 'Virtual' : 'In-Person'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              'text-xs font-black uppercase px-3 py-1.5 rounded-lg border',
                              STATUS_COLORS[apt.status] || STATUS_COLORS.PENDING
                            )}>
                              {apt.status}
                            </span>
                            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-600 transition-colors hidden md:block" />
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Calendar className="h-16 w-16 text-slate-200 mb-4" />
                <h4 className="text-xl font-black text-slate-900 mb-2">No appointments found</h4>
                <p className="text-slate-500 font-bold">Try adjusting your filters</p>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* ══════════════════════════════════
            APPOINTMENT DETAIL MODAL
        ══════════════════════════════════ */}
        <AnimatePresence>
          {showDetailModal && selectedAppointment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailModal(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black text-slate-900">Appointment Details</h3>
                  <button
                    id="btn-close-detail-modal"
                    onClick={() => setShowDetailModal(false)}
                    className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-500 hover:text-slate-900"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">PATIENT</p>
                    <p className="text-lg font-black text-slate-900">{selectedAppointment.patientName}</p>
                  </div>

                  {selectedAppointment.patientEmail && (
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">EMAIL</p>
                      <p className="text-sm font-bold text-slate-700">{selectedAppointment.patientEmail}</p>
                    </div>
                  )}

                  {selectedAppointment.patientPhone && (
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">PHONE</p>
                      <p className="text-sm font-bold text-slate-700">{selectedAppointment.patientPhone}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">DATE</p>
                      <p className="text-sm font-black text-slate-900">{safeDisplayDate(selectedAppointment)}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">TIME</p>
                      <p className="text-sm font-black text-slate-900">{safeDisplayTime(selectedAppointment) || '—'}</p>
                    </div>
                  </div>

                  {selectedAppointment.reason && (
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">REASON</p>
                      <p className="text-sm font-bold text-slate-900">{selectedAppointment.reason}</p>
                    </div>
                  )}

                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">STATUS</p>
                    <span className={cn(
                      'text-xs font-black uppercase px-3 py-1.5 rounded-lg border inline-block',
                      STATUS_COLORS[selectedAppointment.status] || STATUS_COLORS.PENDING
                    )}>
                      {selectedAppointment.status}
                    </span>
                  </div>

                  {selectedAppointment.notes && (
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">NOTES</p>
                      <p className="text-sm font-bold text-slate-700">{selectedAppointment.notes}</p>
                    </div>
                  )}
                </div>

                {/* ── Action Buttons by status */}
                <div className="space-y-3">

                  {/* PENDING → Confirm or Cancel */}
                  {selectedAppointment.status === 'PENDING' && (
                    <div className="flex gap-3">
                      <AnimatedButton
                        id="btn-confirm-appointment"
                        variant="primary"
                        className="flex-1"
                        onClick={() => updateAppointmentStatus(selectedAppointment.id, 'CONFIRMED')}
                        disabled={updating === selectedAppointment.id}
                      >
                        <CheckCircle className="h-4 w-4" /> Confirm
                      </AnimatedButton>
                      <AnimatedButton
                        id="btn-cancel-appointment"
                        variant="outline"
                        className="flex-1"
                        onClick={() => updateAppointmentStatus(selectedAppointment.id, 'CANCELLED')}
                        disabled={updating === selectedAppointment.id}
                      >
                        <XCircle className="h-4 w-4" /> Cancel
                      </AnimatedButton>
                    </div>
                  )}

                  {/* CONFIRMED → Mark Complete or Cancel */}
                  {selectedAppointment.status === 'CONFIRMED' && (
                    <div className="space-y-3">
                      <AnimatedButton
                        id="btn-complete-appointment"
                        variant="primary"
                        className="w-full"
                        onClick={() => updateAppointmentStatus(selectedAppointment.id, 'COMPLETED')}
                        disabled={updating === selectedAppointment.id}
                      >
                        <CheckCircle className="h-4 w-4" /> Mark as Completed
                      </AnimatedButton>
                      <AnimatedButton
                        id="btn-cancel-confirmed-appointment"
                        variant="outline"
                        className="w-full"
                        onClick={() => updateAppointmentStatus(selectedAppointment.id, 'CANCELLED')}
                        disabled={updating === selectedAppointment.id}
                      >
                        <XCircle className="h-4 w-4" /> Cancel Appointment
                      </AnimatedButton>
                    </div>
                  )}

                  {/* COMPLETED → Issue Prescription */}
                  {selectedAppointment.status === 'COMPLETED' && (
                    <AnimatedButton
                      id="btn-issue-prescription"
                      variant="primary"
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => {
                        setPrescriptionForm(f => ({
                          ...f,
                          patientId: selectedAppointment.patientId,
                        }))
                        setShowPrescriptionModal(true)
                      }}
                    >
                      <Pill className="h-4 w-4" /> Issue Prescription
                    </AnimatedButton>
                  )}

                  <AnimatedButton
                    id="btn-close-detail"
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowDetailModal(false)}
                  >
                    Close
                  </AnimatedButton>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════
            PRESCRIPTION MODAL
        ══════════════════════════════════ */}
        <AnimatePresence>
          {showPrescriptionModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPrescriptionModal(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black text-slate-900">Issue Prescription</h3>
                  <button
                    id="btn-close-prescription-modal"
                    onClick={() => setShowPrescriptionModal(false)}
                    className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-500"
                  >×</button>
                </div>

                <div className="space-y-4 mb-6">

                  {/* Patient dropdown */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">
                      SELECT PATIENT *
                    </label>
                    <select
                      id="prescription-patient-select"
                      value={prescriptionForm.patientId}
                      onChange={e => setPrescriptionForm(f => ({ ...f, patientId: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    >
                      <option value="">Choose a patient...</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                      ))}
                    </select>
                  </div>

                  {/* Diagnosis */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">DIAGNOSIS *</label>
                    <input
                      id="prescription-diagnosis"
                      type="text"
                      placeholder="Enter diagnosis..."
                      value={prescriptionForm.diagnosis}
                      onChange={e => setPrescriptionForm(f => ({ ...f, diagnosis: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  {/* Medications */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">MEDICATIONS * (comma separated)</label>
                    <textarea
                      id="prescription-medications"
                      placeholder="e.g. Aspirin, Vitamin D, Amoxicillin..."
                      value={prescriptionForm.medications}
                      onChange={e => setPrescriptionForm(f => ({ ...f, medications: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 min-h-[80px] resize-none"
                    />
                  </div>

                  {/* Dosage */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">DOSAGE</label>
                    <input
                      id="prescription-dosage"
                      type="text"
                      placeholder="e.g. 500mg twice daily..."
                      value={prescriptionForm.dosage}
                      onChange={e => setPrescriptionForm(f => ({ ...f, dosage: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">DURATION</label>
                    <input
                      id="prescription-duration"
                      type="text"
                      placeholder="e.g. 7 days, 2 weeks..."
                      value={prescriptionForm.duration}
                      onChange={e => setPrescriptionForm(f => ({ ...f, duration: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">ADDITIONAL NOTES</label>
                    <textarea
                      id="prescription-notes"
                      placeholder="Any additional instructions..."
                      value={prescriptionForm.notes}
                      onChange={e => setPrescriptionForm(f => ({ ...f, notes: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 min-h-[80px] resize-none"
                    />
                  </div>

                  {/* Email toggle */}
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <input
                      type="checkbox"
                      id="prescription-send-email"
                      checked={prescriptionForm.sendEmail}
                      onChange={e => setPrescriptionForm(f => ({ ...f, sendEmail: e.target.checked }))}
                      className="w-5 h-5 accent-blue-600"
                    />
                    <label htmlFor="prescription-send-email" className="text-sm font-bold text-slate-900 flex items-center gap-2 cursor-pointer">
                      <Mail className="h-4 w-4 text-blue-600" />
                      Send prescription to patient email
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <AnimatedButton
                    id="btn-submit-prescription"
                    variant="primary"
                    className="flex-1"
                    onClick={handleIssuePrescription}
                    disabled={isSubmittingPrescription}
                  >
                    <Pill className="h-4 w-4" />
                    {isSubmittingPrescription ? 'Issuing...' : 'Issue Prescription'}
                  </AnimatedButton>
                  <AnimatedButton
                    id="btn-cancel-prescription"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowPrescriptionModal(false)}
                    disabled={isSubmittingPrescription}
                  >
                    Cancel
                  </AnimatedButton>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  )
}