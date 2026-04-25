import axios from 'axios'

const telemedicineApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_TELE_API_URL || 'http://localhost:8085/api/telemedicine',
  headers: { 'Content-Type': 'application/json' },
})

telemedicineApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Auto-handle expired / missing token → redirect to login
telemedicineApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      console.warn('[telemedicineApi] 401 received – clearing stale token and redirecting to login')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/patient/login?reason=session_expired'
    }
    return Promise.reject(error)
  }
)

export interface SessionResponse {
  sessionId: string
  channelName: string
  status: 'WAITING' | 'ACTIVE' | 'ENDED' | 'CANCELLED'
  scheduledAt: string
  startedAt?: string
  endedAt?: string
  durationMinutes?: number
  patientJoined: boolean
  doctorJoined: boolean
}

export interface TokenResponse {
  token: string
  channelName: string
  agoraAppId: string
  uid: number
  expiresInSeconds: number
  sessionId: string
  sessionStatus: string
}

export const telemedicineApiService = {
  // Create a session
  createSession: async (data: { appointmentId: string; patientId: string; doctorId: string; scheduledAt: string }): Promise<SessionResponse> => {
    const res = await telemedicineApi.post('/sessions/create', data)
    return res.data
  },

  // Get session by appointment ID
  getSessionByAppointment: async (appointmentId: string): Promise<SessionResponse> => {
    const res = await telemedicineApi.get(`/sessions/appointment/${appointmentId}`)
    return res.data
  },

  // Get session by session ID
  getSession: async (sessionId: string): Promise<SessionResponse> => {
    const res = await telemedicineApi.get(`/sessions/${sessionId}`)
    return res.data
  },

  // Get Agora token (joins the session)
  getToken: async (sessionId: string): Promise<TokenResponse> => {
    const res = await telemedicineApi.get(`/sessions/${sessionId}/token`)
    return res.data
  },

  // Refresh Agora token
  refreshToken: async (sessionId: string): Promise<TokenResponse> => {
    const res = await telemedicineApi.get(`/sessions/${sessionId}/token/refresh`)
    return res.data
  },

  // End session (doctor only)
  endSession: async (sessionId: string): Promise<SessionResponse> => {
    const res = await telemedicineApi.put(`/sessions/${sessionId}/end`)
    return res.data
  },
}

export default telemedicineApi
