"use client"

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { telemedicineApiService, type SessionResponse, type TokenResponse } from '@/services/telemedicineApi'
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Maximize2,
  Users,
  Shield,
  Clock,
  Settings,
  MoreVertical,
  Activity
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { IAgoraRTCClient, IMicrophoneAudioTrack, ICameraVideoTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng'

// ─── Telemedicine Content ───────────────────────────────────────────────────

function TelemedicineContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuthStore()

  const sessionId = searchParams.get('sessionId')
  const appointmentId = searchParams.get('appointmentId')

  // UI State
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [activeCall, setActiveCall] = useState(false)
  const [timer, setTimer] = useState(0)

  // Agora State
  const [agoraClient, setAgoraClient] = useState<IAgoraRTCClient | null>(null)
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null)
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null)
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([])
  const [sessionData, setSessionData] = useState<SessionResponse | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  const localVideoRef = useRef<HTMLDivElement>(null)
  const remoteVideoRef = useRef<HTMLDivElement>(null)

  // Join logic
  useEffect(() => {
    if (!isAuthenticated || !user) return
    if (!sessionId && !appointmentId) {
      setJoinError("No session or appointment ID provided.")
      return
    }

    const joinChannel = async () => {
      setIsJoining(true)
      setJoinError(null)
      try {
        // 1. Get session data
        let session: SessionResponse
        if (sessionId) {
          session = await telemedicineApiService.getSession(sessionId)
        } else {
          session = await telemedicineApiService.getSessionByAppointment(appointmentId!)
        }
        setSessionData(session)

        // 2. Get Agora token from backend
        const tokenInfo = await telemedicineApiService.getToken(session.sessionId)

        // 3. Create Agora client
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
        setAgoraClient(client)

        // 4. Handle remote user events
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

        // 5. Join channel
        await client.join(
          tokenInfo.agoraAppId,
          tokenInfo.channelName,
          tokenInfo.token,
          tokenInfo.uid
        )

        // 6. Create and publish local tracks
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
        setLocalAudioTrack(audioTrack)
        setLocalVideoTrack(videoTrack)

        // 7. Play local video in PIP
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current)
        }

        // 8. Publish to channel
        await client.publish([audioTrack, videoTrack])

        setActiveCall(true)

        // 9. Set up token refresh
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

  // Call timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (activeCall) {
      interval = setInterval(() => setTimer(t => t + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [activeCall])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      localAudioTrack?.stop()
      localAudioTrack?.close()
      localVideoTrack?.stop()
      localVideoTrack?.close()
      agoraClient?.leave()
    }
  }, [agoraClient, localAudioTrack, localVideoTrack])

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
      if (agoraClient) await agoraClient.leave()

      const isDoctor = user?.role?.includes('DOCTOR')
      if (isDoctor && sessionData) {
        await telemedicineApiService.endSession(sessionData.sessionId)
      }
      toast.success('Session ended successfully')
    } catch (err) {
      console.error('End call error:', err)
    } finally {
      const isDoctor = user?.role?.includes('DOCTOR')
      if (isDoctor) router.push('/doctor/dashboard')
      else router.push('/patient/dashboard')
    }
  }

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (isJoining) return (
    <div className="flex h-screen items-center justify-center bg-slate-950 text-white font-outfit">
      <div className="text-center space-y-4">
        <div className="h-16 w-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-300 font-medium text-lg">Initializing Secure Video Link...</p>
      </div>
    </div>
  )

  if (joinError) return (
    <div className="flex h-screen items-center justify-center bg-slate-950 text-white font-outfit">
      <div className="text-center space-y-6 max-w-md p-8 glass-dark rounded-3xl">
        <div className="h-20 w-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto">
          <PhoneOff className="h-10 w-10 text-rose-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Connection Failed</h2>
          <p className="text-slate-400">{joinError}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="w-full py-4 bg-primary-600 rounded-2xl font-bold hover:bg-primary-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Return to Hub
        </button>
      </div>
    </div>
  )

  return (
    <div className="relative h-screen w-full bg-slate-950 overflow-hidden font-outfit selection:bg-primary-500/30">
      
      {/* ─── Remote Video Layout ─── */}
      <div className="absolute inset-0 flex items-center justify-center">
        {remoteUsers.length > 0 ? (
          <div ref={remoteVideoRef} className="h-full w-full object-cover transition-all duration-700 animate-in fade-in" />
        ) : (
          <div className="text-center space-y-8 max-w-lg px-6">
            <div className="relative mx-auto w-32 h-32">
              <div className="absolute inset-0 bg-primary-500/20 rounded-full animate-ping" />
              <div className="relative flex items-center justify-center w-32 h-32 bg-slate-900 border-2 border-slate-700 rounded-full">
                <Users className="h-12 w-12 text-slate-400" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black text-white tracking-tight">Waiting for Provider</h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                Stay in this window. Your specialist will join the secure encrypted session momentarily.
              </p>
            </div>
            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-primary-400 font-bold bg-primary-500/10 px-4 py-2 rounded-full border border-primary-500/20">
                <Shield className="h-4 w-4" />
                <span className="text-xs uppercase tracking-widest">End-to-End Encrypted</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Header Info overlay ─── */}
      <div className="absolute top-0 left-0 right-0 p-8 flex items-start justify-between pointer-events-none z-20">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-2"
        >
          <div className="flex items-center gap-2 glass-dark px-4 py-2 rounded-2xl border border-white/5 shadow-2xl">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-black text-white uppercase tracking-tighter">
              Session ID: {sessionData?.sessionId?.slice(0, 8).toUpperCase() || 'connecting...'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm pl-2">
            <Users className="h-4 w-4" />
            <span>{1 + remoteUsers.length} Participant{remoteUsers.length !== 0 ? 's' : ''} Connected</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="flex flex-col items-end gap-2"
        >
          <div className="flex items-center gap-3 glass-dark px-6 py-3 rounded-2xl border border-white/5 shadow-2xl pointer-events-auto">
             <div className="flex items-center gap-2 text-primary-400">
               <Clock className="h-4 w-4" />
               <span className="text-xl font-mono font-bold tracking-widest leading-none">{formatTimer(timer)}</span>
             </div>
             <div className="h-4 w-px bg-slate-700" />
             <div className="flex items-center gap-1.5 text-slate-300">
               <Activity className="h-4 w-4 text-emerald-500" />
               <span className="text-xs font-bold uppercase tracking-widest">Live HD</span>
             </div>
          </div>
        </motion.div>
      </div>

      {/* ─── Local Video PIP ─── */}
      <motion.div 
        drag dragConstraints={{ left: 20, right: 20, top: 20, bottom: 20 }}
        dragElastic={0.1}
        className="absolute bottom-32 right-8 w-64 aspect-video rounded-3xl overflow-hidden glass-dark border border-white/10 shadow-2xl z-30 group cursor-move"
      >
        <div ref={localVideoRef} className="h-full w-full object-cover" />
        <AnimatePresence>
          {isVideoOff && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center gap-3 backdrop-blur-xl"
            >
              <div className="h-12 w-12 bg-rose-500/20 rounded-full flex items-center justify-center">
                <VideoOff className="h-6 w-6 text-rose-400" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Camera Disabled</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 glass-dark px-3 py-1.5 rounded-full border border-white/5">
          <div className="h-1.5 w-1.5 rounded-full bg-primary-500 shadow-[0_0_10px_#2563eb]" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">You (Local)</span>
        </div>
      </motion.div>

      {/* ─── Main Control Bar ─── */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 glass-dark p-4 rounded-[2.5rem] border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] backdrop-blur-3xl pointer-events-auto"
        >
          {/* Mute */}
          <button 
            onClick={handleMuteToggle}
            className={`flex items-center justify-center w-14 h-14 rounded-full transition-all active:scale-90 ${
              isMuted ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-white/5 text-white hover:bg-white/10'
            }`}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>

          {/* Video Toggle */}
          <button 
            onClick={handleVideoToggle}
            className={`flex items-center justify-center w-14 h-14 rounded-full transition-all active:scale-90 ${
              isVideoOff ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-white/5 text-white hover:bg-white/10'
            }`}
          >
            {isVideoOff ? <VideoOff className="h-6 w-6" /> : <VideoIcon className="h-6 w-6" />}
          </button>

          <div className="w-px h-8 bg-white/10 mx-2" />

          {/* End Call */}
          <button 
            onClick={handleEndCall}
            className="flex items-center justify-center px-8 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-tighter transition-all active:scale-95 shadow-xl shadow-rose-600/20 gap-3"
          >
            <PhoneOff className="h-5 w-5" />
            <span>End Session</span>
          </button>

          <div className="w-px h-8 bg-white/10 mx-2" />

          {/* Extra Buttons */}
          <button className="flex items-center justify-center w-14 h-14 rounded-full bg-white/5 text-white hover:bg-white/10 transition-all active:scale-90">
            <Maximize2 className="h-6 w-6" />
          </button>
          <button className="flex items-center justify-center w-14 h-14 rounded-full bg-white/5 text-white hover:bg-white/10 transition-all active:scale-90">
            <Settings className="h-6 w-6" />
          </button>
        </motion.div>
      </div>

      {/* Decorative gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-600/10 rounded-full blur-[120px] pointer-events-none" />
    </div>
  )
}

// ─── Wrapper Page ───────────────────────────────────────────────────────────

export default function TelemedicinePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-950 font-outfit">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-300 font-medium">Preparing Call Environment...</p>
        </div>
      </div>
    }>
      <TelemedicineContent />
    </Suspense>
  )
}
