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
  TrendingUp
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

  // Rejection modal state
  const [rejectionModal, setRejectionModal] = useState<{ doctor: Doctor; reason: string } | null>(null)

  // Check authorization and set mounted flag
  useEffect(() => {
    setMounted(true)
    
    if (!isAuthenticated) {
      router.push('/login')
    } else if (user?.role !== 'ADMIN' && user?.role !== 'ROLE_ADMIN') {
      router.push('/')
    }
  }, [isAuthenticated, user, router])

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

  // Handle approve doctor - with Bearer token and proper format
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

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted || !user || (user.role !== 'ADMIN' && user.role !== 'ROLE_ADMIN')) return null

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <aside className="w-72 bg-[#0f172a] text-slate-400 p-8 hidden lg:flex flex-col border-r border-slate-800 shadow-xl fixed h-full overflow-y-auto">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-lg tracking-tight uppercase">Admin</span>
            <span className="text-[10px] text-blue-500 font-semibold tracking-widest uppercase">Health Hub Panel</span>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          {[
            { id: 'overview', icon: Activity, label: 'Overview' },
            { id: 'users', icon: Users, label: 'Patient Management' },
            { id: 'doctors', icon: Stethoscope, label: 'Doctor Verification' },
            { id: 'appointments', icon: Calendar, label: 'Appointments' },
            { id: 'payments', icon: CreditCard, label: 'Platform Revenue' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                activeTab === item.id 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm' 
                  : 'hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
              }`}
            >
              <item.icon className={`h-5 w-5 ${activeTab === item.id ? 'text-blue-500' : 'group-hover:text-blue-400'}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="pt-8 border-t border-slate-800 mt-auto">
          <div className="bg-slate-800/40 rounded-2xl p-4 mb-4 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-8 w-8 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                {user.name?.[0] || 'A'}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-white text-sm font-semibold truncate">{user.name || 'Admin User'}</span>
                <span className="text-[10px] text-slate-500 truncate">{user.email}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => { logout(); router.push('/login'); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="h-5 w-5" /> 
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 p-8 lg:p-12 min-h-screen">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              {activeTab === 'overview' ? 'Command Center' : activeTab === 'users' ? 'Patient Management' : activeTab === 'doctors' ? 'Doctor Verification' : activeTab === 'appointments' ? 'Appointments' : 'Platform Revenue'}
            </h1>
            <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
              Management & Oversight Console <span className="h-1 w-1 rounded-full bg-slate-300"></span> 
              <span className="text-blue-600">v1.2.0</span>
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 font-semibold h-11">
                Download Report
             </Button>
             <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 h-11 px-6">
                <Plus className="h-4 w-4 mr-2" /> Action Hub
             </Button>
          </div>
        </header>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Total Patients', value: stats.totalPatients, icon: Users, trend: '+12%', color: 'blue' },
                { label: 'Active Doctors', value: stats.totalDoctors, icon: Stethoscope, trend: '+5%', color: 'indigo' },
                { label: 'Pending Approvals', value: stats.pendingDoctors, icon: AlertCircle, trend: '0', color: 'amber' },
                { label: 'Platform Revenue', value: `Rs. ${stats.totalRevenue}`, icon: CreditCard, trend: '+24%', color: 'emerald' },
              ].map((stat, idx) => (
                <Card key={idx} className="border-0 shadow-sm ring-1 ring-slate-200/60 overflow-hidden group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-${stat.color}-50 group-hover:bg-${stat.color}-100 transition-colors`}>
                        <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                      </div>
                      <span className={`text-sm font-bold text-${stat.color}-600`}>{stat.trend}</span>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid gap-8 lg:grid-cols-3">
              <Card className="lg:col-span-2 border-0 shadow-sm ring-1 ring-slate-200/60">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-6 px-8">
                  <div>
                    <CardTitle className="text-slate-900 text-xl">Platform Activity</CardTitle>
                    <p className="text-slate-400 text-sm font-medium mt-1">Growth of scheduled appointments over 7 days</p>
                  </div>
                  <select className="bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-lg px-3 py-1.5 font-bold focus:ring-0">
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                  </select>
                </CardHeader>
                <CardContent className="pt-8 px-6">
                  <div className="w-full" style={{ height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockAppointments}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            border: '1px solid #475569',
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: '#e2e8f0' }}
                        />
                        <Bar dataKey="appointments" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm ring-1 ring-slate-200/60">
                <CardHeader className="pb-4 px-8 border-b border-slate-100">
                  <CardTitle className="text-slate-900 text-xl">Recent Notifications</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {[
                      { icon: CheckCircle, label: 'Doctor Approved', desc: 'Dr. Saman', color: 'green' },
                      { icon: AlertCircle, label: 'New Registration', desc: 'Patient awaiting', color: 'amber' },
                      { icon: TrendingUp, label: 'Revenue Update', desc: '+Rs. 2,500', color: 'blue' },
                    ].map((notif, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-${notif.color}-50`}>
                          <notif.icon className={`h-4 w-4 text-${notif.color}-600`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{notif.label}</p>
                          <p className="text-xs text-slate-500 truncate">{notif.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="w-full mt-8 text-blue-600 font-bold hover:bg-blue-50 border border-blue-100 rounded-xl">View All System Logs</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Patient Management Tab */}
        {activeTab === 'users' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-0 shadow-sm ring-1 ring-slate-200/60 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-6 px-8 bg-white">
                <div>
                  <CardTitle className="text-slate-900 text-xl">Patient Management</CardTitle>
                  <p className="text-slate-400 text-sm font-medium mt-1">Found {patients.length} active registered users</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      className="bg-slate-50 border border-slate-200 text-sm rounded-xl px-4 py-2 w-64 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {patientLoading ? (
                  <div className="p-20 text-center flex flex-col items-center">
                    <Activity className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                    <p className="text-slate-500">Loading patients...</p>
                  </div>
                ) : patients.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200 bg-slate-50/50">
                        <TableHead className="text-slate-600 font-semibold">Name</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Email</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Phone</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Role</TableHead>
                        <TableHead className="text-slate-600 font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patients.map((patient) => (
                        <TableRow key={getId(patient)} className="border-slate-200 hover:bg-slate-50/50 transition-colors">
                          <TableCell className="font-medium text-slate-900">{patient.name}</TableCell>
                          <TableCell className="text-slate-600">{patient.email}</TableCell>
                          <TableCell className="text-slate-600">{patient.phone || 'N/A'}</TableCell>
                          <TableCell>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {patient.role === 'ROLE_PATIENT' ? 'Patient' : 'Admin'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleDeletePatient(patient)}
                                disabled={deleteLoading === getId(patient)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete patient"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-20 text-center flex flex-col items-center">
                    <Users className="h-10 w-10 text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">No patients found</p>
                    <p className="text-sm text-slate-400 mt-1">Patients will appear here when they register</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Doctor Verification Tab */}
        {activeTab === 'doctors' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Pending Doctors */}
            <Card className="border-0 shadow-sm ring-1 ring-slate-200/60 overflow-hidden">
              <CardHeader className="border-b border-slate-100 pb-6 px-8 bg-white">
                <div>
                  <CardTitle className="text-slate-900 text-xl flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    Pending Doctor Approvals
                  </CardTitle>
                  <p className="text-slate-400 text-sm font-medium mt-1">Doctors awaiting verification - {pendingDoctors.length} pending</p>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {doctorLoading ? (
                  <div className="p-20 text-center flex flex-col items-center">
                    <Activity className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                    <p className="text-slate-500">Loading pending doctors...</p>
                  </div>
                ) : pendingDoctors.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-200 bg-slate-50/50">
                          <TableHead className="text-slate-600 font-semibold">Name</TableHead>
                          <TableHead className="text-slate-600 font-semibold">Specialization</TableHead>
                          <TableHead className="text-slate-600 font-semibold">Email</TableHead>
                          <TableHead className="text-slate-600 font-semibold">Experience</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingDoctors.map((doctor) => (
                          <TableRow key={getId(doctor)} className="border-slate-200 hover:bg-slate-50/50 transition-colors">
                            <TableCell className="font-medium text-slate-900">{doctor.name}</TableCell>
                            <TableCell className="text-slate-600">{doctor.specialization}</TableCell>
                            <TableCell className="text-slate-600 text-sm">{doctor.email}</TableCell>
                            <TableCell className="text-slate-600">{doctor.yearsOfExperience} yrs</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => handleApproveDoctor(doctor)}
                                  disabled={approveLoading === getId(doctor)}
                                  className="px-3 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-bold border border-green-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleRejectDoctor(doctor)}
                                  disabled={approveLoading === getId(doctor)}
                                  className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold border border-red-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  <XCircle className="h-3 w-3" />
                                  Reject
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="p-20 text-center flex flex-col items-center">
                    <CheckCircle className="h-10 w-10 text-green-500 mb-4" />
                    <p className="text-slate-900 font-medium">All doctors verified!</p>
                    <p className="text-sm text-slate-500 mt-1">No pending doctor approvals</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Verified Doctors */}
            <Card className="border-0 shadow-sm ring-1 ring-slate-200/60 overflow-hidden">
              <CardHeader className="border-b border-slate-100 pb-6 px-8 bg-white">
                <div>
                  <CardTitle className="text-slate-900 text-xl flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Verified Doctors
                  </CardTitle>
                  <p className="text-slate-400 text-sm font-medium mt-1">Active verified doctors - {allDoctors.length} total</p>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {doctorLoading ? (
                  <div className="p-20 text-center flex flex-col items-center">
                    <Activity className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                    <p className="text-slate-500">Loading verified doctors...</p>
                  </div>
                ) : allDoctors.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-200 bg-slate-50/50">
                          <TableHead className="text-slate-600 font-semibold">Name</TableHead>
                          <TableHead className="text-slate-600 font-semibold">Specialization</TableHead>
                          <TableHead className="text-slate-600 font-semibold">Email</TableHead>
                          <TableHead className="text-slate-600 font-semibold">Consultation Fee</TableHead>
                          <TableHead className="text-slate-600 font-semibold">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allDoctors.map((doctor) => (
                          <TableRow key={getId(doctor)} className="border-slate-200 hover:bg-slate-50/50 transition-colors">
                            <TableCell className="font-medium text-slate-900">{doctor.name}</TableCell>
                            <TableCell className="text-slate-600">{doctor.specialization}</TableCell>
                            <TableCell className="text-slate-600 text-sm">{doctor.email}</TableCell>
                            <TableCell className="text-slate-600">Rs. {doctor.consultationFee}</TableCell>
                            <TableCell>
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200 flex items-center gap-1 w-fit">
                                <CheckCircle className="h-3 w-3" />
                                Verified
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="p-20 text-center flex flex-col items-center">
                    <Stethoscope className="h-10 w-10 text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">No verified doctors</p>
                    <p className="text-sm text-slate-400 mt-1">Doctors will appear here once approved</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Placeholders for other tabs */}
        {(activeTab === 'appointments' || activeTab === 'payments') && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-32 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
            <div className="h-20 w-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-8 ring-blue-50/50">
              {activeTab === 'appointments' ? <Calendar className="h-10 w-10 text-blue-600" /> : <CreditCard className="h-10 w-10 text-blue-600" />}
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Integration Pending</h2>
            <p className="text-slate-500 max-w-md mx-auto font-medium">
              The <span className="text-blue-600 font-bold uppercase tracking-wider text-xs">{activeTab}</span> module is currently being synchronized with the backend services. 
              Full administrative auditing will be available in the next release.
            </p>
            <div className="mt-8 flex gap-3 justify-center">
              <Button variant="outline" className="rounded-xl border-slate-200">System Status</Button>
              <Button className="rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20 px-8">Enable Bridge</Button>
            </div>
          </div>
        )}
      </main>

      {/* Rejection Reason Modal */}
      {rejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-5">
              <h3 className="text-white font-bold text-lg">Reject Doctor Application</h3>
              <p className="text-red-100 text-sm mt-1">Provide a reason — it will be included in the notification email.</p>
            </div>

            {/* Doctor info */}
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

            {/* Reason Input */}
            <div className="px-6 py-5">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Rejection Reason
              </label>
              <textarea
                value={rejectionModal.reason}
                onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                placeholder="e.g. Insufficient documentation, invalid license number, incomplete profile..."
                rows={4}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none transition-all"
              />
              <p className="text-xs text-slate-400 mt-2">Leave blank to use the default message.</p>
            </div>

            {/* Actions */}
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
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg shadow-red-600/25 transition-all disabled:opacity-60 flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                {approveLoading === getId(rejectionModal.doctor) ? 'Rejecting...' : 'Reject & Notify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
