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
  FileText,
  Bell,
  LogOut,
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Activity,
  CheckCircle,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  Calendar,
  User,
  Pill,
  File,
  Download,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'

interface Prescription {
  id: string
  patientId: string
  patientName: string
  diagnosis: string
  medications: string[]
  notes: string
  issuedDate: string
  status: string
  [key: string]: any
}

interface DoctorProfile {
  id: string
  name: string
  email: string
  [key: string]: any
}

export default function DoctorPrescriptionsPage() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)

  const [newPrescription, setNewPrescription] = useState({
    patientName: '',
    diagnosis: '',
    medications: '',
    notes: '',
    status: 'Active'
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

  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true)
      if (user?.id) {
        // Fetch prescriptions issued by this doctor
        const res = await api.get(`/prescriptions/doctor/${user.id}`)
        setPrescriptions(Array.isArray(res.data) ? res.data : [])
      }
    } catch (err: any) {
      console.error('Failed to fetch prescriptions:', err)
      toast.error('Failed to load prescriptions')
      setPrescriptions([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isAuthenticated && user?.id && hasMounted) {
      fetchDoctorProfile()
      fetchPrescriptions()
    }
  }, [isAuthenticated, user?.id, hasMounted, fetchDoctorProfile, fetchPrescriptions])

  const handleCreatePrescription = async () => {
    try {
      if (!newPrescription.patientName || !newPrescription.diagnosis || !newPrescription.medications) {
        toast.error('Please fill all required fields')
        return
      }

      setIsSubmitting(true)
      if (!doctorProfile?.id) {
        toast.error('Doctor profile not found')
        return
      }

      const medicationArray = newPrescription.medications
        .split(',')
        .map(m => m.trim())
        .filter(m => m.length > 0)

      await api.post(`/prescriptions`, {
        doctorId: doctorProfile.id,
        patientName: newPrescription.patientName,
        diagnosis: newPrescription.diagnosis,
        medications: medicationArray,
        notes: newPrescription.notes,
        status: newPrescription.status
      })

      toast.success('Prescription created successfully!')
      setNewPrescription({
        patientName: '',
        diagnosis: '',
        medications: '',
        notes: '',
        status: 'Active'
      })
      setShowAddForm(false)
      await fetchPrescriptions()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create prescription')
      console.error('Create error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePrescription = async (prescriptionId: string) => {
    if (!confirm('Are you sure you want to delete this prescription?')) return

    try {
      await api.delete(`/prescriptions/${prescriptionId}`)
      toast.success('Prescription deleted successfully')
      await fetchPrescriptions()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete prescription')
    }
  }

  const handleRevokePrescription = async (prescriptionId: string) => {
    try {
      await api.put(`/prescriptions/${prescriptionId}`, { status: 'Revoked' })
      toast.success('Prescription revoked successfully')
      await fetchPrescriptions()
    } catch (err: any) {
      toast.error('Failed to revoke prescription')
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!hasMounted || !isAuthenticated) return null

  // Filter prescriptions
  const filteredPrescriptions = prescriptions.filter(p => {
    const matchesSearch = p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || p.status.toLowerCase() === filterStatus.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const activePrescriptions = prescriptions.filter(p => p.status === 'Active').length
  const revokedPrescriptions = prescriptions.filter(p => p.status === 'Revoked').length

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
              Manage Prescriptions
            </h1>
            <p className="text-slate-500 font-medium">
              Create, view, and manage patient prescriptions
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
              onClick={() => setShowAddForm(!showAddForm)} 
              className="h-12 gap-2"
            >
              <Plus className="h-4 w-4" /> New Prescription
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
            <p className="text-slate-500">Loading prescriptions...</p>
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
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Total</p>
                    <p className="text-2xl font-bold text-slate-900">{prescriptions.length}</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6 border-none shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Active</p>
                    <p className="text-2xl font-bold text-slate-900">{activePrescriptions}</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6 border-none shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Revoked</p>
                    <p className="text-2xl font-bold text-slate-900">{revokedPrescriptions}</p>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* New Prescription Form */}
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <GlassCard className="p-8 border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50/30">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-slate-900">Create New Prescription</h3>
                      <button 
                        onClick={() => setShowAddForm(false)}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <X className="h-5 w-5 text-slate-400" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Patient Name *</Label>
                          <Input 
                            type="text"
                            placeholder="John Doe"
                            value={newPrescription.patientName}
                            onChange={e => setNewPrescription({...newPrescription, patientName: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Diagnosis *</Label>
                          <Input 
                            type="text"
                            placeholder="Hypertension, Diabetes..."
                            value={newPrescription.diagnosis}
                            onChange={e => setNewPrescription({...newPrescription, diagnosis: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Medications (comma-separated) *</Label>
                        <textarea 
                          rows={3}
                          placeholder="e.g., Aspirin 100mg, Metformin 500mg"
                          className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-sans resize-none"
                          value={newPrescription.medications}
                          onChange={e => setNewPrescription({...newPrescription, medications: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Additional Notes</Label>
                        <textarea 
                          rows={3}
                          placeholder="Special instructions, dosage information..."
                          className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-sans resize-none"
                          value={newPrescription.notes}
                          onChange={e => setNewPrescription({...newPrescription, notes: e.target.value})}
                        />
                      </div>

                      <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                        <button 
                          onClick={() => setShowAddForm(false)}
                          className="px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors font-bold text-slate-900"
                        >
                          Cancel
                        </button>
                        <AnimatedButton 
                          onClick={handleCreatePrescription} 
                          disabled={isSubmitting}
                          className="h-12"
                        >
                          {isSubmitting ? 'Creating...' : 'Create Prescription'}
                        </AnimatedButton>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search and Filter */}
            <div className="flex gap-4 flex-col md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 md:max-w-md">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by patient name or diagnosis..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                />
              </div>
              <div className="flex gap-2">
                {['All', 'Active', 'Revoked'].map(status => (
                  <button 
                    key={status}
                    onClick={() => setFilterStatus(status.toLowerCase())}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                      filterStatus === status.toLowerCase() 
                        ? "bg-slate-900 text-white shadow-md" 
                        : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Prescriptions List */}
            <div className="space-y-4">
              {filteredPrescriptions.length === 0 ? (
                <GlassCard className="p-16 text-center border-dashed border-slate-200 shadow-none">
                  <Pill className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Prescriptions Found</h3>
                  <p className="text-slate-500 mb-6">
                    {prescriptions.length === 0 
                      ? 'Create your first prescription to get started' 
                      : 'No prescriptions match your search filters'}
                  </p>
                </GlassCard>
              ) : (
                <div className="space-y-4">
                  {filteredPrescriptions.map((rx, i) => (
                    <motion.div
                      key={rx.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <GlassCard className="p-0 overflow-hidden hover:shadow-lg transition-all group">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6">
                          <div className="flex gap-4 flex-1">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                              <FileText className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-slate-900 mb-1">{rx.patientName}</h4>
                              <p className="text-sm text-slate-600 mb-2">{rx.diagnosis}</p>
                              <div className="flex gap-2 flex-wrap">
                                {rx.medications?.slice(0, 2).map((med, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 text-[10px] font-bold text-slate-600">
                                    <Pill className="h-3 w-3" /> {med}
                                  </span>
                                ))}
                                {rx.medications?.length > 2 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-50 text-[10px] font-bold text-slate-600">
                                    +{rx.medications.length - 2} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 ml-auto">
                            <div className="text-right hidden sm:block">
                              <p className="text-xs text-slate-500 mb-1">Issued</p>
                              <p className="text-sm font-bold text-slate-900">{rx.issuedDate}</p>
                            </div>
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              rx.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-red-50 text-red-700'
                            )}>
                              {rx.status === 'Active' ? '✓' : '✕'} {rx.status}
                            </span>

                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => setSelectedPrescription(rx)}
                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                              </button>
                              {rx.status === 'Active' && (
                                <button 
                                  onClick={() => handleRevokePrescription(rx.id)}
                                  className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
                                >
                                  <AlertCircle className="h-4 w-4 text-amber-600" />
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeletePrescription(rx.id)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>
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