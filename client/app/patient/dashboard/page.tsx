"use client"

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Activity, Calendar, FileText, User as UserIcon, LogOut, Video } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function PatientDashboard() {
  const { user, logout, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    } else if (user?.role !== 'ROLE_PATIENT' && user?.role !== 'PATIENT') {
      router.push('/')
    }
  }, [isAuthenticated, user, router])

  if (!user || (user.role !== 'ROLE_PATIENT' && user.role !== 'PATIENT')) return null

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white p-6 hidden md:block">
        <div className="flex items-center gap-2 mb-10">
          <Activity className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold tracking-tight">HealthCare</span>
        </div>
        <nav className="space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100 font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <UserIcon className="h-5 w-5" /> Profile Center
          </button>
          <button 
            onClick={() => setActiveTab('appointments')}
             className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'appointments' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100 font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <Calendar className="h-5 w-5" /> Appointments
          </button>
          <button 
            onClick={() => setActiveTab('records')}
             className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'records' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100 font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <FileText className="h-5 w-5" /> Reports & History
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

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome back, {user.name || 'Patient'}
            </h1>
            <p className="text-slate-500 mt-1">Here is what's happening since your last visit.</p>
          </div>
          <Button onClick={() => router.push('/telemedicine')} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2 h-11 px-6">
            <Video className="w-4 h-4" />
            Join Video Call
          </Button>
        </header>

        {activeTab === 'overview' && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-slate-700">
                   <Calendar className="w-5 h-5 text-blue-600" /> Next Appointment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl bg-slate-50 p-5 border border-slate-100 mb-5 text-sm text-slate-600 shadow-sm flex flex-col items-center justify-center min-h-[100px]">
                  <p>No upcoming appointments found.</p>
                </div>
                <Button className="w-full h-11" variant="outline" onClick={() => setActiveTab('appointments')}>
                  Book Now
                </Button>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2 border-slate-200">
              <CardHeader className="pb-4">
                 <CardTitle className="text-lg flex items-center gap-2 text-slate-700">
                   <UserIcon className="w-5 h-5 text-blue-600" /> Patient Demographics
                 </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <tbody>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <td className="px-6 py-4 font-medium text-slate-500 w-1/3">Full Name</td>
                        <td className="px-6 py-4 font-semibold text-slate-900">{user.name || 'N/A'}</td>
                      </tr>
                      <tr className="border-b border-slate-100 bg-white">
                        <td className="px-6 py-4 font-medium text-slate-500 w-1/3">Email Address</td>
                        <td className="px-6 py-4 text-slate-900">{user.email}</td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="px-6 py-4 font-medium text-slate-500 w-1/3">Patient ID</td>
                        <td className="px-6 py-4 font-mono text-slate-900">PT-{1000 + user.id}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-5 flex justify-end">
                   <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">Edit Profile</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="space-y-6 fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">My Appointments</h2>
                <p className="text-sm text-slate-500 mt-1">Manage and track your schedule</p>
              </div>
              <Button className="h-10 px-6 shadow-sm">Find a Doctor</Button>
            </div>
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="p-16 text-center bg-white flex flex-col items-center">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-blue-50/50">
                    <Calendar className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-xl text-slate-900 mb-2">No appointments</h3>
                  <p className="text-slate-500 mb-8 max-w-sm">You don't have any appointments booked yet. Browse our directory of specialists to get started.</p>
                  <Button variant="outline" className="h-11 px-6">Browse Doctors Directory</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'records' && (
           <div className="space-y-6 fade-in">
             <div>
               <h2 className="text-xl font-bold text-slate-900">Medical Records & Reports</h2>
               <p className="text-sm text-slate-500 mt-1">Securely store and share your health documents</p>
             </div>
             <Card className="border-slate-200">
               <CardContent className="p-8">
                 <div className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:bg-slate-50 hover:border-blue-300 transition-all cursor-pointer group">
                   <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
                     <FileText className="h-8 w-8 text-slate-400 group-hover:text-blue-600 transition-colors" />
                   </div>
                   <h3 className="font-semibold text-lg text-slate-900 mb-2">Click to upload or drag and drop</h3>
                   <p className="text-sm text-slate-500 mb-6">Support for PDF, JPG, PNG or ZIP (max. 10MB)</p>
                   <Button variant="outline" className="h-10 px-6 group-hover:border-blue-600 group-hover:text-blue-600 transition-colors">Select Files</Button>
                 </div>
               </CardContent>
             </Card>
         </div>
        )}
      </main>
    </div>
  )
}
