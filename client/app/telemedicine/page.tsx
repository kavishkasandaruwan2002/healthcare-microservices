"use client"

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { IAgoraRTCClient, IMicrophoneAudioTrack, ICameraVideoTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng'
import { telemedicineApiService, type SessionResponse, type TokenResponse } from '@/services/telemedicineApi'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  PhoneOff, 
  Settings, 
  MessageSquare, 
  Users,
  Activity,
  Heart,
  ShieldCheck,
  Expand,
  MoreVertical,
  Send,
  X,
  Stethoscope
} from 'lucide-react'
import { cn } from '@/lib/utils'

function TelemedicinePageContent() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  const appointmentId = searchParams.get('appointmentId')
  
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [time, setTime] = useState(0)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [activeCall, setActiveCall] = useState(false)

  const [agoraClient, setAgoraClient] = useState<IAgoraRTCClient | null>(null)
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null)
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null)
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([])
  const [sessionData, setSessionData] = useState<SessionResponse | null>(null)
  const [tokenData, setTokenData] = useState<TokenResponse | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const localVideoRef = useRef<HTMLDivElement>(null)
  const remoteVideoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    const timer = setInterval(() => setTime(t => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !user) return
    if (!sessionId && !appointmentId) return

    const joinChannel = async () => {
      setIsJoining(true)
      setJoinError(null)
      try {
        let session: SessionResponse
        if (sessionId) {
          session = await telemedicineApiService.getSession(sessionId)
        } else {
          session = await telemedicineApiService.getSessionByAppointment(appointmentId!)
        }
        setSessionData(session)

        const tokenInfo = await telemedicineApiService.getToken(session.sessionId)
        setTokenData(tokenInfo)

        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
        setAgoraClient(client)

        client.on('user-published', async (remoteUser, mediaType) => {
          await client.subscribe(remoteUser, mediaType)
          if (mediaType === 'video') {
            setRemoteUsers(prev => [...prev.filter(u => u.uid !== remoteUser.uid), remoteUser])
            setTimeout(() => {
              if (remoteVideoRef.current) {
                remoteUser.videoTrack?.play(remoteVideoRef.current)
              }
            }, 100)
          }
          if (mediaType === 'audio') {
            remoteUser.audioTrack?.play()
          }
        })

        client.on('user-unpublished', (remoteUser) => {
          setRemoteUsers(prev => prev.filter(u => u.uid !== remoteUser.uid))
        })

        client.on('user-left', (remoteUser) => {
          setRemoteUsers(prev => prev.filter(u => u.uid !== remoteUser.uid))
        })

        await client.join(
          tokenInfo.agoraAppId,
          tokenInfo.channelName,
          tokenInfo.token,
          tokenInfo.uid
        )

        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
        setLocalAudioTrack(audioTrack)
        setLocalVideoTrack(videoTrack)

        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current)
        }

        await client.publish([audioTrack, videoTrack])
        setActiveCall(true)

        const refreshTimer = setTimeout(async () => {
          try {
            const newToken = await telemedicineApiService.refreshToken(session.sessionId)
            await client.renewToken(newToken.token)
          } catch (e) {
            console.error('Token refresh failed', e)
          }
        }, 50 * 60 * 1000)

        return () => clearTimeout(refreshTimer)

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to join session'
        setJoinError(message)
        console.error('Agora join error:', err)
      } finally {
        setIsJoining(false)
      }
    }

    joinChannel()
  }, [isAuthenticated, user, sessionId, appointmentId])

  useEffect(() => {
    return () => {
      localAudioTrack?.stop()
      localAudioTrack?.close()
      localVideoTrack?.stop()
      localVideoTrack?.close()
      agoraClient?.leave()
    }
  }, [agoraClient, localAudioTrack, localVideoTrack])

  if (!isAuthenticated) return null

  if (isJoining) return (
    <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
      <div className="text-center space-y-4">
        <div className="h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-300 font-medium">Joining secure session...</p>
      </div>
    </div>
  )

  if (joinError) return (
    <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
      <div className="text-center space-y-4 max-w-md p-8">
        <div className="h-16 w-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto">
          <PhoneOff className="h-8 w-8 text-rose-400" />
        </div>
        <h2 className="text-2xl font-bold">Failed to Join Session</h2>
        <p className="text-slate-400">{joinError}</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-primary-600 rounded-2xl font-semibold hover:bg-primary-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  )

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleMuteToggle = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(isMuted)
    }
    setIsMuted(!isMuted)
  }

  const handleVideoToggle = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(isVideoOff)
    }
    setIsVideoOff(!isVideoOff)
  }

  const handleEndCall = async () => {
    try {
      localAudioTrack?.stop()
      localAudioTrack?.close()
      localVideoTrack?.stop()
      localVideoTrack?.close()

      if (agoraClient) {
        await agoraClient.leave()
      }

      const isDoctor = user?.role === 'ROLE_DOCTOR' || user?.role === 'DOCTOR'
      if (isDoctor && sessionData) {
        await telemedicineApiService.endSession(sessionData.sessionId)
      }
    } catch (err) {
      console.error('End call error:', err)
    } finally {
      const isDoctor = user?.role === 'ROLE_DOCTOR' || user?.role === 'DOCTOR'
      if (isDoctor) router.push('/doctor/dashboard')
      else router.push('/patient/dashboard')
    }
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden selection:bg-primary-500/30">
      {/* Immersive Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-6 bg-linear-to-b from-slate-950/80 to-transparent backdrop-blur-xs"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
            <Video className="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">Active Consultation</h1>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/30">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Encrypted
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Session ID: <span className="text-slate-300 font-bold">{sessionData?.sessionId?.slice(0, 8).toUpperCase() || 'Connecting...'}</span></p>
          </div>
        </div>

        <GlassCard className="py-2 px-6 border-white/10 bg-white/5 rounded-full shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="text-sm font-black tabular-nums tracking-widest text-primary-400">
              {formatTime(time)}
            </div>
            <div className="h-4 w-[1px] bg-white/10" />
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Users className="h-3 w-3" /> {1 + remoteUsers.length} Participant{remoteUsers.length !== 1 ? 's' : ''}
            </div>
          </div>
        </GlassCard>

        <div className="flex items-center gap-3">
          <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-300 transition-all hover:bg-white/10">
            <Settings className="w-5 h-5" />
          </button>
          <AnimatedButton variant="glass" className="h-12 border-none bg-white/10 text-white" onClick={() => setIsChatOpen(!isChatOpen)}>
            <MessageSquare className="w-5 h-5 mr-2" /> Chat
          </AnimatedButton>
        </div>
      </motion.header>

      {/* Main Experience Area */}
      <main className="relative flex-1 flex">
        {/* Primary Video Container */}
        <div className="relative flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full h-full max-w-6xl rounded-[40px] bg-slate-900 overflow-hidden shadow-2xl border border-white/5 group"
          >
            {/* Remote Feed Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                {!activeCall ? (
                  <motion.div 
                    key="waiting"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="relative mb-10">
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="absolute inset-0 bg-primary-500/20 rounded-full blur-3xl"
                      />
                      <div className="relative h-32 w-32 bg-slate-800 rounded-full flex items-center justify-center border border-white/10 shadow-2xl ring-2 ring-primary-500/20">
                        {user?.role === 'DOCTOR' ? <Users className="w-12 h-12 text-primary-400" /> : <Stethoscope className="w-12 h-12 text-primary-400" />}
                      </div>
                    </div>
                    <h2 className="text-3xl font-black mb-3">Connecting to Secure Server...</h2>
                    <p className="text-slate-400 text-lg max-w-sm font-medium">Waiting for participant to establish a secure handshake.</p>
                    <button 
                      onClick={() => setActiveCall(true)}
                      className="mt-12 text-xs font-black uppercase tracking-[0.2em] text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      Simulation: Click to Connect
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="active"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center text-6xl font-black text-white/5 pointer-events-none select-none uppercase tracking-[1em]"
                  >
                    <div ref={remoteVideoRef} className="absolute inset-0" />
                    Live Feed
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Remote Label */}
            <div className="absolute bottom-10 left-10 z-10">
              <GlassCard className="py-3 px-6 border-white/10 bg-black/40 rounded-2xl flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400">Participant</div>
                  <div className="font-bold text-white">{user?.role === 'DOCTOR' ? 'Patient: Alex Johnson' : 'Dr. Sarah Wilson'}</div>
                </div>
              </GlassCard>
            </div>

            {/* Local PIP Window */}
            <motion.div 
              drag
              dragConstraints={{ left: -500, right: 500, top: -400, bottom: 400 }}
              initial={{ x: 200, y: -200 }}
              className="absolute top-10 right-10 w-64 aspect-video rounded-3xl bg-slate-800 border border-white/10 shadow-2xl overflow-hidden cursor-move group/pip"
            >
              <div className="absolute inset-0 bg-linear-to-br from-slate-700 to-slate-900 flex flex-col items-center justify-center">
                 <div ref={localVideoRef} className="absolute inset-0 w-full h-full" />
                 <AnimatePresence>
                   {isVideoOff ? (
                     <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="text-2xl font-black text-white/20 z-10"
                      >
                        {user?.name?.[0] || 'U'}
                      </motion.div>
                   ) : null}
                 </AnimatePresence>
              </div>
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-white/10">You</span>
                {isMuted && <MicOff className="h-3 w-3 text-rose-500" />}
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/pip:opacity-100 transition-opacity bg-black/40">
                <Expand className="h-6 w-6 text-white" />
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Diagnostic Sidebar (Conditional) */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.aside 
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="w-96 bg-slate-900 border-l border-white/5 flex flex-col z-20"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-bold">Secure Session</h3>
                <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {/* Simulated Stats for Doctor */}
                {user?.role === 'DOCTOR' && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Patient Vitals</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                        <Heart className="h-4 w-4 text-rose-500 mb-2" />
                        <div className="text-lg font-bold">72 BPM</div>
                      </div>
                      <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                        <Activity className="h-4 w-4 text-emerald-500 mb-2" />
                        <div className="text-lg font-bold">98% O2</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Meeting Chat</h4>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-xl bg-primary-600 flex items-center justify-center text-[10px] font-bold">SYS</div>
                      <div className="flex-1 p-3 rounded-2xl bg-white/5 text-xs text-slate-300">
                        Connection established. End-to-end encryption active.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/5">
                 <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Type a message..." 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-primary-500 transition-colors pr-14"
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center bg-primary-600 rounded-xl text-white shadow-lg shadow-primary-600/20">
                      <Send className="h-4 w-4" />
                    </button>
                 </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Controls Footer */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50">
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="flex items-center gap-6"
        >
          <GlassCard className="py-4 px-8 border-white/20 bg-slate-900/40 backdrop-blur-2xl rounded-[32px] flex items-center gap-6 shadow-2xl ring-1 ring-white/10">
            <button 
              onClick={handleMuteToggle}
              className={cn(
                "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-90",
                isMuted ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "bg-white/5 text-slate-300 hover:bg-white/10"
              )}
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>
            
            <button 
              onClick={handleVideoToggle}
              className={cn(
                "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-90",
                isVideoOff ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "bg-white/5 text-slate-300 hover:bg-white/10"
              )}
            >
              {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
            </button>

            <button 
              onClick={handleEndCall}
              className="h-16 px-10 rounded-3xl bg-rose-600 text-white font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-rose-600/30 hover:bg-rose-700 transition-all active:scale-95"
            >
              <PhoneOff className="h-6 w-6" /> End Call
            </button>

            <div className="h-10 w-[1px] bg-white/10 mx-2" />

            <button className="h-14 w-14 rounded-2xl bg-white/5 text-slate-300 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90">
              <MoreVertical className="h-6 w-6" />
            </button>
          </GlassCard>
        </motion.div>
      </div>

      {/* Dynamic Background Element */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full bg-[radial-gradient(circle_at_center,_transparent_0%,_#020617_100%)] opacity-50" />
      </div>
    </div>
  )
}

export default function TelemedicinePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <div className="h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TelemedicinePageContent />
    </Suspense>
  )
}
