"use client"

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/Table'
import { 
  Activity, 
  Users, 
  Stethoscope, 
  Calendar, 
  CreditCard, 
  LogOut, 
  ShieldCheck, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Plus,
  AlertCircle,
  TrendingUp,
  MoreVertical,
  Bell,
  Search,
  LogOut,
  Cpu,
  Database,
  Globe
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Patient {
  _id?: string
  id?: string
  name: string
  email: string
  phone: string
  role: string
  age?: number
  gender?: string
}

interface Doctor {
  _id?: string | { $oid: string }
  id?: string
  name: string
  email: string
  specialization: string
  consultationFee: number
  status: string
  isVerified: boolean
  yearsOfExperience: string
  hospitalAffiliation: string
}

interface DashboardStats {
  totalPatients: number
  totalDoctors: number
  pendingDoctors: number
  totalRevenue: number
}

// Combined analytics data
const revenueData = [
  { name: 'Mon', revenue: 4000, appointments: 40 },
  { name: 'Tue', revenue: 3000, appointments: 30 },
  { name: 'Wed', revenue: 2000, appointments: 20 },
  { name: 'Thu', revenue: 2780, appointments: 27 },
  { name: 'Fri', revenue: 1890, appointments: 18 },
  { name: 'Sat', revenue: 2390, appointments: 23 },
  { name: 'Sun', revenue: 3490, appointments: 34 },
]

// Helper to get ID from object (handles both _id and id, and MongoDB extended JSON { $oid: '...' })
const getId = (obj: any): string => {
  const raw = obj?._id || obj?.id || ''
  if (raw && typeof raw === 'object' && raw.$oid) {
    return raw.$oid
  }
  return typeof raw === 'string' ? raw : String(raw)
}

const mockAppointments = [
  { name: 'Mon', appointments: 40 },
  { name: 'Tue', appointments: 30 },
  { name: 'Wed', appointments: 20 },
  { name: 'Thu', appointments: 27 },
  { name: 'Fri', appointments: 18 },
  { name: 'Sat', appointments: 23 },
  { name: 'Sun', appointments: 34 },
]

export default function AdminDashboard() {
  const { user, logout, token, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [mounted, setMounted] = useState(false)
  
  // State for data
  const [patients, setPatients] = useState<Patient[]>([])
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([])
  const [pendingDoctors, setPendingDoctors] = useState<Doctor[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    totalDoctors: 0,
    pendingDoctors: 0,
    totalRevenue: 0
  })
  
  // Loading states
  const [patientLoading, setPatientLoading] = useState(false)
  const [doctorLoading, setDoctorLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  
  // Action states
  const [approveLoading, setApproveLoading] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Rejection modal state
  const [rejectionModal, setRejectionModal] = useState<{ doctor: Doctor; reason: string } | null>(null)

  // Fetch patients
  const fetchPatients = useCallback(async () => {
    try {
      setPatientLoading(true)
      const response = await api.get('/patients', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      console.log('Patients response:', response.data)
      setPatients(response.data || [])
    } catch (error: any) {
      console.error('Failed to fetch patients:', error)
      toast.error('Failed to load patients')
      setPatients([])
    } finally {
      setPatientLoading(false)
    }
  }, [token])

  // Fetch all doctors
  const fetchAllDoctors = useCallback(async () => {
    try {
      setDoctorLoading(true)
      const response = await api.get('/doctors/verified', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      console.log('Verified doctors response:', response.data)
      setAllDoctors(response.data || [])
    } catch (error: any) {
      console.error('Failed to fetch doctors:', error)
      setAllDoctors([])
    } finally {
      setDoctorLoading(false)
    }
  }, [token])

  // Fetch pending doctors
  const fetchPendingDoctors = useCallback(async () => {
    try {
      setDoctorLoading(true)
      const response = await api.get('/doctors/admin/pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      console.log('Pending doctors response:', response.data)
      setPendingDoctors(response.data || [])
    } catch (error: any) {
      console.error('Failed to fetch pending doctors:', error)
      setPendingDoctors([])
    } finally {
      setDoctorLoading(false)
    }
  }, [token])

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true)

      const patientsRes = await api.get('/patients', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const patientsCount = (patientsRes.data || []).length

      const allDoctorsRes = await api.get('/doctors/verified', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const doctorsCount = (allDoctorsRes.data || []).length

      const pendingRes = await api.get('/doctors/admin/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const pendingCount = (pendingRes.data || []).length

      setStats({
        totalPatients: patientsCount,
        totalDoctors: doctorsCount,
        pendingDoctors: pendingCount,
        totalRevenue: 12400
      })
    } catch (error: any) {
      console.error('Failed to fetch statistics:', error)
    } finally {
      setStatsLoading(false)
    }
  }, [token])

  // Handle delete patient
  const handleDeletePatient = async (patient: Patient) => {
    const patientId = getId(patient)

    if (!patientId) {
      toast.error('Invalid patient ID')
      return
    }

    if (!confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
      return
    }

    try {
      setDeleteLoading(patientId)
      await api.delete(`/patients/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      toast.success('Patient deleted successfully')
      fetchPatients()
    } catch (error: any) {
      console.error('Failed to delete patient:', error)
      toast.error('Failed to delete patient')
    } finally {
      setDeleteLoading(null)
    }
  }

  // Handle approve doctor
  const handleApproveDoctor = async (doctor: Doctor) => {
    const doctorId = getId(doctor)

    if (!doctorId) {
      console.error('Doctor object:', doctor)
      toast.error('Invalid doctor ID - check console for details')
      return
    }

    try {
      setApproveLoading(doctorId)

      await api.patch(
        `/doctors/${doctorId}/status`,
        doctor,
        {
          params: { status: 'APPROVED' },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      toast.success('Doctor approved successfully')
      await fetchPendingDoctors()
      await fetchAllDoctors()
    } catch (error: any) {
      console.error('Failed to approve doctor:', error)
      toast.error('Failed to approve doctor')
    } finally {
      setApproveLoading(null)
    }
  }

  // Open rejection reason modal
  const handleRejectDoctor = (doctor: Doctor) => {
    const doctorId = getId(doctor)
    if (!doctorId) {
      toast.error('Invalid doctor ID')
      return
    }
    setRejectionModal({ doctor, reason: '' })
  }

  // Submit rejection with reason
  const submitRejection = async () => {
    if (!rejectionModal) return
    const { doctor, reason } = rejectionModal
    const doctorId = getId(doctor)

    try {
      setApproveLoading(doctorId)
      await api.patch(
        `/doctors/${doctorId}/status`,
        doctor,
        {
          params: {
            status: 'REJECTED',
            rejectionReason: reason.trim() || 'Your application did not meet our current requirements.'
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      toast.success('Doctor rejected – notification email sent')
      setRejectionModal(null)
      await fetchPendingDoctors()
    } catch (error: any) {
      console.error('Failed to reject doctor:', error)
      toast.error('Failed to reject doctor')
    } finally {
      setApproveLoading(null)
    }
  }

  // Handle delete user
  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/patients/${id}`)
        toast.success('User deleted successfully')
        fetchPatients()
      } catch (error) {
        toast.error('Failed to delete user')
      }
    }
  }

  // Handle promote user
  const handlePromoteUser = async (id: string) => {
    try {
      await api.patch(`/patients/${id}/promote`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      toast.success('User promoted to admin')
      fetchPatients()
    } catch (error) {
      toast.error('Failed to promote user')
    }
  }

  // Load data based on active tab
  useEffect(() => {
    setMounted(true)

    if (!isAuthenticated) {
      router.push('/login')
      return
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!mounted || !isAuthenticated || !user || !token) return

    if (activeTab === 'overview') {
      fetchStats()
    } else if (activeTab === 'users') {
      fetchPatients()
    } else if (activeTab === 'doctors') {
      fetchPendingDoctors()
      fetchAllDoctors()
    }
  }, [activeTab, isAuthenticated, user, token, mounted, fetchStats, fetchPatients, fetchPendingDoctors, fetchAllDoctors])

  if (!mounted || !user || (user.role !== 'ADMIN' && user.role !== 'ROLE_ADMIN')) return null

  const filteredPatients = patients.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const statsDisplay = [
    { label: 'Total Patients', value: stats.totalPatients, icon: Users, trend: '+12%', color: 'blue' },
    { label: 'Active Doctors', value: stats.totalDoctors, icon: Stethoscope, trend: '+5%', color: 'indigo' },
    { label: 'Pending Approvals', value: stats.pendingDoctors, icon: AlertCircle, trend: '0', color: 'amber' },
    { label: 'Platform Revenue', value: `Rs. ${stats.totalRevenue}`, icon: CreditCard, trend: '+24%', color: 'emerald' },
  ]

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="ADMIN" />

      <main className="flex-1 lg:ml-[80px] xl:ml-[280px] p-4 md:p-8 pt-20 lg:pt-8 transition-all duration-300">
        {/* Header */}
        <header className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Platform Command Center</h1>
            <p className="text-slate-500 font-medium">Global oversight and infrastructure management.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-all hover:bg-slate-50 hover:text-blue-600">
              <Bell className="h-5 w-5" />
            </button>
            <AnimatedButton className="h-12 gap-2 shadow-none">
              <Plus className="h-4 w-4" /> System Report
            </AnimatedButton>
          </motion.div>
        </header>

        {/* Tabs */}
        <div className="mb-8 flex space-x-2">
          {['overview', 'users', 'doctors'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 capitalize",
                activeTab === tab
                  ? "bg-slate-900 text-white shadow-lg"
                  : "text-slate-500 hover:bg-slate-200/50"
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
              className="space-y-10"
            >
              {/* Stats Grid */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {statsDisplay.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <GlassCard className="border-none shadow-sm hover:shadow-md transition-shadow p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-${stat.color}-50`}>
                          <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                        </div>
                        <span className={`text-sm font-bold text-${stat.color}-600`}>{stat.trend}</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid gap-8 lg:grid-cols-3">
                <GlassCard className="lg:col-span-2 p-0 overflow-hidden border-none shadow-sm">
                  <div className="p-8 pb-0">
                    <h3 className="text-xl font-bold text-slate-900">Platform Analytics</h3>
                    <p className="text-sm text-slate-500">Revenue and appointment volume correlation</p>
                  </div>
                  <div className="h-[400px] w-full p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>

                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 px-1">Infrastructure</h3>
                  {([
                    { label: 'API Gateway', status: 'Online', icon: <Globe className="text-blue-500" />, load: 42 },
                    { label: 'Patient DB', status: 'Healthy', icon: <Database className="text-emerald-500" />, load: 28 },
                    { label: 'Auth Cluster', status: 'Online', icon: <ShieldCheck className="text-indigo-500" />, load: 15 },
                    { label: 'ML Engine', status: 'Standby', icon: <Cpu className="text-amber-500" />, load: 5 },
                  ]).map((service) => (
                    <GlassCard key={service.label} className="p-4 border-none shadow-xs hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-50">{service.icon}</div>
                          <span className="font-bold text-slate-900 text-sm">{service.label}</span>
                        </div>
                        <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                          {service.status}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${service.load}%` }}
                          className="h-full bg-slate-900"
                        />
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <GlassCard className="p-0 overflow-hidden border-none shadow-sm">
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 leading-none">User Directory</h3>
                    <p className="text-sm text-slate-500 mt-2 font-medium">Manage permissions and oversee all platform participants.</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-11 w-full md:w-80 rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:font-normal"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">User Identity</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Security Group</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Communication</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {patientLoading ? (
                        <tr>
                          <td colSpan={4} className="py-20 text-center">
                            <Activity className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading patients...</p>
                          </td>
                        </tr>
                      ) : filteredPatients.length > 0 ? (
                        filteredPatients.map((p, i) => (
                          <motion.tr
                            key={getId(p)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="group hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-black text-slate-400 text-lg">
                                  {p.name?.[0] || 'U'}
                                </div>
                                <div>
                                  <div className="font-black text-slate-900">{p.name}</div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {getId(p).slice(-12)}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <span className={cn(
                                "inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                                p.role?.includes('ADMIN')
                                  ? "bg-rose-50 text-rose-600 border-rose-100"
                                  : "bg-blue-50 text-blue-600 border-blue-100"
                              )}>
                                {p.role}
                              </span>
                            </td>
                            <td className="px-8 py-5 font-bold text-sm text-slate-600">{p.email}</td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!(p.role?.includes('ADMIN')) && (
                                  <button
                                    onClick={() => handlePromoteUser(getId(p))}
                                    className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-blue-500 hover:text-white transition-all"
                                    title="Promote to Admin"
                                  >
                                    <ShieldCheck className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteUser(getId(p))}
                                  disabled={deleteLoading === getId(p)}
                                  className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                                <button className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white transition-all">
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-20 text-center">
                            <Users className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-500">No users found.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Doctors Tab */}
          {activeTab === 'doctors' && (
            <motion.div
              key="doctors"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Pending Doctors */}
              <GlassCard className="border-none shadow-sm p-0 overflow-hidden">
                <div className="p-8 border-b border-slate-50">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    Pending Doctor Approvals ({pendingDoctors.length})
                  </h3>
                  <p className="text-slate-500 text-sm mt-2">Doctors awaiting verification</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Name</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Specialization</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Email</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Experience</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {doctorLoading ? (
                        <tr>
                          <td colSpan={5} className="py-20 text-center">
                            <Activity className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
                            <p className="text-slate-500">Loading...</p>
                          </td>
                        </tr>
                      ) : pendingDoctors.length > 0 ? (
                        pendingDoctors.map((doctor) => (
                          <tr key={getId(doctor)} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-4 font-bold text-slate-900">{doctor.name}</td>
                            <td className="px-8 py-4 text-slate-600">{doctor.specialization}</td>
                            <td className="px-8 py-4 text-slate-600 text-sm">{doctor.email}</td>
                            <td className="px-8 py-4 text-slate-600">{doctor.yearsOfExperience} yrs</td>
                            <td className="px-8 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleApproveDoctor(doctor)}
                                  disabled={approveLoading === getId(doctor)}
                                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectDoctor(doctor)}
                                  disabled={approveLoading === getId(doctor)}
                                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold border border-red-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  <XCircle className="h-3 w-3" />
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-20 text-center">
                            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                            <p className="text-slate-900 font-bold">All doctors verified!</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCard>

              {/* Verified Doctors */}
              <GlassCard className="border-none shadow-sm p-0 overflow-hidden">
                <div className="p-8 border-b border-slate-50">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    Verified Doctors ({allDoctors.length})
                  </h3>
                  <p className="text-slate-500 text-sm mt-2">Active verified doctors</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Name</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Specialization</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Email</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Consultation Fee</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {doctorLoading ? (
                        <tr>
                          <td colSpan={5} className="py-20 text-center">
                            <Activity className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
                            <p className="text-slate-500">Loading...</p>
                          </td>
                        </tr>
                      ) : allDoctors.length > 0 ? (
                        allDoctors.map((doctor) => (
                          <tr key={getId(doctor)} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-4 font-bold text-slate-900">{doctor.name}</td>
                            <td className="px-8 py-4 text-slate-600">{doctor.specialization}</td>
                            <td className="px-8 py-4 text-slate-600 text-sm">{doctor.email}</td>
                            <td className="px-8 py-4 text-slate-600">Rs. {doctor.consultationFee}</td>
                            <td className="px-8 py-4">
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                                <CheckCircle className="h-3 w-3" />
                                Verified
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-20 text-center">
                            <Stethoscope className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-500">No verified doctors yet.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rejection Modal */}
        {rejectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-5">
                <h3 className="text-white font-bold text-lg">Reject Doctor Application</h3>
                <p className="text-red-100 text-sm mt-1">Provide a reason — it will be included in the notification email.</p>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-sm">
                    {rejectionModal.doctor.name?.[0] || 'D'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{rejectionModal.doctor.name}</p>
                    <p className="text-sm text-slate-500">{rejectionModal.doctor.specialization}</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-5">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectionModal.reason}
                  onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                  placeholder="e.g. Insufficient documentation, invalid license number..."
                  rows={4}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none transition-all"
                />
                <p className="text-xs text-slate-400 mt-2">Leave blank for default message.</p>
              </div>

              <div className="px-6 pb-6 flex gap-3 justify-end">
                <button
                  onClick={() => setRejectionModal(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRejection}
                  disabled={approveLoading === getId(rejectionModal.doctor)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 transition-all disabled:opacity-60 flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  {approveLoading === getId(rejectionModal.doctor) ? 'Rejecting...' : 'Reject & Notify'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
