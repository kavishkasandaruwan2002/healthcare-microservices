"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sidebar } from '@/components/ui/Sidebar'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { 
  Upload, 
  File, 
  X, 
  CheckCircle2, 
  CloudIcon, 
  ShieldCheck,
  ArrowLeft,
  FileText,
  Clock
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function UploadRecordPage() {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<{ name: string; size: string; status: string }[]>([
    { name: 'Blood_Test_Report_Jan.pdf', size: '2.4 MB', status: 'Completed' },
    { name: 'X-Ray_Chest_Main.jpg', size: '5.8 MB', status: 'In Review' },
  ])

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="PATIENT" />

      <main className="flex-1 lg:ml-[80px] xl:ml-[280px] p-4 md:p-8 pt-20 lg:pt-8">
        <header className="mb-10">
          <button 
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Upload Health Records</h1>
          <p className="text-slate-500 mt-1">Securely upload and manage your medical documents.</p>
        </header>

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* Upload Zone */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              className={cn(
                "group relative flex flex-col items-center justify-center rounded-[2.5rem] border-4 border-dashed p-12 text-center transition-all duration-300",
                isDragging 
                  ? "border-primary-500 bg-primary-50/50 scale-[1.02]" 
                  : "border-slate-200 bg-white hover:border-primary-300 hover:bg-slate-50/30"
              )}
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-50 text-primary-600 shadow-inner group-hover:scale-110 transition-transform">
                <Upload className="h-10 w-10" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-slate-900">Drop your files here</h2>
              <p className="mb-8 max-w-xs text-slate-500 font-medium leading-relaxed">
                Support for PDF, JPG, PNG and DOCX. Max file size <span className="text-primary-600 font-bold">20MB</span>.
              </p>
              
              <div className="flex items-center gap-4">
                <AnimatedButton variant="primary" className="h-12 px-8 shadow-xl shadow-primary-500/20 font-bold">
                  Select Files
                </AnimatedButton>
              </div>

              {/* Security Badge */}
              <div className="mt-10 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> End-to-end encrypted & HIPAA compliant
              </div>
            </motion.div>

            {/* Recently Uploaded */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900 px-2">Recently Uploaded</h3>
              <div className="grid gap-4">
                {files.map((file, i) => (
                  <motion.div
                    key={file.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 leading-none mb-1">{file.name}</h4>
                        <p className="text-xs font-bold text-slate-400">{file.size}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className={cn(
                        "flex items-center gap-1.5 text-xs font-bold",
                        file.status === 'Completed' ? "text-emerald-600" : "text-amber-600"
                      )}>
                        {file.status === 'Completed' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        {file.status}
                      </span>
                      <button className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-rose-50 hover:text-rose-500 text-slate-300 transition-colors">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <GlassCard className="bg-linear-to-br from-primary-600 to-accent-600 text-white border-none shadow-2xl overflow-hidden relative">
              <div className="relative z-10">
                <CloudIcon className="h-12 w-12 text-white/40 mb-4" />
                <h3 className="text-2xl font-bold mb-4">Cloud Storage</h3>
                <p className="text-primary-50 text-sm font-medium leading-relaxed opacity-90 mb-6">
                  Upgrade to Pulse Pro for unlimited health record storage and AI-powered report analysis.
                </p>
                <div className="mb-6 h-2 w-full rounded-full bg-white/20">
                    <div className="h-full w-2/3 rounded-full bg-white" />
                </div>
                <p className="text-xs font-bold mb-6 italic opacity-80">14.2 GB of 20 GB used</p>
                <AnimatedButton variant="glass" className="w-full bg-white text-primary-900 border-none">
                  Get More Space
                </AnimatedButton>
              </div>
              <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            </GlassCard>

            <GlassCard className="border-dashed border-slate-200 shadow-none">
                <h4 className="text-sm font-bold text-slate-900 mb-2">Tips for clearer scans</h4>
                <ul className="text-xs space-y-2 text-slate-500 font-medium italic">
                    <li className="flex items-start gap-2">• Use bright, even lighting</li>
                    <li className="flex items-start gap-2">• Place document on a dark surface</li>
                    <li className="flex items-start gap-2">• Ensure all 4 corners are visible</li>
                </ul>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  )
}
