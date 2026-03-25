"use client"

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Activity, Calendar, Users, Stethoscope, LogOut, Video, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function DoctorDashboard() {
  const { user, logout, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    } else if (user?.role !== 'DOCTOR') {
      router.push('/')
    }
  }, [isAuthenticated, user, router])

  if (!user || user.role !== 'DOCTOR') return null

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="w-64 border-r border-slate-200 bg-white p-6 hidden md:block">
        <div className="flex items-center gap-2 mb-10">
          <Activity className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold tracking-tight">HealthCare Pro</span>
        </div>
        <nav className="space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100 font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <Stethoscope className="h-5 w-5" /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('appointments')}
             className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'appointments' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100 font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <Calendar className="h-5 w-5" /> Appointments
          </button>
          <button 
            onClick={() => setActiveTab('patients')}
             className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'patients' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100 font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <Users className="h-5 w-5" /> My Patients
          </button>
        </nav>
        <div className="absolute bottom-6 w-52">
          <button 
            onClick={() => { logout(); router.push('/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors font-medium border border-transparent hover:border-red-100"
          >
            <LogOut className="h-5 w-5" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 md:p-12 overflow-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome, Dr. {user.name || 'Doctor'}
            </h1>
            <p className="text-slate-500 mt-1">Here is your schedule for today.</p>
          </div>
          <Button onClick={() => setActiveTab('appointments')} className="bg-blue-600 hover:bg-blue-700 h-11 px-6 shadow-sm">
            Manage Availability
          </Button>
        </header>

        {activeTab === 'overview' && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-slate-200">
              <CardHeader className="pb-2 text-slate-500">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">0</div>
                <p className="text-xs text-slate-500 mt-1">Requires your approval</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardHeader className="pb-2 text-slate-500">
                <CardTitle className="text-sm font-medium">Today's Consultations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">0</div>
                <p className="text-xs text-slate-500 mt-1">Scheduled for today</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardHeader className="pb-2 text-slate-500">
                <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">0</div>
                <p className="text-xs text-slate-500 mt-1">Registered under your care</p>
              </CardContent>
            </Card>

            <Card className="md:col-span-3 border-slate-200 mt-4">
              <CardHeader>
                <CardTitle>Upcoming Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-8 text-center">
                  <p className="text-slate-500">Your schedule is clear. No upcoming appointments.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="space-y-6 fade-in">
            <h2 className="text-xl font-bold text-slate-900">Manage Appointments</h2>
            <Card className="border-slate-200">
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  <div className="p-8 text-center flex flex-col items-center">
                    <Calendar className="w-12 h-12 text-blue-200 mb-4" />
                    <p className="text-slate-500 font-medium">No appointment requests at the moment.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="space-y-6 fade-in">
            <h2 className="text-xl font-bold text-slate-900">Patient Directory</h2>
            <Card className="border-slate-200">
              <CardContent className="p-0">
                <div className="p-8 text-center text-slate-500">
                  No patients assigned to you yet.
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
