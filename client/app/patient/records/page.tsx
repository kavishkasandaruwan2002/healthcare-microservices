"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sidebar } from '@/components/ui/Sidebar'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { 
  FileText, 
  Search, 
  Plus, 
  Download, 
  Eye, 
  Trash2, 
  Filter,
  Calendar,
  User,
  ShieldCheck,
  MoreVertical
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const mockRecords = [
  { id: '1', name: 'General Checkup Report', type: 'PDF', date: '2026-03-15', provider: 'Dr. Sarah Wilson', size: '2.4 MB' },
  { id: '2', name: 'Blood Test Results', type: 'PDF', date: '2026-02-10', provider: 'City Lab Services', size: '1.2 MB' },
  { id: '3', name: 'X-Ray - Chest', type: 'Image', date: '2026-01-20', provider: 'General Hospital', size: '15.8 MB' },
  { id: '4', name: 'Vaccination Certificate', type: 'PDF', date: '2025-12-05', provider: 'Health Center', size: '0.8 MB' },
]

export default function MedicalRecords() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="PATIENT" />

      <main className="flex-1 lg:ml-[80px] xl:ml-[280px] p-4 md:p-8 pt-20 lg:pt-8 transition-all duration-300">
        <header className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-2 mb-1 font-bold text-primary-600 text-sm uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4" /> Secure Vault
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Medical Records</h1>
            <p className="text-slate-500 font-medium italic">Manage and access your healthcare documents securely</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <AnimatedButton className="h-12 gap-2" onClick={() => router.push('/patient/records/upload')}>
              <Plus className="h-4 w-4" /> Upload New Record
            </AnimatedButton>
          </motion.div>
        </header>

        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search records by name or provider..."
              className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-bold shadow-sm outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <Filter className="h-5 w-5" /> Filter
          </button>
        </div>

        <div className="grid gap-4">
          {mockRecords.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.provider.toLowerCase().includes(searchQuery.toLowerCase())).map((record, i) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard className="p-4 md:p-6 border border-slate-100 hover:border-primary-200 hover:shadow-lg transition-all group">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                    <FileText className="h-7 w-7" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 group-hover:text-primary-900 transition-colors">{record.name}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-1">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <Calendar className="h-3.5 w-3.5" /> {record.date}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <User className="h-3.5 w-3.5" /> {record.provider}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-black uppercase">
                        {record.type} • {record.size}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="p-2.5 rounded-xl text-slate-400 hover:bg-primary-50 hover:text-primary-600 transition-all">
                      <Eye className="h-5 w-5" />
                    </button>
                    <button className="p-2.5 rounded-xl text-slate-400 hover:bg-primary-50 hover:text-primary-600 transition-all">
                      <Download className="h-5 w-5" />
                    </button>
                    <button className="p-2.5 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all">
                      <Trash2 className="h-5 w-5" />
                    </button>
                    <button className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  )
}
