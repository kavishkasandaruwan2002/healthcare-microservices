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
  Phone,
  FileText,
  Activity,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Stethoscope,
  Search,
  Download,
  MessageSquare,
  Plus,
  X,
  Mail,
  Pill
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'

interface Appointment {
  id: string
  patientId: string
  patientName: string
  patientEmail?: string
  patientPhone?: string
  date: string
  time: string
  reason: string
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
  age?: number
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
  phone?: string
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

export default function DoctorAppointments() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()

  // State Management
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [dateFilter, setDateFilter] = useState<string>('ALL')
  const [stats, setStats] = useState<AppointmentStats>({
    total: 0,
    confirmed: 0,
    pending: 0,
    completed: 0,
    cancelled: 0
  })
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const [isSubmittingPrescription, setIsSubmittingPrescription] = useState(false)

  const [prescriptionForm, setPrescriptionForm] = useState<PrescriptionForm>({
    patientId: '',
    diagnosis: '',
    medications: '',
    dosage: '',
    duration: '',
    notes: '',
    sendEmail: true
  })

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

  // Fetch Doctor Profile
  const fetchDoctorProfile = useCallback(async () => {
    try {
      if (user?.id) {
        const res = await api.get(`/doctors/${user.id}`)
        setDoctorProfile(res.data)
      }
    } catch (err: any) {
      console.error('Failed to fetch doctor profile:', err)
    }
  }, [user?.id])

  // Fetch Appointments
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true)
      if (user?.id) {
        const res = await api.get(`/appointments/doctor/${user.id}`)
        const appointmentData = Array.isArray(res.data) ? res.data : []
        setAppointments(appointmentData)
        
        // Calculate stats
        const newStats: AppointmentStats = {
          total: appointmentData.length,
          confirmed: appointmentData.filter(a => a.status === 'CONFIRMED').length,
          pending: appointmentData.filter(a => a.status === 'PENDING').length,
          completed: appointmentData.filter(a => a.status === 'COMPLETED').length,
          cancelled: appointmentData.filter(a => a.status === 'CANCELLED').length,
        }
        setStats(newStats)
      }
    } catch (err: any) {
      console.error('Failed to fetch appointments:', err)
      toast.error('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Fetch Patients for Dropdown
  const fetchPatients = useCallback(async () => {
    try {
      const res = await api.get('/patients')
      setPatients(Array.isArray(res.data) ? res.data : [])
    } catch (err: any) {
      console.error('Failed to fetch patients:', err)
      toast.error('Failed to load patients list')
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && user?.id && hasMounted) {
      fetchAppointments()
      fetchDoctorProfile()
      fetchPatients()
    }
  }, [isAuthenticated, user?.id, hasMounted, fetchAppointments, fetchDoctorProfile, fetchPatients])

  // Filter Appointments
  useEffect(() => {
    let filtered = [...appointments]

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(apt =>
        apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.patientEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.reason.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(apt => apt.status === statusFilter)
    }

    // Date filter
    if (dateFilter !== 'ALL') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.date)
        aptDate.setHours(0, 0, 0, 0)

        switch (dateFilter) {
          case 'TODAY':
            return aptDate.getTime() === today.getTime()
          case 'UPCOMING':
            return aptDate.getTime() >= today.getTime()
          case 'PAST':
            return aptDate.getTime() < today.getTime()
          default:
            return true
        }
      })
    }

    setFilteredAppointments(filtered)
  }, [appointments, searchQuery, statusFilter, dateFilter])

  // Update Appointment Status
  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      setUpdating(true)
      await api.put(`/appointments/${appointmentId}`, { status: newStatus })
      toast.success(`Appointment ${newStatus.toLowerCase()}!`)
      await fetchAppointments()
      setShowDetailModal(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update appointment')
    } finally {
      setUpdating(false)
    }
  }

  // Issue Prescription
  const handleIssuePrescription = async () => {
    try {
      if (!prescriptionForm.patientId || !prescriptionForm.diagnosis || !prescriptionForm.medications) {
        toast.error('Please fill all required fields')
        return
      }

      setIsSubmittingPrescription(true)
      if (!doctorProfile?.id) {
        toast.error('Doctor profile not found')
        return
      }

      const selectedPatient = patients.find(p => p.id === prescriptionForm.patientId)
      if (!selectedPatient) {
        toast.error('Selected patient not found')
        return
      }

      // Parse medications (split by comma)
      const medicationArray = prescriptionForm.medications
        .split(',')
        .map(m => m.trim())
        .filter(m => m.length > 0)

      // Create prescription payload
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
        issuedDate: new Date().toISOString()
      }

      // Create prescription
      const prescriptionRes = await api.post('/prescriptions', prescriptionData)

      // Send email if enabled
      if (prescriptionForm.sendEmail) {
        try {
          const emailPayload = {
            to: selectedPatient.email,
            subject: `Prescription from Dr. ${doctorProfile.name}`,
            patientName: selectedPatient.name,
            doctorName: doctorProfile.name,
            doctorSpecialization: doctorProfile.specialization || 'Doctor',
            diagnosis: prescriptionForm.diagnosis,
            medications: medicationArray,
            dosage: prescriptionForm.dosage,
            duration: prescriptionForm.duration,
            notes: prescriptionForm.notes,
            issuedDate: new Date().toLocaleDateString()
          }

          await api.post('/notifications/send-prescription-email', emailPayload)
          toast.success('Prescription issued and email sent!')
        } catch (emailErr) {
          console.error('Email sending failed:', emailErr)
          toast.error('Prescription created but email could not be sent')
        }
      } else {
        toast.success('Prescription issued successfully!')
      }

      // Reset form
      setPrescriptionForm({
        patientId: '',
        diagnosis: '',
        medications: '',
        dosage: '',
        duration: '',
        notes: '',
        sendEmail: true
      })
      setShowPrescriptionModal(false)
      setShowDetailModal(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to issue prescription')
      console.error('Prescription error:', err)
    } finally {
      setIsSubmittingPrescription(false)
    }
  }

  if (!hasMounted || !isAuthenticated) return null

  const statCards = [
    {
      label: 'Total Appointments',
      value: stats.total,
      icon: <Calendar className="h-6 w-6" />,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'Confirmed',
      value: stats.confirmed,
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: <AlertCircle className="h-6 w-6" />,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'COMPLETED':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'NO_SHOW':
        return 'bg-slate-50 text-slate-700 border-slate-200'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
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
            <div className="flex items-center gap-2 mb-2 font-bold text-blue-600 text-sm uppercase tracking-widest">
              <Stethoscope className="h-4 w-4" /> Appointments
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Your Appointments</h1>
            <p className="text-slate-500 font-medium italic">Manage and track all your patient appointments</p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => fetchAppointments()}
            className="h-12 px-6 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <TrendingUp className="h-5 w-5" />
            Refresh
          </motion.button>
        </header>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
        >
          {statCards.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard className={cn("p-6 border border-slate-200", stat.bg)}>
                <div className="flex items-center justify-between mb-3">
                  <span className={cn("p-3 rounded-xl bg-white/50", stat.color)}>
                    {stat.icon}
                  </span>
                  <span className="text-2xl font-black text-slate-900">{stat.value}</span>
                </div>
                <p className="text-sm font-bold text-slate-600">{stat.label}</p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-4"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by patient name, email, or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-12 px-4 rounded-2xl border border-slate-200 bg-white font-bold text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="ALL">All Status</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-12 px-4 rounded-2xl border border-slate-200 bg-white font-bold text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="PAST">Past</option>
            </select>
          </div>
        </motion.div>

        {/* Appointments List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-6">
            <h3 className="text-2xl font-black text-slate-900 mb-6">
              Appointments ({filteredAppointments.length})
            </h3>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Activity className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-bold">Loading appointments...</p>
              </div>
            ) : filteredAppointments.length > 0 ? (
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredAppointments.map((apt, i) => (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => {
                        setSelectedAppointment(apt)
                        setShowDetailModal(true)
                      }}
                      className="cursor-pointer"
                    >
                      <GlassCard className="p-5 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all group">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          {/* Left Section */}
                          <div className="flex items-start gap-4 flex-1">
                            <div className="h-14 w-14 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-black text-lg flex-shrink-0">
                              {apt.patientName?.charAt(0) || 'P'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-black text-slate-900 text-lg">{apt.patientName}</h4>
                              <p className="text-sm text-slate-500 font-bold mb-2">{apt.reason}</p>
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                                  {new Date(apt.date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                  <Clock className="h-3.5 w-3.5 text-orange-600" />
                                  {apt.time}
                                </div>
                                {apt.appointmentType && (
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                    <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
                                    {apt.appointmentType === 'TELEMEDICINE' ? 'Virtual' : 'In-Person'}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Section */}
                          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                            <span className={cn(
                              "text-xs font-black uppercase px-3 py-1.5 rounded-lg border transition-all",
                              getStatusColor(apt.status)
                            )}>
                              {apt.status}
                            </span>
                            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors hidden md:block" />
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Calendar className="h-16 w-16 text-slate-300 mb-4" />
                <h4 className="text-xl font-black text-slate-900 mb-2">No appointments found</h4>
                <p className="text-slate-500 font-bold">Try adjusting your filters or check back later</p>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Detail Modal */}
        <AnimatePresence>
          {showDetailModal && selectedAppointment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailModal(false)}
              className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black text-slate-900">Appointment Details</h3>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-bold text-slate-500 mb-1">PATIENT</p>
                    <p className="text-lg font-black text-slate-900">{selectedAppointment.patientName}</p>
                  </div>

                  {selectedAppointment.patientEmail && (
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs font-bold text-slate-500 mb-1">EMAIL</p>
                      <p className="text-sm font-bold text-slate-700">{selectedAppointment.patientEmail}</p>
                    </div>
                  )}

                  {selectedAppointment.patientPhone && (
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs font-bold text-slate-500 mb-1">PHONE</p>
                      <p className="text-sm font-bold text-slate-700">{selectedAppointment.patientPhone}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs font-bold text-slate-500 mb-1">DATE</p>
                      <p className="text-sm font-bold text-slate-900">
                        {new Date(selectedAppointment.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs font-bold text-slate-500 mb-1">TIME</p>
                      <p className="text-sm font-bold text-slate-900">{selectedAppointment.time}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-bold text-slate-500 mb-1">REASON</p>
                    <p className="text-sm font-bold text-slate-900">{selectedAppointment.reason}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-bold text-slate-500 mb-1">STATUS</p>
                    <span className={cn(
                      "text-xs font-black uppercase px-2 py-1 rounded-lg border inline-block",
                      getStatusColor(selectedAppointment.status)
                    )}>
                      {selectedAppointment.status}
                    </span>
                  </div>

                  {selectedAppointment.notes && (
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs font-bold text-slate-500 mb-1">NOTES</p>
                      <p className="text-sm font-bold text-slate-700">{selectedAppointment.notes}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {selectedAppointment.status === 'PENDING' && (
                  <div className="flex gap-3 mb-4">
                    <AnimatedButton
                      variant="primary"
                      className="flex-1"
                      onClick={() => updateAppointmentStatus(selectedAppointment.id, 'CONFIRMED')}
                      disabled={updating}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Confirm
                    </AnimatedButton>
                    <AnimatedButton
                      variant="outline"
                      className="flex-1"
                      onClick={() => updateAppointmentStatus(selectedAppointment.id, 'CANCELLED')}
                      disabled={updating}
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel
                    </AnimatedButton>
                  </div>
                )}

                {selectedAppointment.status === 'CONFIRMED' && (
                  <AnimatedButton
                    variant="primary"
                    className="w-full mb-4"
                    onClick={() => updateAppointmentStatus(selectedAppointment.id, 'COMPLETED')}
                    disabled={updating}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mark as Completed
                  </AnimatedButton>
                )}

                {/* Issue Prescription Button */}
                {selectedAppointment.status === 'COMPLETED' && (
                  <AnimatedButton
                    variant="primary"
                    className="w-full mb-4 bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => {
                      setPrescriptionForm({
                        patientId: selectedAppointment.patientId,
                        diagnosis: '',
                        medications: '',
                        dosage: '',
                        duration: '',
                        notes: '',
                        sendEmail: true
                      })
                      setShowPrescriptionModal(true)
                    }}
                  >
                    <Pill className="h-4 w-4" />
                    Issue Prescription
                  </AnimatedButton>
                )}

                <AnimatedButton
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </AnimatedButton>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prescription Modal */}
        <AnimatePresence>
          {showPrescriptionModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPrescriptionModal(false)}
              className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black text-slate-900">Issue Prescription</h3>
                  <button
                    onClick={() => setShowPrescriptionModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Patient Dropdown */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block">SELECT PATIENT *</label>
                    <select
                      value={prescriptionForm.patientId}
                      onChange={(e) => setPrescriptionForm({
                        ...prescriptionForm,
                        patientId: e.target.value
                      })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    >
                      <option value="">Choose a patient...</option>
                      {patients.map(patient => (
                        <option key={patient.id} value={patient.id}>
                          {patient.name} ({patient.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Diagnosis */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block">DIAGNOSIS *</label>
                    <input
                      type="text"
                      placeholder="Enter diagnosis..."
                      value={prescriptionForm.diagnosis}
                      onChange={(e) => setPrescriptionForm({
                        ...prescriptionForm,
                        diagnosis: e.target.value
                      })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  {/* Medications */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block">MEDICATIONS * (comma separated)</label>
                    <textarea
                      placeholder="e.g., Aspirin, Vitamins, Antibiotics..."
                      value={prescriptionForm.medications}
                      onChange={(e) => setPrescriptionForm({
                        ...prescriptionForm,
                        medications: e.target.value
                      })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 min-h-20 resize-none"
                    />
                  </div>

                  {/* Dosage */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block">DOSAGE</label>
                    <input
                      type="text"
                      placeholder="e.g., 500mg twice daily..."
                      value={prescriptionForm.dosage}
                      onChange={(e) => setPrescriptionForm({
                        ...prescriptionForm,
                        dosage: e.target.value
                      })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block">DURATION</label>
                    <input
                      type="text"
                      placeholder="e.g., 7 days, 2 weeks..."
                      value={prescriptionForm.duration}
                      onChange={(e) => setPrescriptionForm({
                        ...prescriptionForm,
                        duration: e.target.value
                      })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block">ADDITIONAL NOTES</label>
                    <textarea
                      placeholder="Any additional instructions..."
                      value={prescriptionForm.notes}
                      onChange={(e) => setPrescriptionForm({
                        ...prescriptionForm,
                        notes: e.target.value
                      })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 min-h-20 resize-none"
                    />
                  </div>

                  {/* Send Email Checkbox */}
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <input
                      type="checkbox"
                      id="sendEmail"
                      checked={prescriptionForm.sendEmail}
                      onChange={(e) => setPrescriptionForm({
                        ...prescriptionForm,
                        sendEmail: e.target.checked
                      })}
                      className="w-5 h-5 accent-blue-600"
                    />
                    <label htmlFor="sendEmail" className="text-sm font-bold text-slate-900 flex items-center gap-2 cursor-pointer">
                      <Mail className="h-4 w-4 text-blue-600" />
                      Send prescription to patient email
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <AnimatedButton
                    variant="primary"
                    className="flex-1"
                    onClick={handleIssuePrescription}
                    disabled={isSubmittingPrescription}
                  >
                    <Pill className="h-4 w-4" />
                    Issue Prescription
                  </AnimatedButton>
                  <AnimatedButton
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