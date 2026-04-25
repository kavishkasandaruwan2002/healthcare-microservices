"use client"

import { motion } from 'framer-motion'
import { Sidebar } from '@/components/ui/Sidebar'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Calendar, 
  User, 
  Search,
  ArrowLeft,
  Filter,
  MoreVertical,
  CheckCircle2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const prescriptions = [
  {
    id: 'PR-2024-001',
    doctor: 'Dr. Sarah Johnson',
    date: 'April 10, 2024',
    diagnosis: 'Seasonal Allergies',
    medications: ['Cetirizine 10mg', 'Fluticasone Nasal Spray'],
    status: 'Active',
  },
  {
    id: 'PR-2024-002',
    doctor: 'Dr. Michael Chen',
    date: 'March 25, 2024',
    diagnosis: 'Hypertension',
    medications: ['Lisinopril 5mg'],
    status: 'Active',
  },
  {
    id: 'PR-2023-089',
    doctor: 'Dr. Emily White',
    date: 'December 12, 2023',
    diagnosis: 'Acute Bronchitis',
    medications: ['Amoxicillin 500mg', 'Cough Syrup'],
    status: 'Completed',
  },
]

export default function PrescriptionsPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="PATIENT" />

      <main className="flex-1 lg:ml-[80px] xl:ml-[280px] p-4 md:p-8 pt-20 lg:pt-8">
        <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <button 
              onClick={() => router.back()}
              className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </button>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Your Prescriptions</h1>
            <p className="text-slate-500 mt-1">Manage and download your digital prescriptions.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search prescriptions..." 
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
              />
            </div>
            <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-primary-600 transition-all">
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="grid gap-6">
          {prescriptions.map((px, i) => (
            <motion.div
              key={px.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard className="group p-0 overflow-hidden border-none shadow-sm hover:shadow-xl transition-all">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{px.id}</p>
                          <h3 className="text-xl font-bold text-slate-900">{px.diagnosis}</h3>
                        </div>
                      </div>
                      <span className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold",
                        px.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                      )}>
                        {px.status}
                      </span>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                          <User className="h-4 w-4 text-primary-500" /> Prescribed by <span className="font-bold text-slate-900">{px.doctor}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                          <Calendar className="h-4 w-4 text-primary-500" /> Date: <span className="font-bold text-slate-900">{px.date}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Medications</p>
                        <div className="flex flex-wrap gap-2">
                          {px.medications.map(med => (
                            <span key={med} className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {med}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center justify-center gap-3 border-t border-slate-100 bg-slate-50/50 p-6 md:w-48 md:border-l md:border-t-0">
                    <AnimatedButton variant="primary" size="sm" className="w-full h-11 flex-1 gap-2 bg-primary-600 font-bold">
                      <Download className="h-4 w-4" /> Download
                    </AnimatedButton>
                    <AnimatedButton variant="glass" size="sm" className="w-full h-11 flex-1 gap-2 bg-white font-bold">
                      <ExternalLink className="h-4 w-4" /> View Details
                    </AnimatedButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Empty State Mockup */}
        <div className="mt-12 text-center">
            <p className="text-sm text-slate-400 italic">Showing 3 of 3 prescriptions</p>
        </div>
      </main>
    </div>
  )
}
