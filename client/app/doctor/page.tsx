"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Stethoscope, Search, MapPin, Award, DollarSign, Calendar } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface Doctor {
  id: string
  name: string
  email: string
  specialization: string
  bio: string
  consultationFee: number
  yearsOfExperience: string
  qualification: string
  hospitalAffiliation: string
  isVerified: boolean
  phone?: string
}

export default function DoctorsPage() {
  const router = useRouter()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialization, setSelectedSpecialization] = useState('')
  
  const specializations = [
    'Cardiology',
    'Neurology',
    'Pediatrics',
    'Orthopedics',
    'Dermatology',
    'ENT',
    'General Practice',
    'Psychiatry',
    'Oncology',
    'Urology'
  ]

  useEffect(() => {
    fetchDoctors()
  }, [selectedSpecialization])

  const fetchDoctors = async () => {
    try {
      setLoading(true)
      let res
      if (selectedSpecialization) {
        res = await api.get(`/doctors/specialization/${selectedSpecialization}`)
      } else {
        res = await api.get('/doctors')
      }
      setDoctors(res.data)
    } catch (err: any) {
      console.error('Failed to fetch doctors:', err)
      toast.error('Failed to load doctors')
    } finally {
      setLoading(false)
    }
  }

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Stethoscope className="h-8 w-8" />
            <h1 className="text-4xl font-bold">Find a Doctor</h1>
          </div>
          <p className="text-blue-100 text-lg">Browse our network of verified medical professionals</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Filters */}
        <div className="mb-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              />
            </div>

            {/* Specialization Filter */}
            <select
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
            >
              <option value="">All Specializations</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          {/* Results Count */}
          <p className="text-sm text-slate-600">
            Found <span className="font-semibold">{filteredDoctors.length}</span> doctor(s)
          </p>
        </div>

        {/* Doctors Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <p className="text-slate-500">Loading doctors...</p>
          </div>
        ) : filteredDoctors.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDoctors.map(doctor => (
              <Card key={doctor.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Stethoscope className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{doctor.name}</h3>
                          <p className="text-sm text-slate-500">{doctor.specialization}</p>
                        </div>
                      </div>
                      {doctor.isVerified && (
                        <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
                          Verified
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {doctor.bio && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{doctor.bio}</p>
                  )}

                  {/* Details */}
                  <div className="space-y-2 py-4 border-t border-b border-slate-200">
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600">
                        {doctor.yearsOfExperience} years experience
                      </span>
                    </div>
                    {doctor.hospitalAffiliation && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-600">{doctor.hospitalAffiliation}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-slate-400" />
                      <span className="font-semibold text-slate-900">Rs. {doctor.consultationFee}</span>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="mt-4 space-y-2">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 font-semibold h-10">
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Appointment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-slate-200 shadow-sm text-center py-16">
            <p className="text-slate-500 font-medium">No doctors found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your search criteria</p>
          </Card>
        )}
      </div>
    </div>
  )
}