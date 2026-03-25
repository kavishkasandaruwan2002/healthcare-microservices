"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Video, Mic, MicOff, VideoOff, PhoneOff, Settings, MessageSquare, Users } from 'lucide-react'

export default function TelemedicinePage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [time, setTime] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    const timer = setInterval(() => setTime(t => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!user) return null

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleEndCall = () => {
    if (user.role === 'DOCTOR') router.push('/doctor/dashboard')
    else if (user.role === 'PATIENT') router.push('/patient/dashboard')
    else router.push('/')
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white font-sans">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Consultation Room</h1>
            <p className="text-xs text-green-400 flex items-center gap-1.5 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              End-to-End Encrypted Secure Call
            </p>
          </div>
        </div>
        <div className="bg-slate-800 px-4 py-1.5 rounded-full font-mono text-sm tracking-wider tabular-nums font-semibold shadow-inner border border-slate-700">
          {formatTime(time)}
        </div>
      </header>

      {/* Main Video Area */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 flex gap-6 overflow-hidden">
        {/* Remote Video (Large) */}
        <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden flex items-center justify-center shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800/80 to-slate-900 flex flex-col items-center justify-center text-slate-400">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-slate-800/50">
              <Users className="w-10 h-10 text-slate-500" />
            </div>
            <p className="text-lg font-medium text-slate-300">Waiting for {user.role === 'DOCTOR' ? 'Patient' : 'Doctor'} to join...</p>
            <p className="text-sm mt-3 px-6 py-2 bg-slate-800/50 rounded-full border border-slate-700/50 text-slate-500">
              Future Integration Placeholder (Agora / Twilio WebRTC)
            </p>
          </div>
          <div className="absolute bottom-6 left-6 bg-black/50 px-4 py-2 rounded-lg text-sm backdrop-blur-md border border-white/10 font-medium">
            {user.role === 'DOCTOR' ? 'Patient: Pending' : 'Dr. Sarah Jenkins (Cardiologist)'}
          </div>
        </div>

        {/* Sidebar / Chat / Local Video */}
        <div className="w-80 flex flex-col gap-6 hidden lg:flex">
          {/* Local Video (Small) */}
          <div className="h-56 bg-slate-900 rounded-2xl relative overflow-hidden border border-slate-700 shadow-xl">
             {isVideoOff ? (
               <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                 <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center text-3xl font-bold shadow-inner">
                   {user.name?.charAt(0) || 'U'}
                 </div>
               </div>
             ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-slate-400">
                 <Video className="w-8 h-8 mb-3 opacity-60" />
                 <span className="text-xs font-medium uppercase tracking-wider">Your Camera Feed</span>
               </div>
             )}
             <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
               <span className="bg-black/50 px-3 py-1 rounded bg-black/60 backdrop-blur-sm text-xs border border-white/10 font-medium">
                 You
               </span>
               <div className="flex gap-1.5">
                 {isMuted && <MicOff className="w-4 h-4 text-red-400 drop-shadow-md" />}
                 {isVideoOff && <VideoOff className="w-4 h-4 text-red-400 drop-shadow-md" />}
               </div>
             </div>
          </div>
          
          {/* Chat / Notes Placeholder */}
          <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col shadow-xl overflow-hidden">
            <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                Session Chat
              </h3>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm text-center p-6 bg-gradient-to-b from-transparent to-slate-900/50">
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3">
                <MessageSquare className="w-5 h-5 opacity-50" />
              </div>
              <p>Chat history is empty.</p>
              <p className="text-xs mt-1 opacity-60">Messages are end-to-end encrypted.</p>
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-900/80">
               <input type="text" placeholder="Type a secure message..." className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 placeholder:text-slate-500 shadow-inner" disabled />
            </div>
          </div>
        </div>
      </main>

      {/* Controls Footer */}
      <footer className="h-24 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-6 px-6 z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
        <Button 
          variant={isMuted ? 'default' : 'outline'} 
          className={`h-14 w-14 rounded-full p-0 flex items-center justify-center transition-all duration-300 ${isMuted ? 'bg-red-500 hover:bg-red-600 text-white border-transparent shadow-lg shadow-red-500/20 scale-105' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
          onClick={() => setIsMuted(!isMuted)}
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </Button>
        <Button 
          variant={isVideoOff ? 'default' : 'outline'} 
          className={`h-14 w-14 rounded-full p-0 flex items-center justify-center transition-all duration-300 ${isVideoOff ? 'bg-red-500 hover:bg-red-600 text-white border-transparent shadow-lg shadow-red-500/20 scale-105' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
          onClick={() => setIsVideoOff(!isVideoOff)}
          title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </Button>
        <Button 
          className="h-14 px-10 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center gap-2.5 font-semibold text-base mx-4 shadow-xl shadow-red-600/20 hover:shadow-red-600/40 transition-shadow"
          onClick={handleEndCall}
        >
          <PhoneOff className="w-5 h-5" /> End Call
        </Button>
        <Button 
          variant="outline" 
          className="h-14 w-14 rounded-full p-0 flex items-center justify-center bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
        >
          <Settings className="w-6 h-6" />
        </Button>
      </footer>
    </div>
  )
}
