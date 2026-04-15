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
  Users, 
  Stethoscope, 
  Calendar, 
  CreditCard, 
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
  ArrowRight,
  TrendingDown,
  Cpu,
  Database,
  Globe,
  LogOut,
  ChevronRight
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/Table'

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

// Helper to get ID from object (handles both _id and id, and MongoDB extended JSON { $oid: '...' })
const getId = (obj: any): string => {
  const raw = obj?._id || obj?.id || ''
  // Handle MongoDB extended JSON format where _id is { $oid: '...' }
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

  // Check authorization and set mounted flag
  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // Load data based on active tab
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

  const handleDeletePatient = async (patient: Patient) => {
    const patientId = getId(patient)
    if (!patientId) return
    
    if (!confirm('Are you sure you want to delete this patient?')) return
    
    try {
      setDeleteLoading(patientId)
      await api.delete(`/patients/${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      toast.success('Patient deleted successfully')
      fetchPatients()
    } catch (error) {
      toast.error('Failed to delete patient')
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleApproveDoctor = async (doctor: Doctor) => {
    const doctorId = getId(doctor)
    if (!doctorId) return
    
    try {
      setApproveLoading(doctorId)
      await api.patch(
        `/doctors/${doctorId}/status`,
        doctor,
        {
          params: { status: 'APPROVED' },
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }
      )
      toast.success('Doctor approved successfully')
      fetchPendingDoctors()
      fetchAllDoctors()
    } catch (error) {
      toast.error('Failed to approve doctor')
    } finally {
      setApproveLoading(null)
    }
  }

  if (!mounted || !user) return null
  if (user.role !== 'ADMIN' && user.role !== 'ROLE_ADMIN') return null

  const filteredPatients = patients.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Platform Command Center</h1>
            <p className="text-slate-500 font-medium italic">Global oversight and infrastructure management.</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-all hover:bg-slate-50 hover:text-primary-600">
              <Bell className="h-5 w-5" />
            </button>
            <AnimatedButton className="h-12 gap-2 shadow-none">
              <Plus className="h-4 w-4" /> System Report
            </AnimatedButton>
          </motion.div>
        </header>

        {/* Dynamic Tabs Indicator */}
        <div className="mb-8 flex space-x-2 bg-white/50 p-1.5 rounded-2xl border border-slate-200 w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'users', label: 'Patients', icon: Users },
            { id: 'doctors', label: 'Doctor Verification', icon: Stethoscope }
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
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              {/* Stats Grid */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Total Patients', value: stats.totalPatients, icon: <Users />, trend: '+12%', color: 'text-primary-600', bg: 'bg-primary-50' },
                  { label: 'Verified Doctors', value: stats.totalDoctors, icon: <Stethoscope />, trend: '+5%', color: 'text-accent-600', bg: 'bg-accent-50' },
                  { label: 'Platform Revenue', value: `Rs. ${stats.totalRevenue}`, icon: <CreditCard />, trend: '+24%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Pending Approvals', value: stats.pendingDoctors, icon: <Activity />, trend: 'Update', color: 'text-rose-600', bg: 'bg-rose-50' },
                ].map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <GlassCard className="flex items-center gap-4 border-none shadow-sm hover:shadow-md transition-shadow">
                      <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl", stat.bg, stat.color)}>
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-slate-900 leading-none">{stat.value}</span>
                          <span className={cn(
                            "text-[10px] font-black px-1.5 py-0.5 rounded-lg border",
                            stat.trend?.includes('+') ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-slate-500 bg-slate-50 border-slate-100"
                          )}>
                            {stat.trend}
                          </span>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid gap-8 lg:grid-cols-3">
                <GlassCard className="lg:col-span-2 p-8 border-none shadow-sm">
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">Platform Activity</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Growth Metrics</p>
                    </div>
                  </div>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockAppointments}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 900}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 900}} />
                        <Tooltip 
                          cursor={{fill: '#f8fafc'}}
                          contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                          labelStyle={{ color: '#94a3b8', fontWeight: 900, marginBottom: '4px' }}
                          itemStyle={{ color: '#fff', fontWeight: 900 }}
                        />
                        <Bar dataKey="appointments" fill="#3b82f6" radius={[10, 10, 10, 10]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>

                <GlassCard className="p-8 border-none shadow-sm flex flex-col">
                  <h3 className="text-xl font-black text-slate-900 mb-8 italic">System Health</h3>
                  <div className="space-y-6 flex-1">
                    {[
                      { icon: <Cpu />, label: 'Server Load', val: '24%', color: 'text-emerald-500' },
                      { icon: <Database />, label: 'Storage', val: '68%', color: 'text-amber-500' },
                      { icon: <Globe />, label: 'Latency', val: '12ms', color: 'text-blue-500' }
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="text-slate-400">{item.icon}</div>
                          <span className="text-sm font-black text-slate-600 uppercase tracking-tight">{item.label}</span>
                        </div>
                        <span className={cn("font-black", item.color)}>{item.val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-8 border-t border-slate-100 italic text-center text-xs text-slate-400 font-bold">
                    All systems operational
                  </div>
                </GlassCard>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <GlassCard className="border-none shadow-sm overflow-hidden p-0">
                <div className="p-8 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Patient Management</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Found {patients.length} records</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-11 w-full md:w-64 rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-xs font-bold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all"
                    />
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                        <TableHead className="font-black text-slate-900 uppercase tracking-tighter text-xs">Patient</TableHead>
                        <TableHead className="font-black text-slate-900 uppercase tracking-tighter text-xs">Email</TableHead>
                        <TableHead className="font-black text-slate-900 uppercase tracking-tighter text-xs">Phone</TableHead>
                        <TableHead className="font-black text-slate-900 uppercase tracking-tighter text-xs">Role</TableHead>
                        <TableHead className="text-right font-black text-slate-900 uppercase tracking-tighter text-xs">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPatients.map((p) => (
                        <TableRow key={getId(p)} className="hover:bg-slate-50/30 transition-colors">
                          <TableCell className="font-black text-slate-900">{p.name}</TableCell>
                          <TableCell className="font-medium text-slate-500">{p.email}</TableCell>
                          <TableCell className="font-medium text-slate-400 italic">{p.phone || '—'}</TableCell>
                          <TableCell>
                             <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                               Patient
                             </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <button 
                              onClick={() => handleDeletePatient(p)}
                              disabled={deleteLoading === getId(p)}
                              className="h-9 w-9 inline-flex items-center justify-center rounded-xl text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {activeTab === 'doctors' && (
            <motion.div key="doctors" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
              <GlassCard className="border-none shadow-sm p-8 bg-amber-50/30 border-amber-100">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-8">
                  <div className="h-8 w-8 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  Pending Verification Queue
                </h3>
                
                <div className="grid gap-6">
                  {pendingDoctors.length > 0 ? pendingDoctors.map(doc => (
                    <div key={getId(doc)} className="group flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-[2rem] bg-white border border-slate-100 hover:shadow-xl transition-all">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors font-black">
                          {doc.name[0]}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-lg">{doc.name}</div>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-1">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-lg text-slate-600">{doc.specialization}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-200" />
                            <span>{doc.yearsOfExperience} years exp.</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 flex gap-2">
                        <button 
                          onClick={() => handleApproveDoctor(doc)}
                          className="h-11 px-6 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" /> Approve
                        </button>
                        <button className="h-11 px-6 bg-white border border-slate-100 text-rose-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center gap-2">
                          <XCircle className="h-4 w-4" /> Reject
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12 text-slate-400 font-bold italic">
                      No pending applications at this time.
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* Verified Doctors List */}
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-6 italic px-4">Active Medical Network</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {allDoctors.map(doc => (
                    <GlassCard key={getId(doc)} className="border-none shadow-sm flex items-center gap-4 hover:bg-white transition-colors">
                       <div className="h-12 w-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center font-black">
                         {doc.name[0]}
                       </div>
                       <div className="flex-1">
                         <div className="font-black text-slate-900">{doc.name}</div>
                         <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{doc.specialization}</div>
                       </div>
                       <ChevronRight className="h-4 w-4 text-slate-300" />
                    </GlassCard>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
