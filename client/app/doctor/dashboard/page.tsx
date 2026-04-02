"use client"

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Activity, Calendar, Users, Stethoscope, LogOut, CheckCircle, Edit2, Save, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface DoctorProfile {
  id: string
  name: string
  email: string
  specialization: string
  consultationFee: number
  bio: string
  phone: string
  yearsOfExperience: string
  qualification: string
  hospitalAffiliation: string
  status: string
  isVerified: boolean
}

export default function DoctorDashboard() {
  const { user, logout, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<DoctorProfile>>({})
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/doctor/login')
    } else if (user?.role !== 'ROLE_DOCTOR') {
      router.push('/')
    }
  }, [isAuthenticated, user, router])

  const fetchDoctorProfile = useCallback(async () => {
    try {
      setProfileLoading(true)
      if (user?.id) {
        const res = await api.get(`/doctors/${user.id}`)
        setDoctorProfile(res.data)
        setEditData(res.data)
      }
    } catch (err: any) {
      console.error('Failed to fetch profile:', err)
      toast.error('Failed to load profile')
    } finally {
      setProfileLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchDoctorProfile()
    }
  }, [isAuthenticated, user?.id, fetchDoctorProfile])

  const handleUpdateProfile = async () => {
    try {
      setLoading(true)
      if (!doctorProfile?.id) return
      
      await api.put(`/doctors/${doctorProfile.id}`, editData)
      toast.success('Profile updated successfully!')
      setIsEditing(false)
      fetchDoctorProfile()
    } catch (err: any) {
      console.error('Failed to update profile:', err)
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value
    })
  }

  if (!isAuthenticated || !user || user.role !== 'ROLE_DOCTOR') return null

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white p-6 hidden md:flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="rounded-lg bg-blue-100 p-2">
            <Stethoscope className="h-6 w-6 text-blue-600" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">HealthCare Pro</span>
        </div>

        <nav className="space-y-2 flex-1">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'overview' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200 font-medium' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Activity className="h-5 w-5" />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'profile' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200 font-medium' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Stethoscope className="h-5 w-5" />
            My Profile
          </button>
          <button 
            onClick={() => setActiveTab('appointments')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'appointments' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200 font-medium' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="h-5 w-5" />
            Appointments
          </button>
          <button 
            onClick={() => setActiveTab('patients')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'patients' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200 font-medium' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="h-5 w-5" />
            My Patients
          </button>
        </nav>

        <div className="pt-4 border-t border-slate-200 mt-auto">
          <button 
            onClick={() => { logout(); router.push('/doctor/login'); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors font-medium border border-transparent hover:border-red-200"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-auto">
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Welcome, Dr. {user.name || 'Doctor'}
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Manage your medical practice efficiently</p>
          </div>
          {doctorProfile?.status === 'PENDING' && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="h-2 w-2 rounded-full bg-yellow-600"></div>
              <span className="text-sm font-medium text-yellow-800">Verification Pending</span>
            </div>
          )}
          {doctorProfile?.isVerified && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Verified Doctor</span>
            </div>
          )}
        </header>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold text-slate-900">0</p>
                    <p className="text-xs text-slate-500 mt-1">Today's Appointments</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Patient Base</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold text-slate-900">0</p>
                    <p className="text-xs text-slate-500 mt-1">Total Patients</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Consultation Fee</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold text-slate-900">Rs. {doctorProfile?.consultationFee || 0}</p>
                    <p className="text-xs text-slate-500 mt-1">Per session</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-center">
                    <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-medium text-slate-900">Manage Schedule</p>
                  </button>
                  <button className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-center">
                    <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-medium text-slate-900">View Patients</p>
                  </button>
                  <button className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-center">
                    <Activity className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-medium text-slate-900">Reports</p>
                  </button>
                  <button className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-center">
                    <CheckCircle className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-medium text-slate-900">Consultations</p>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 pb-6">
                <CardTitle className="text-lg text-slate-900">Professional Profile</CardTitle>
                {!isEditing && (
                  <button
                    onClick={() => {
                      setIsEditing(true)
                      setEditData(doctorProfile || {})
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Profile
                  </button>
                )}
              </CardHeader>
              
              <CardContent className="p-6">
                {profileLoading ? (
                  <div className="text-center py-8">
                    <p className="text-slate-500">Loading profile...</p>
                  </div>
                ) : isEditing ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Name</label>
                        <input
                          type="text"
                          name="name"
                          value={editData.name || ''}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={editData.email || ''}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Phone</label>
                        <input
                          type="tel"
                          name="phone"
                          value={editData.phone || ''}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Consultation Fee (Rs.)</label>
                        <input
                          type="number"
                          name="consultationFee"
                          value={editData.consultationFee || 0}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Bio</label>
                      <textarea
                        name="bio"
                        value={editData.bio || ''}
                        onChange={handleEditChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-200">
                      <button
                        onClick={handleUpdateProfile}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false)
                          setEditData(doctorProfile || {})
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Name</p>
                        <p className="text-lg font-semibold text-slate-900">{doctorProfile?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Email</p>
                        <p className="text-lg font-semibold text-slate-900">{doctorProfile?.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Specialization</p>
                        <p className="text-lg font-semibold text-slate-900">{doctorProfile?.specialization}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Phone</p>
                        <p className="text-lg font-semibold text-slate-900">{doctorProfile?.phone || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Years of Experience</p>
                        <p className="text-lg font-semibold text-slate-900">{doctorProfile?.yearsOfExperience} years</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Consultation Fee</p>
                        <p className="text-lg font-semibold text-slate-900">Rs. {doctorProfile?.consultationFee}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500 mb-1">Bio</p>
                      <p className="text-slate-900 leading-relaxed">{doctorProfile?.bio || 'No bio provided'}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Qualification</p>
                        <p className="text-slate-900">{doctorProfile?.qualification || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Hospital Affiliation</p>
                        <p className="text-slate-900">{doctorProfile?.hospitalAffiliation || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-sm text-slate-500 mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${doctorProfile?.status === 'APPROVED' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        <p className="text-sm font-medium text-slate-900 capitalize">{doctorProfile?.status}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-slate-200 shadow-sm text-center py-16">
              <p className="text-slate-500 font-medium">No appointments scheduled yet</p>
              <p className="text-sm text-slate-400 mt-1">Appointments will appear here when patients book</p>
            </Card>
          </div>
        )}

        {/* Patients Tab */}
        {activeTab === 'patients' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-slate-200 shadow-sm text-center py-16">
              <p className="text-slate-500 font-medium">No patients yet</p>
              <p className="text-sm text-slate-400 mt-1">Your patient list will appear here</p>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
