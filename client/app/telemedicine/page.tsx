"use client"

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import api from '@/services/api'
import { telemedicineApiService, type SessionResponse } from '@/services/telemedicineApi'
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
  Activity,
  ArrowRight
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
  
  const [availableAppointments, setAvailableAppointments] = useState<any[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)

  const localVideoRef = useRef<HTMLDivElement>(null)
  const remoteVideoRef = useRef<HTMLDivElement>(null)


  useEffect(() => {
    // ── Cancellation flag + closure-scoped resource refs ──────────────────
    // All three live at the useEffect scope so the cleanup return can
    // reach them even if the component unmounts mid-async-call.
    let cancelled = false
    let localClient: IAgoraRTCClient | null = null
    let localAudio: IMicrophoneAudioTrack | null = null
    let localVideo: ICameraVideoTrack | null = null

    if (!isAuthenticated || !user) return

    // ── Branch A: no IDs → show appointment picker ────────────────────────
    if (!sessionId && !appointmentId) {
      const fetchTeleAppointments = async () => {
        setLoadingAppointments(true)
        try {
          const res = await api.get(`/appointments/patient/${user.id}`)
          if (cancelled) return
          const tele = res.data.filter((a: any) =>
            a.appointmentType === 'TELEMEDICINE' &&
            (a.status === 'CONFIRMED' || a.status === 'PENDING')
          )
          setAvailableAppointments(tele)
        } catch (e) {
          if (cancelled) return
          console.error('Failed to fetch tele-appointments', e)
          setJoinError("Could not find any active telemedicine sessions.")
        } finally {
          if (!cancelled) setLoadingAppointments(false)
        }
      }
      fetchTeleAppointments()
      return () => { cancelled = true }
    }

    // ── Branch B: join channel ────────────────────────────────────────────
    const joinChannel = async () => {
      setIsJoining(true)
      setJoinError(null)
      try {
        let currentSessionId = sessionId

        // 1. Resolve Session ID if only appointmentId is provided
        if (!currentSessionId && appointmentId) {
          try {
            const session = await telemedicineApiService.getSessionByAppointment(appointmentId)
            if (cancelled) return
            currentSessionId = session.sessionId
            setSessionData(session)
          } catch (e: any) {
            if (e.response?.status === 404) {
              console.log('Session not found, attempting to auto-create...')
              try {
                const aptRes = await api.get(`/appointments/${appointmentId}`)
                if (cancelled) return
                const apt = aptRes.data

                const newSession = await telemedicineApiService.createSession({
                  appointmentId: apt.id,
                  patientId: apt.patientId,
                  doctorId: apt.doctorId,
                  scheduledAt: apt.appointmentTime || new Date().toISOString().split('.')[0]
                })
                if (cancelled) return

                currentSessionId = newSession.sessionId
                setSessionData(newSession)
              } catch (createErr) {
                if (cancelled) return
                console.error('Failed to auto-create session', createErr)
                throw new Error("Could not auto-create the video session. Please try again.")
              }
            } else {
              if (cancelled) return
              console.error('Failed to resolve session from appointment', e)
              throw new Error("Could not find a video session for this appointment. Please ensure it's confirmed.")
            }
          }
        }

        if (!currentSessionId) {
          throw new Error("No session ID provided.")
        }

        // 2. Fetch Agora Token
        console.log('Fetching token for session:', currentSessionId)
        const tokenData = await telemedicineApiService.getToken(currentSessionId)
        if (cancelled) return
        console.log('Token received successfully')

        // 3. Create Agora client INSIDE the effect so each mount gets its own instance
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
        if (cancelled) return

        localClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
        setAgoraClient(localClient)

        // Remote user handlers
        localClient.on('user-published', async (remoteUser, mediaType) => {
          await localClient?.subscribe(remoteUser, mediaType)
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

        localClient.on('user-unpublished', (remoteUser) => {
          setRemoteUsers(prev => prev.filter(u => u.uid !== remoteUser.uid))
        })

        // 4. Join channel
        await localClient.join(
          tokenData.agoraAppId,
          tokenData.channelName,
          tokenData.token,
          tokenData.uid
        )
        if (cancelled) {
          localClient.leave().catch(() => {})
          return
        }

        // 5. Create local tracks
        const tracks = await AgoraRTC.createMicrophoneAndCameraTracks()
        localAudio = tracks[0]
        localVideo = tracks[1]

        if (cancelled) {
          localAudio.stop(); localAudio.close()
          localVideo.stop(); localVideo.close()
          localClient.leave().catch(() => {})
          return
        }

        setLocalAudioTrack(localAudio)
        setLocalVideoTrack(localVideo)

        if (localVideoRef.current) {
          localVideo.play(localVideoRef.current)
        }

        // 6. Publish — only if not cancelled
        if (!cancelled) {
          await localClient.publish([localAudio, localVideo])
        }

        if (cancelled) {
          localAudio.stop(); localAudio.close()
          localVideo.stop(); localVideo.close()
          localClient.leave().catch(() => {})
          return
        }

        setActiveCall(true)

      } catch (err: unknown) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Failed to join session'
        setJoinError(message)
        console.error('Telemedicine join error:', err)
        toast.error(message)
      } finally {
        if (!cancelled) {
          setIsJoining(false)
        }
      }
    }

    joinChannel()

    // ── Cleanup: runs on unmount OR when deps change ───────────────────────
    // Setting cancelled=true is the FIRST action so every pending await
    // that checks `cancelled` will bail out before touching state or client.
    return () => {
      cancelled = true
      if (localAudio) { localAudio.stop(); localAudio.close() }
      if (localVideo) { localVideo.stop(); localVideo.close() }
      if (localClient) { localClient.leave().catch(() => {}) }
    }
  }, [isAuthenticated, user, sessionId, appointmentId])

  // Call timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (activeCall) {
      interval = setInterval(() => setTimer(t => t + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [activeCall])

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
      toast.success('Session ended')
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
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '00')}`
  }

  if (isJoining) return (
    <div className="flex h-screen items-center justify-center bg-slate-950 text-white font-outfit">
      <div className="text-center space-y-4">
        <div className="h-16 w-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-300 font-medium text-lg">Initializing Secure Video Link...</p>
      </div>
    </div>
  )

  if (joinError || (!sessionId && !appointmentId && !loadingAppointments && availableAppointments.length === 0)) return (
    <div className="flex h-screen items-center justify-center bg-slate-950 text-white font-outfit">
      <div className="text-center space-y-6 max-w-md p-8 glass-dark rounded-3xl">
        <div className="h-20 w-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto">
          <PhoneOff className="h-10 w-10 text-rose-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{joinError ? "Connection Failed" : "No Sessions Found"}</h2>
          <p className="text-slate-400">{joinError || "You don't have any confirmed telemedicine appointments."}</p>
        </div>
        <button onClick={() => router.push('/patient/dashboard')} className="w-full py-4 bg-primary-600 rounded-2xl font-bold hover:bg-primary-700 transition-all">
          Return to Dashboard
        </button>
      </div>
    </div>
  )

  // Selection list if no ID is passed
  if (!sessionId && !appointmentId && availableAppointments.length > 0) return (
    <div className="flex h-screen items-center justify-center bg-slate-950 text-white font-outfit p-6">
      <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-5">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black">Select Session</h1>
          <p className="text-slate-400">Choose an appointment to start the video room.</p>
        </div>
        <div className="grid gap-4">
          {availableAppointments.map((apt) => (
            <motion.div
              key={apt.id}
              whileHover={{ scale: 1.02, x: 10 }}
              className="group cursor-pointer p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-primary-500/50 flex items-center justify-between"
              onClick={() => router.push(`/telemedicine?appointmentId=${apt.id}`)}
            >
              <div className="flex items-center gap-5">
                <div className="h-14 w-14 rounded-2xl bg-primary-500/20 flex items-center justify-center text-primary-400">
                   <VideoIcon className="h-7 w-7" />
                </div>
                <div>
                   <h3 className="text-xl font-bold">Dr. {apt.doctorName || 'Specialist'}</h3>
                   <p className="text-sm text-slate-400">{apt.time || 'Scheduled Session'}</p>
                </div>
              </div>
              <ArrowRight className="h-6 w-6 text-primary-500" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="relative h-screen w-full bg-slate-950 overflow-hidden font-outfit">
      
      {/* ─── Main Video Stream (Remote) ─── */}
      <div className="absolute inset-0 flex items-center justify-center">
        {remoteUsers.length > 0 ? (
          <div ref={remoteVideoRef} className="h-full w-full object-cover" />
        ) : (
          <div className="text-center space-y-8">
            <div className="relative mx-auto w-32 h-32">
              <div className="absolute inset-0 bg-primary-500/20 rounded-full animate-ping" />
              <div className="relative flex items-center justify-center w-32 h-32 bg-slate-900 border-2 border-slate-700 rounded-full">
                <Users className="h-12 w-12 text-slate-400" />
              </div>
            </div>
            <h2 className="text-3xl font-black text-white">Waiting for Provider</h2>
            <p className="text-slate-400">Specialist will join the session momentarily.</p>
          </div>
        )}
      </div>

      {/* ─── Header Overlay ─── */}
      <div className="absolute top-0 left-0 right-0 p-8 flex items-start justify-between pointer-events-none z-20">
        <div className="glass-dark px-4 py-2 rounded-2xl border border-white/5 text-sm font-black text-white">
          CHANNEL: {sessionData?.channelName?.toUpperCase() || (sessionId || appointmentId || 'SESSION').toUpperCase()}
        </div>
        <div className="glass-dark px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-3 text-primary-400 font-bold">
           <Clock className="h-4 w-4" /> {formatTimer(timer)}
        </div>
      </div>

      {/* ─── Local Video PIP ─── */}
      <motion.div 
        drag dragConstraints={{ left: 20, right: 20, top: 20, bottom: 20 }}
        className="absolute bottom-32 right-8 w-64 aspect-video rounded-3xl overflow-hidden glass-dark border border-white/10 shadow-2xl z-30 cursor-move"
      >
        <div ref={localVideoRef} className="h-full w-full object-cover" />
        {isVideoOff && (
          <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center">
            <VideoOff className="h-6 w-6 text-rose-400" />
          </div>
        )}
      </motion.div>

      {/* ─── Control Bar ─── */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center z-50">
        <div className="flex items-center gap-4 glass-dark p-4 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl">
          <button onClick={handleMuteToggle} className={`w-14 h-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-rose-500' : 'bg-white/5'}`}>
            {isMuted ? <MicOff /> : <Mic />}
          </button>

          <button onClick={handleVideoToggle} className={`w-14 h-14 rounded-full flex items-center justify-center ${isVideoOff ? 'bg-rose-500' : 'bg-white/5'}`}>
            {isVideoOff ? <VideoOff /> : <VideoIcon />}
          </button>

          <div className="w-px h-8 bg-white/10 mx-2" />

          <button onClick={handleEndCall} className="px-8 h-14 rounded-full bg-rose-600 text-white font-black uppercase flex items-center gap-3">
            <PhoneOff className="h-5 w-5" /> End Session
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Wrapper Page ───────────────────────────────────────────────────────────

export default function TelemedicinePage() {
  return (
    <Suspense fallback={<div className="h-screen bg-slate-950" />}>
      <TelemedicineContent />
    </Suspense>
  )
}