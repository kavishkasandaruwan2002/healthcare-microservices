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
  MoreVertical,
  Plus,
  Bell,
  Search,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Cpu,
  Database,
  Globe
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

interface RemoteUser {
    id: string;
    name: string;
    email: string;
    role: string;
}

const revenueData = [
  { name: 'Mon', revenue: 4000, appointments: 40 },
  { name: 'Tue', revenue: 3000, appointments: 30 },
  { name: 'Wed', revenue: 2000, appointments: 20 },
  { name: 'Thu', revenue: 2780, appointments: 27 },
  { name: 'Fri', revenue: 1890, appointments: 18 },
  { name: 'Sat', revenue: 2390, appointments: 23 },
  { name: 'Sun', revenue: 3490, appointments: 34 },
];

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [patients, setPatients] = useState<RemoteUser[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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
      return
    }

    if (activeTab === 'users') {
        fetchPatients()
    }
  }, [isAuthenticated, activeTab, fetchPatients, router])

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

  if (!isAuthenticated) return null

  const stats = [
    { label: 'Total Patients', value: '1,245', icon: <Users />, trend: '+12%', color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Active Doctors', value: '84', icon: <Stethoscope />, trend: '+3%', color: 'text-accent-600', bg: 'bg-accent-50' },
    { label: 'Weekly Revenue', value: '$12,400', icon: <CreditCard />, trend: '+24%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'System Health', value: '99.9%', icon: <Activity />, trend: 'Stable', color: 'text-rose-600', bg: 'bg-rose-50' },
  ]

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
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Platform Command Center</h1>
            <p className="text-slate-500 font-medium">Global oversight and infrastructure management.</p>
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
        <div className="mb-8 flex space-x-2">
          {['overview', 'users', 'status'].map((tab) => (
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
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
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
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>

                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 px-1">Infrastructure</h3>
                  {[
                    { label: 'API Gateway', status: 'Online', icon: <Globe className="text-blue-500" />, load: 42 },
                    { label: 'Patient DB', status: 'Healthy', icon: <Database className="text-emerald-500" />, load: 28 },
                    { label: 'Auth Cluster', status: 'Online', icon: <ShieldCheck className="text-indigo-500" />, load: 15 },
                    { label: 'ML Engine', status: 'Standby', icon: <Cpu className="text-amber-500" />, load: 5 },
                  ].map((service) => (
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
                      placeholder="Search name or identity..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-11 w-full md:w-80 rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 placeholder:font-normal"
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
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Access Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="py-20 text-center">
                            <Activity className="h-10 w-10 text-primary-600 animate-spin mx-auto mb-4" />
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Synchronizing Core...</p>
                          </td>
                        </tr>
                      ) : filteredPatients.length > 0 ? (
                        filteredPatients.map((p, i) => (
                          <motion.tr 
                            key={p.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="group hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-black text-slate-400 text-lg shadow-inner group-hover:from-primary-50 group-hover:to-primary-100 group-hover:text-primary-600 transition-all">
                                  {p.name?.[0] || 'U'}
                                </div>
                                <div>
                                  <div className="font-black text-slate-900 group-hover:text-primary-900 transition-colors">{p.name || 'Anonymous Entity'}</div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {p.id.slice(-12)}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <span className={cn(
                                "inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                                p.role?.includes('ADMIN') 
                                  ? "bg-rose-50 text-rose-600 border-rose-100 ring-4 ring-rose-500/5" 
                                  : "bg-primary-50 text-primary-600 border-primary-100"
                              )}>
                                {p.role}
                              </span>
                            </td>
                            <td className="px-8 py-5 font-bold text-sm text-slate-600 italic">{p.email}</td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!(p.role?.includes('ADMIN')) && (
                                  <button 
                                    onClick={() => handlePromoteUser(p.id)}
                                    className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-primary-500 hover:text-white transition-all shadow-sm"
                                    title="Elevate Permissions"
                                  >
                                    <ShieldCheck className="h-4 w-4" />
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleDeleteUser(p.id)}
                                  className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                  title="Terminate Access"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                                <button className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
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
                            <p className="text-slate-500 italic">No entities found in this security layer.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {activeTab === 'status' && (
            <motion.div
              key="status"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-8 md:grid-cols-2"
            >
              <GlassCard className="p-8 border-none shadow-sm">
                <h3 className="text-xl font-bold mb-6 text-slate-900">Platform Deployment</h3>
                <div className="space-y-6">
                  {[
                    { label: 'Edge Network', status: 'Accelerated', p: 98, color: 'bg-emerald-500' },
                    { label: 'Content Mirror', status: 'Synced', p: 99, color: 'bg-blue-500' },
                    { label: 'Backend Cluster', status: 'Load Balanced', p: 75, color: 'bg-indigo-500' },
                  ].map((node) => (
                    <div key={node.label}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-bold text-slate-700">{node.label}</span>
                        <span className="text-xs font-black text-slate-400 uppercase">{node.status}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${node.p}%` }}
                          className={cn("h-full", node.color)} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
              
              <GlassCard className="bg-slate-900 text-white border-none shadow-2xl">
                <h3 className="text-xl font-bold mb-4">Integrity Audit</h3>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                  Platform infrastructure is operating within nominal parameters. Verified 128 micro-services across 4 regions.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-[10px] font-black text-slate-500 uppercase mb-1">Latency</div>
                    <div className="text-2xl font-black">24ms</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-[10px] font-black text-slate-500 uppercase mb-1">Uptime</div>
                    <div className="text-2xl font-black">100%</div>
                  </div>
                </div>
                <AnimatedButton variant="glass" className="w-full mt-8 bg-white/10 text-white border-none hover:bg-white/20">
                  Run Full Protocol
                </AnimatedButton>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
