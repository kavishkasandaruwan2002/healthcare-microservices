"use client"

import { motion } from 'framer-motion'
import { Sidebar } from '@/components/ui/Sidebar'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { 
  Phone, 
  MessageSquare, 
  Video, 
  ShieldAlert, 
  ArrowLeft,
  Clock,
  MapPin,
  HeartPulse,
  Signal
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function EmergencySupportPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen bg-rose-50/30">
      <Sidebar role="PATIENT" />

      <main className="flex-1 lg:ml-[80px] xl:ml-[280px] p-4 md:p-8 pt-20 lg:pt-8">
        <header className="mb-10">
          <button 
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-sm font-bold text-rose-500 hover:text-rose-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-600 text-white shadow-xl shadow-rose-500/30 animate-pulse">
                <ShieldAlert className="h-10 w-10" />
            </div>
            <div>
                <h1 className="text-4xl font-black tracking-tight text-slate-900">Emergency Support</h1>
                <p className="text-rose-600 font-bold italic">Available 24/7 • Response time &lt; 2 mins</p>
            </div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Main Emergency Call */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <GlassCard className="h-full border-none bg-white p-8 shadow-2xl shadow-rose-500/10 flex flex-col items-center text-center justify-center py-16">
              <div className="relative mb-10">
                <div className="absolute inset-0 animate-ping rounded-full bg-rose-500/20" />
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-rose-600 text-white shadow-2xl">
                    <Phone className="h-16 w-16" />
                </div>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Immediate Voice Assistance</h2>
              <p className="text-slate-500 mb-10 max-w-sm font-medium">Click the button below to connect with our emergency dispatch team immediately.</p>
              
              <AnimatedButton className="w-full max-w-sm h-20 rounded-[2.5rem] bg-rose-600 text-white text-2xl font-black shadow-2xl shadow-rose-600/40 hover:bg-rose-700">
                Call 1911 Now
              </AnimatedButton>
              
              <div className="mt-8 flex items-center gap-4 text-sm font-bold text-rose-500">
                <span className="flex items-center gap-1.5"><Signal className="h-4 w-4" /> Secure Line</span>
                <span className="h-1 w-1 rounded-full bg-rose-200" />
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Priority Response</span>
              </div>
            </GlassCard>
          </motion.div>

          <div className="space-y-8">
            {/* Quick Chat/Video */}
            <div className="grid gap-6 sm:grid-cols-2">
                <GlassCard className="hover:border-rose-200 transition-all cursor-pointer group">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors">
                        <MessageSquare className="h-7 w-7" />
                    </div>
                    <h3 className="font-bold text-slate-900">Live SMS Chat</h3>
                    <p className="text-xs text-slate-500 mt-1">Chat silently with our support agents.</p>
                </GlassCard>
                <GlassCard className="hover:border-rose-200 transition-all cursor-pointer group">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors">
                        <Video className="h-7 w-7" />
                    </div>
                    <h3 className="font-bold text-slate-900">Video Triage</h3>
                    <p className="text-xs text-slate-500 mt-1">Connect with a nurse over video.</p>
                </GlassCard>
            </div>

            {/* Emergency Info Card */}
            <GlassCard className="bg-slate-900 text-white border-none shadow-xl">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <HeartPulse className="h-6 w-6 text-rose-500" /> Your Registry Info
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between border-b border-white/10 pb-4">
                        <span className="text-white/50 text-sm font-medium">Blood Type</span>
                        <span className="font-bold text-rose-400 text-lg">O Positive (O+)</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-4">
                        <span className="text-white/50 text-sm font-medium">Allergies</span>
                        <span className="font-bold text-white uppercase text-sm tracking-widest text-right">Penicillin, <br/>Peanuts</span>
                    </div>
                    <div className="flex justify-between pt-2">
                        <span className="text-white/50 text-sm font-medium">Emergency Contact</span>
                        <span className="font-bold text-white text-right">Jane Doe <br/> <span className="text-xs font-medium text-white/40">+123 456 7890</span></span>
                    </div>
                </div>
            </GlassCard>

            {/* Nearby Hospitals Quick View */}
            <div className="p-2">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Nearby Critical Care</h4>
                <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-2xl bg-white/50 p-4 border border-rose-100">
                        <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-rose-500" />
                            <div>
                                <p className="text-sm font-bold text-slate-900">City General Hospital</p>
                                <p className="text-xs text-slate-500">1.2 km • ER Wait: 15 mins</p>
                            </div>
                        </div>
                        <AnimatedButton variant="glass" size="sm" className="bg-rose-50 text-rose-600 border-none">Navigate</AnimatedButton>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
