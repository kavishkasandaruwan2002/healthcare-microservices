"use client"

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Activity, Users, Stethoscope, Calendar, CreditCard, LogOut, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const mockData = [
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

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    } else if (user?.role !== 'ADMIN') {
      router.push('/')
    }
  }, [isAuthenticated, user, router])

  if (!user || user.role !== 'ADMIN') return null

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="w-64 border-r border-slate-200 bg-slate-900 text-slate-300 p-6 hidden md:block">
        <div className="flex items-center gap-2 mb-10 text-white">
          <Activity className="h-6 w-6 text-blue-500" />
          <span className="text-xl font-bold tracking-tight">Admin Console</span>
        </div>
        <nav className="space-y-1">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-blue-600 outline-none text-white font-medium' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Activity className="h-5 w-5" /> Overview
          </button>
          <button 
            onClick={() => setActiveTab('users')}
             className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-blue-600 outline-none text-white font-medium' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Users className="h-5 w-5" /> Users Management
          </button>
          <button 
            onClick={() => setActiveTab('doctors')}
             className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'doctors' ? 'bg-blue-600 outline-none text-white font-medium' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Stethoscope className="h-5 w-5" /> Verify Doctors
          </button>
          <button 
            onClick={() => setActiveTab('appointments')}
             className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'appointments' ? 'bg-blue-600 outline-none text-white font-medium' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Calendar className="h-5 w-5" /> Appointments
          </button>
          <button 
            onClick={() => setActiveTab('payments')}
             className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'payments' ? 'bg-blue-600 outline-none text-white font-medium' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <CreditCard className="h-5 w-5" /> Payments
          </button>
        </nav>
        <div className="absolute bottom-6 w-52">
          <button 
            onClick={() => { logout(); router.push('/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors font-medium border border-transparent"
          >
            <LogOut className="h-5 w-5" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 md:p-12 overflow-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Platform Overview
          </h1>
          <p className="text-slate-500 mt-1">Supervise the entire Smart HealthCare platform.</p>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-x-4">
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-medium text-slate-500">Total Users</span>
                      <span className="text-2xl font-bold text-slate-900">1,245</span>
                    </div>
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 ring-4 ring-blue-50/50">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-x-4">
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-medium text-slate-500">Active Doctors</span>
                      <span className="text-2xl font-bold text-slate-900">84</span>
                    </div>
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 ring-4 ring-blue-50/50">
                      <Stethoscope className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-x-4">
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-medium text-slate-500">Appointments Weekly</span>
                      <span className="text-2xl font-bold text-slate-900">192</span>
                    </div>
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 ring-4 ring-blue-50/50">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-x-4">
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-medium text-slate-500">Platform Revenue</span>
                      <span className="text-2xl font-bold text-slate-900">$12,400</span>
                    </div>
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 ring-4 ring-blue-50/50">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Appointments Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: '#f1f5f9'}} />
                      <Bar dataKey="appointments" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Other tabs can have placeholders or tables */}
        {activeTab !== 'overview' && (
          <div className="space-y-6 fade-in">
            <h2 className="text-xl font-bold text-slate-900 capitalize">{activeTab.replace('-', ' ')}</h2>
            <Card className="border-slate-200">
              <CardContent className="p-0">
                <div className="p-8 text-center text-slate-500">
                  Data table for {activeTab} will be integrated with Spring Boot APIs.
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
