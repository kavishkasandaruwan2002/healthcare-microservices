"use client"

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import { Sidebar } from '@/components/ui/Sidebar'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import {
  Edit2,
  Save,
  X,
  Bell,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Stethoscope,
  Phone,
  Mail,
  Briefcase,
  Award,
  Building2,
  DollarSign,
  FileText,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'

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
  licenseNumber?: string
}

export default function DoctorProfilePage() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()

  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<DoctorProfile>>({})
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

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
      setLoading(true)
      if (user?.id) {
        const res = await api.get(`/doctors/${user.id}`)
        setDoctorProfile(res.data)
        setEditData(res.data)
      }
    } catch (err: any) {
      console.error('Failed to fetch doctor profile:', err)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isAuthenticated && user?.id && hasMounted) {
      fetchDoctorProfile()
    }
  }, [isAuthenticated, user?.id, hasMounted, fetchDoctorProfile])

  const handleUpdateProfile = async () => {
    try {
      setIsSaving(true)
      if (!doctorProfile?.id) {
        toast.error('Doctor profile not found')
        return
      }

      // Validate required fields
      if (!editData.name || !editData.email || !editData.specialization) {
        toast.error('Please fill all required fields')
        return
      }

      await api.put(`/doctors/${doctorProfile.id}`, editData)
      toast.success('Profile updated successfully!')
      setIsEditing(false)
      await fetchDoctorProfile()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
      console.error('Update error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!hasMounted || !isAuthenticated) return null

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
              <h1 className="text-3xl font-black tracking-tight text-slate-900">
                Professional Profile
              </h1>
            </div>
            <p className="text-slate-500 font-medium">
              Manage your professional information and credentials
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
            <p className="text-slate-500">Loading profile...</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Verification Status Card */}
            {doctorProfile && (
              <GlassCard className={cn(
                "p-6 border-l-4",
                doctorProfile.isVerified 
                  ? "border-l-emerald-500 bg-emerald-50/30" 
                  : doctorProfile.status === 'PENDING'
                  ? "border-l-amber-500 bg-amber-50/30"
                  : "border-l-red-500 bg-red-50/30"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {doctorProfile.isVerified ? (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                          <CheckCircle className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">✓ Verified Professional</h3>
                          <p className="text-sm text-slate-600">Your credentials have been verified by admin</p>
                        </div>
                      </>
                    ) : doctorProfile.status === 'PENDING' ? (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                          <AlertCircle className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">⏳ Verification Pending</h3>
                          <p className="text-sm text-slate-600">Admin is reviewing your credentials. You can still login and set up your profile.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                          <AlertCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">✕ Profile Rejected</h3>
                          <p className="text-sm text-slate-600">Your profile was not approved. Please contact support for details.</p>
                        </div>
                      </>
                    )}
                  </div>
                  {doctorProfile.isVerified && (
                    <ShieldCheck className="h-8 w-8 text-emerald-600" />
                  )}
                </div>

                {/* Additional Info */}
                <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-600">
                  <p><strong>Status:</strong> {doctorProfile.status}</p>
                </div>
              </GlassCard>
            )}

            {/* Profile Edit Card */}
            <GlassCard className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Professional Information</h2>
                <AnimatedButton 
                  onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                  className="h-12"
                >
                  {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit2 className="h-4 w-4 mr-2" />}
                  {isEditing ? "Cancel" : "Edit Profile"}
                </AnimatedButton>
              </div>

              <div className="space-y-8">
                {/* Basic Information Section */}
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Basic Information</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input 
                        disabled={!isEditing} 
                        value={editData.name || ''} 
                        onChange={e => setEditData({...editData, name: e.target.value})}
                        type="text"
                        placeholder="Dr. John Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input 
                        disabled={!isEditing} 
                        value={editData.email || ''} 
                        onChange={e => setEditData({...editData, email: e.target.value})}
                        type="email"
                        placeholder="doctor@healthcare.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input 
                        disabled={!isEditing} 
                        value={editData.phone || ''} 
                        onChange={e => setEditData({...editData, phone: e.target.value})}
                        type="tel"
                        placeholder="+94701234567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>License Number</Label>
                      <Input 
                        disabled={!isEditing} 
                        value={editData.licenseNumber || ''} 
                        onChange={e => setEditData({...editData, licenseNumber: e.target.value})}
                        type="text"
                        placeholder="LIC-12345-67890"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-[1px] bg-slate-100" />

                {/* Professional Information Section */}
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Professional Details</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Specialization *</Label>
                      <Input 
                        disabled={!isEditing} 
                        value={editData.specialization || ''} 
                        onChange={e => setEditData({...editData, specialization: e.target.value})}
                        type="text"
                        placeholder="Cardiology"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Qualification</Label>
                      <Input 
                        disabled={!isEditing} 
                        value={editData.qualification || ''} 
                        onChange={e => setEditData({...editData, qualification: e.target.value})}
                        type="text"
                        placeholder="MBBS, MD"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Years of Experience</Label>
                      <Input 
                        disabled={!isEditing} 
                        value={editData.yearsOfExperience || ''} 
                        onChange={e => setEditData({...editData, yearsOfExperience: e.target.value})}
                        type="text"
                        placeholder="10+ years"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-[1px] bg-slate-100" />

                {/* Practice Information Section */}
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Practice Information</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Hospital / Clinic Affiliation</Label>
                      <Input 
                        disabled={!isEditing} 
                        value={editData.hospitalAffiliation || ''} 
                        onChange={e => setEditData({...editData, hospitalAffiliation: e.target.value})}
                        type="text"
                        placeholder="Medical Center Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Consultation Fee (Rs)</Label>
                      <Input 
                        type="number"
                        disabled={!isEditing} 
                        value={editData.consultationFee || 0} 
                        onChange={e => setEditData({...editData, consultationFee: Number(e.target.value)})}
                        placeholder="1500"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-[1px] bg-slate-100" />

                {/* Bio Section */}
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Professional Bio</h3>
                  <div className="space-y-2">
                    <Label>About You</Label>
                    <textarea 
                      disabled={!isEditing}
                      rows={5}
                      className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 disabled:opacity-75 transition-all font-sans resize-none"
                      value={editData.bio || ''}
                      onChange={e => setEditData({...editData, bio: e.target.value})}
                      placeholder="Write a brief professional biography..."
                    />
                  </div>
                </div>

                {isEditing && (
                  <>
                    <div className="h-[1px] bg-slate-100" />
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => {
                          setIsEditing(false)
                          setEditData(doctorProfile || {})
                        }}
                        className="px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors font-bold text-slate-900"
                      >
                        Cancel
                      </button>
                      <AnimatedButton 
                        onClick={handleUpdateProfile} 
                        disabled={isSaving}
                        className="h-12"
                      >
                        <Save className="h-4 w-4 mr-2" /> 
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </AnimatedButton>
                    </div>
                  </>
                )}
              </div>
            </GlassCard>

            {/* Info Cards */}
            {doctorProfile && (
              <div className="grid md:grid-cols-3 gap-6">
                <GlassCard className="p-6 border-none shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Specialization</p>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{doctorProfile.specialization}</p>
                </GlassCard>

                <GlassCard className="p-6 border-none shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Award className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Experience</p>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{doctorProfile.yearsOfExperience || 'N/A'}</p>
                </GlassCard>

                <GlassCard className="p-6 border-none shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Consultation Fee</p>
                  </div>
                  <p className="text-xl font-bold text-slate-900">Rs. {doctorProfile.consultationFee}/session</p>
                </GlassCard>
              </div>
            )}
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