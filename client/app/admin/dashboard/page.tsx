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
  MoreVertical,
  Plus
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface RemoteUser {
    id: string;
    name: string;
    email: string;
    role: string;
}

const mockAppointments = [
  { name: 'Mon', appointments: 40 },
  { name: 'Tue', appointments: 30 },
  { name: 'Wed', appointments: 20 },
  { name: 'Thu', appointments: 27 },
  { name: 'Fri', appointments: 18 },
  { name: 'Sat', appointments: 23 },
  { name: 'Sun', appointments: 34 },
];

export default function AdminDashboard() {
  const { user, logout, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [patients, setPatients] = useState<RemoteUser[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/patients')
      setPatients(response.data)
    } catch (error) {
      console.error('Failed to fetch patients', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    } else if (user?.role !== 'ADMIN' && user?.role !== 'ROLE_ADMIN') {
      router.push('/')
    }
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (activeTab === 'users') {
        fetchPatients()
    }
  }, [activeTab, fetchPatients])

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

  const handlePromoteUser = async (id: string) => {
    try {
        await api.post(`/patients/${id}/promote`)
        toast.success('User promoted to ADMIN')
        fetchPatients()
    } catch (error) {
        toast.error('Failed to promote user')
    }
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'ROLE_ADMIN')) return null

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <aside className="w-72 bg-[#0f172a] text-slate-400 p-8 hidden lg:flex flex-col border-r border-slate-800 shadow-xl fixed h-full">
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
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
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
              {activeTab === 'overview' ? 'Command Center' : activeTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
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

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Total Patients', value: '1,245', icon: Users, trend: '+12%', color: 'blue' },
                  { label: 'Active Doctors', value: '84', icon: Stethoscope, trend: '+5%', color: 'indigo' },
                  { label: 'Weekly Sessions', value: '192', icon: Activity, trend: '+18%', color: 'emerald' },
                  { label: 'Platform Revenue', value: '$12,400', icon: CreditCard, trend: '+24%', color: 'amber' },
                ].map((stat, idx) => (
                  <Card key={idx} className="border-0 shadow-sm ring-1 ring-slate-200/60 overflow-hidden group">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`h-12 w-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center border border-${stat.color}-100 group-hover:scale-110 transition-transform`}>
                          <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                        </div>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">
                          {stat.trend}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                        <span className="text-3xl font-black text-slate-900 mt-1 tracking-tighter">{stat.value}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid gap-8 lg:grid-cols-3">
              <Card className="lg:col-span-2 border-0 shadow-sm ring-1 ring-slate-200/60">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100/100 pb-6 px-8">
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
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockAppointments}>
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} 
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} 
                        />
                        <Tooltip 
                           cursor={{fill: '#f8fafc', radius: 8}} 
                           contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        />
                        <Bar 
                          dataKey="appointments" 
                          fill="url(#barGradient)" 
                          radius={[6, 6, 0, 0]} 
                          barSize={45} 
                        />
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
                      { msg: "New doctor application from Dr. James Smith", time: "2 mins ago", type: "system" },
                      { msg: "System maintenance scheduled for Sat midnight", time: "1 hour ago", type: "warning" },
                      { msg: "Monthly revenue goals achieved!", time: "5 hours ago", type: "success" },
                      { msg: "New feedback received for Tele-consultation", time: "3 hours ago", type: "info" }
                    ].map((note, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 flex-shrink-0 animate-pulse" />
                        <div>
                          <p className="text-sm font-semibold text-slate-700 leading-snug">{note.msg}</p>
                          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mt-1">
                             <Activity className="h-3 w-3" /> {note.time}
                          </span>
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

        {activeTab === 'users' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-0 shadow-sm ring-1 ring-slate-200/60 overflow-hidden">
               <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100/100 pb-6 px-8 bg-white">
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
                {loading ? (
                    <div className="p-20 text-center flex flex-col items-center">
                        <Activity className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                        <span className="text-slate-500 font-medium tracking-tight">Syncing user database...</span>
                    </div>
                ) : patients.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50">
                                <TableHead>User Profile</TableHead>
                                <TableHead>Permissions</TableHead>
                                <TableHead>Email Address</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {patients.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200 shadow-sm">
                                                {p.name?.[0] || 'U'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800">{p.name || 'Anonymous User'}</span>
                                                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">UID: {p.id.slice(-8)}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ring-1 ring-inset ${
                                            p.role?.includes('ADMIN') 
                                                ? 'bg-purple-50 text-purple-700 ring-purple-600/20' 
                                                : 'bg-blue-50 text-blue-700 ring-blue-600/20'
                                        }`}>
                                            {p.role}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-600">{p.email}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            {!(p.role?.includes('ADMIN')) && (
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="h-9 w-9 p-0 rounded-lg border-slate-200 text-indigo-600 hover:bg-indigo-50"
                                                    title="Promote to Admin"
                                                    onClick={() => handlePromoteUser(p.id)}
                                                >
                                                    <ShieldCheck className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-9 w-9 p-0 rounded-lg border-slate-200 text-rose-600 hover:bg-rose-50"
                                                title="Delete User"
                                                onClick={() => handleDeleteUser(p.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg text-slate-400">
                                                 <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="p-20 text-center flex flex-col items-center">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 ring-1 ring-slate-100">
                           <Users className="h-8 w-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No users found</h3>
                        <p className="text-slate-500 max-w-xs mt-1">There are no registered patients in the system matching your current filter.</p>
                        <Button className="mt-6 rounded-xl bg-slate-900 text-white" onClick={fetchPatients}>Refresh Database</Button>
                    </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Placeholders for other tabs with similar premium styling */}
        {(activeTab === 'doctors' || activeTab === 'appointments' || activeTab === 'payments') && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-32 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
              <div className="h-20 w-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-8 ring-blue-50/50">
                   {activeTab === 'doctors' ? <Stethoscope className="h-10 w-10 text-blue-600" /> : 
                    activeTab === 'appointments' ? <Calendar className="h-10 w-10 text-blue-600" /> : 
                    <CreditCard className="h-10 w-10 text-blue-600" />}
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
    </div>
  )
}
