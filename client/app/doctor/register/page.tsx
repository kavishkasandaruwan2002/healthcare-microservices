"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import api from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Stethoscope, ArrowLeft } from 'lucide-react'

export default function DoctorRegisterPage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: '',
    licenseNumber: '',
    bio: '',
    consultationFee: '',
    yearsOfExperience: '',
    qualification: '',
    hospitalAffiliation: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      
      // Validate required fields
      if (!formData.name || !formData.email || !formData.password || !formData.specialization) {
        toast.error('Please fill all required fields')
        return
      }

      const res = await api.post('/doctors/register', {
        ...formData,
        consultationFee: parseFloat(formData.consultationFee) || 0
      })
      
      toast.success('Registration successful! Please login.')
      router.push('/doctor/login')
    } catch (err: any) {
      console.error('Registration error:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Registration failed'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen py-12 px-4 bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="mx-auto w-full max-w-2xl">
        <button
          onClick={() => router.push('/')}
          className="mb-8 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>

        <div className="rounded-xl bg-white p-8 shadow-xl border border-slate-200">
          <div className="mb-8 flex flex-col items-center justify-center space-y-3">
            <div className="rounded-full bg-blue-100 p-3">
              <Stethoscope className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Doctor Registration</h2>
            <p className="text-sm text-slate-500">Create your medical professional account</p>
          </div>
          
          <form onSubmit={handleRegister} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Full Name *</label>
                  <Input 
                    name="name"
                    type="text" 
                    placeholder="Dr. John Smith" 
                    value={formData.name}
                    onChange={handleChange}
                    required 
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email *</label>
                  <Input 
                    name="email"
                    type="email" 
                    placeholder="doctor@healthcare.com" 
                    value={formData.email}
                    onChange={handleChange}
                    required 
                    className="h-10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Password *</label>
                  <Input 
                    name="password"
                    type="password" 
                    placeholder="Enter secure password"
                    value={formData.password}
                    onChange={handleChange}
                    required 
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Phone</label>
                  <Input 
                    name="phone"
                    type="tel" 
                    placeholder="+94701234567"
                    value={formData.phone}
                    onChange={handleChange}
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="font-semibold text-slate-900">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Specialization *</label>
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    className="h-10 flex w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  >
                    <option value="">Select specialization</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="ENT">ENT</option>
                    <option value="General Practice">General Practice</option>
                    <option value="Psychiatry">Psychiatry</option>
                    <option value="Oncology">Oncology</option>
                    <option value="Urology">Urology</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">License Number</label>
                  <Input 
                    name="licenseNumber"
                    type="text" 
                    placeholder="LIC001234"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    className="h-10"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Years of Experience</label>
                  <Input 
                    name="yearsOfExperience"
                    type="text" 
                    placeholder="10"
                    value={formData.yearsOfExperience}
                    onChange={handleChange}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Qualification</label>
                  <Input 
                    name="qualification"
                    type="text" 
                    placeholder="MBBS, MD (Cardiology)"
                    value={formData.qualification}
                    onChange={handleChange}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Consultation Fee (Rs.)</label>
                  <Input 
                    name="consultationFee"
                    type="number" 
                    placeholder="2500"
                    value={formData.consultationFee}
                    onChange={handleChange}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Hospital Affiliation</label>
                  <Input 
                    name="hospitalAffiliation"
                    type="text" 
                    placeholder="National Hospital, Colombo"
                    value={formData.hospitalAffiliation}
                    onChange={handleChange}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Bio/Description</label>
                <textarea
                  name="bio"
                  placeholder="Brief description about yourself and your practice..."
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 font-semibold"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Create Doctor Account'}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/doctor/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Login here
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}