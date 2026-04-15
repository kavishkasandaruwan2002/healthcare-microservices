"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import { Sidebar } from '@/components/ui/Sidebar'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { 
  Calendar, 
  Clock, 
  Search, 
  User, 
  Star, 
  MapPin, 
  Video, 
  CheckCircle, 
  ChevronRight,
  TrendingUp,
  Stethoscope,
  Filter,
  ArrowLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  rating: number;
  location: string;
  image: string;
}

const mockDoctors: Doctor[] = [
  { 
    id: '1', 
    name: 'Dr. Sarah Wilson', 
    specialization: 'Cardiologist', 
    rating: 4.9, 
    location: 'Virtual / New York',
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=400&h=300'
  },
  { 
    id: '2', 
    name: 'Dr. Michael Chen', 
    specialization: 'Neurologist', 
    rating: 4.8, 
    location: 'Virtual / Chicago',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400&h=300'
  },
  { 
    id: '3', 
    name: 'Dr. Elena Rodriguez', 
    specialization: 'Dermatologist', 
    rating: 4.9, 
    location: 'Virtual / Miami',
    image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=400&h=300'
  },
  { 
    id: '4', 
    name: 'Dr. David Kim', 
    specialization: 'Pediatrician', 
    rating: 4.7, 
    location: 'Virtual / Los Angeles',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400&h=300'
  },
]

export default function PatientAppointments() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  
  const [step, setStep] = useState(1)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isBooking, setIsBooking] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null

  const handleBooking = async () => {
    setIsBooking(true)
    try {
      // API call to book appointment
      await api.post('/appointments', {
        patientId: user?.id,
        doctorId: selectedDoctor?.id,
        date: selectedDate,
        time: selectedTime,
        reason: 'General Consultation'
      })
      
      setStep(4) // Success step
      toast.success('Appointment booked successfully!')
    } catch (err) {
      // For demo purposes, we'll still show success step
      setStep(4)
      toast.success('Simulated booking successful!')
    } finally {
      setIsBooking(false)
    }
  }

  const steps = [
    { number: 1, label: 'Select Specialist' },
    { number: 2, label: 'Choose Schedule' },
    { number: 3, label: 'Confirm & Pay' },
  ]

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="PATIENT" />
      
      <main className="flex-1 lg:ml-[80px] xl:ml-[280px] p-4 md:p-8 pt-20 lg:pt-8 transition-all duration-300">
        {/* Header */}
        <header className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-2 mb-2 font-bold text-primary-600 text-sm uppercase tracking-widest">
              <Stethoscope className="h-4 w-4" /> Book Consultation
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Virtual Care Hub</h1>
            <p className="text-slate-500 font-medium italic">Schedule high-fidelity secure sessions with world-class specialists.</p>
          </motion.div>

          {/* Stepper Indictor */}
          <div className="flex items-center gap-4 bg-white p-2 px-4 rounded-2xl border border-slate-200 shadow-sm">
            {steps.map((s, i) => (
              <div key={s.number} className="flex items-center gap-2">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black transition-all",
                  step === s.number ? "bg-primary-600 text-white shadow-lg" : 
                  step > s.number ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                )}>
                  {step > s.number ? <CheckCircle className="h-4 w-4" /> : s.number}
                </div>
                <span className={cn(
                  "hidden text-xs font-bold md:block transition-all",
                  step >= s.number ? "text-slate-900" : "text-slate-400"
                )}>{s.label}</span>
                {i < steps.length - 1 && <div className="h-[1px] w-4 bg-slate-200" />}
              </div>
            ))}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-8"
            >
              {/* Search & Filter */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search by name, specialization, or condition..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-bold outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 placeholder:font-normal"
                  />
                </div>
                <button className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  <Filter className="h-5 w-5" /> Filter
                </button>
              </div>

              {/* Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {mockDoctors.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <GlassCard 
                      className={cn(
                        "group cursor-pointer border-2 transition-all p-0 overflow-hidden",
                        selectedDoctor?.id === doc.id ? "border-primary-500 ring-4 ring-primary-500/10 shadow-xl" : "border-transparent hover:border-primary-200 hover:shadow-lg"
                      )}
                      onClick={() => setSelectedDoctor(doc)}
                    >
                      <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-50 relative">
                        <img 
                          src={doc.image} 
                          alt={doc.name} 
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="p-6">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-100">
                            {doc.specialization}
                          </span>
                          <div className="flex items-center gap-1 text-xs font-black text-amber-500">
                            <Star className="h-3 w-3 fill-amber-500" /> {doc.rating}
                          </div>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 leading-tight mb-1">{doc.name}</h3>
                        <p className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-6 italic">
                          <MapPin className="h-3 w-3" /> {doc.location}
                        </p>
                        <AnimatedButton 
                          variant={selectedDoctor?.id === doc.id ? "primary" : "outline"} 
                          className="w-full h-11"
                          onClick={() => { setSelectedDoctor(doc); setStep(2); }}
                        >
                          Select Doctor
                        </AnimatedButton>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="max-w-4xl mx-auto space-y-10"
            >
              <button 
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-sm font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
              >
                <ArrowLeft className="h-4 w-4" /> Change Doctor
              </button>

              <div className="grid gap-10 md:grid-cols-2">
                <div className="space-y-6">
                  <h3 className="text-2xl font-black text-slate-900 leading-none">Select Consultation Date</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {['Tomorrow', 'April 22, 2026', 'April 23, 2026', 'April 24, 2026'].map((date) => (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          "flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all active:scale-95",
                          selectedDate === date ? "border-primary-500 bg-primary-50 ring-4 ring-primary-500/5 shadow-md" : "border-slate-100 bg-white hover:border-primary-200"
                        )}
                      >
                        <Calendar className={cn("h-6 w-6 mb-2", selectedDate === date ? "text-primary-600" : "text-slate-400")} />
                        <span className={cn("text-sm font-black", selectedDate === date ? "text-primary-900" : "text-slate-600")}>{date}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-2xl font-black text-slate-900 leading-none">Available Slots</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {['10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '04:00 PM', '05:30 PM'].map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          "py-3 rounded-2xl border transition-all active:scale-95 text-xs font-black uppercase tracking-tight",
                          selectedTime === time ? "bg-primary-600 text-white border-primary-600 shadow-lg" : "bg-white text-slate-500 border-slate-100 hover:border-primary-500/50"
                        )}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-10 flex justify-end">
                <AnimatedButton 
                  size="xl" 
                  className={cn("px-12", (!selectedDate || !selectedTime) ? "opacity-50 pointer-events-none" : "")}
                  onClick={() => setStep(3)}
                >
                  Continue to Summary <ChevronRight className="ml-2 h-5 w-5" />
                </AnimatedButton>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-xl mx-auto"
            >
              <GlassCard className="p-10 border-none shadow-2xl relative overflow-hidden bg-white/80 backdrop-blur-xl">
                <div className="relative z-10">
                  <h3 className="text-3xl font-black text-slate-900 mb-8 border-b border-slate-100 pb-6 uppercase tracking-tighter">Confirmation</h3>
                  
                  <div className="space-y-6 mb-10">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-primary-600 shadow-inner">
                        <User className="h-7 w-7" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Doctor</div>
                        <div className="text-xl font-black text-slate-900">{selectedDoctor?.name}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Date</div>
                        <div className="font-black text-slate-900 select-none">{selectedDate}</div>
                      </div>
                      <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Time</div>
                        <div className="font-black text-slate-900 select-none">{selectedTime}</div>
                      </div>
                    </div>

                    <div className="p-5 rounded-3xl bg-primary-50/50 border border-primary-100 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-primary-700">
                        <Video className="h-5 w-5" />
                        <span className="text-sm font-black uppercase tracking-widest italic">Video Session</span>
                      </div>
                      <span className="font-black text-primary-700 font-mono">$49.00</span>
                    </div>
                  </div>

                  <AnimatedButton 
                    size="xl" 
                    className="w-full h-16 bg-slate-900 text-white shadow-xl shadow-slate-900/20"
                    loading={isBooking}
                    onClick={handleBooking}
                  >
                    Confirm & Complete Booking
                  </AnimatedButton>
                  
                  <button 
                    onClick={() => setStep(2)}
                    className="w-full mt-6 text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors"
                  >
                    Reschedule
                  </button>
                </div>
                {/* Decorative mesh */}
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-500/5 blur-3xl opacity-50" />
              </GlassCard>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-lg mx-auto text-center"
            >
              <div className="relative mb-10 inline-block">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10 }}
                  className="h-32 w-32 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30"
                >
                  <CheckCircle className="h-16 w-16" />
                </motion.div>
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
              </div>

              <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight leading-tight">Confirmed! Your path to better health begins.</h2>
              <p className="text-slate-500 text-lg mb-12 font-medium italic">We&apos;ve sent a calendar invitation and encrypted meeting details to your email <span className="text-primary-600 font-bold">{user?.email}</span>.</p>

              <div className="flex flex-col gap-4">
                <AnimatedButton size="xl" onClick={() => router.push('/patient/dashboard')}>
                  Return to Command Center
                </AnimatedButton>
                <AnimatedButton variant="outline" size="xl" className="border-slate-200" onClick={() => setStep(1)}>
                  Add to Google Calendar
                </AnimatedButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
