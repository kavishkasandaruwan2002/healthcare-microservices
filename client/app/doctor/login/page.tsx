"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import api from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Stethoscope, ArrowLeft } from 'lucide-react'

export default function DoctorLoginPage() {
  const router = useRouter()
  const setLogin = useAuthStore(state => state.login)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      console.log('Attempting login with:', { email, password })
      
      const res = await api.post('/doctors/login', { 
        email, 
        password 
      })
      
      console.log('Login response:', res.data)
      
      const { token, doctor } = res.data
      
      if (!doctor || !doctor.id) {
        toast.error('Invalid server response - missing doctor ID')
        console.error('Server response missing doctor ID:', res.data)
        return
      }

      // Ensure id is stored as string
      const userData = {
        id: String(doctor.id), // Convert to string
        email: doctor.email,
        name: doctor.name,
        role: 'ROLE_DOCTOR' as const
      }
      
      console.log('Setting user data:', userData)
      setLogin(userData, token)
      
      toast.success('Login successful!')
      router.push('/doctor/dashboard')
        
    } catch (err: any) {
      console.error('Login error:', err)
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.push('/')}
          className="mb-8 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>

        <div className="rounded-xl bg-white p-8 shadow-xl border border-slate-200">
          <div className="mb-8 flex flex-col items-center justify-center space-y-3">
            <div className="rounded-full bg-blue-100 p-3">
              <Stethoscope className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Doctor Login</h1>
            <p className="text-sm text-slate-500">Access your medical dashboard</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">Email Address</label>
              <Input 
                id="email" 
                type="email" 
                placeholder="doctor@healthcare.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="password">Password</label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="h-10"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 font-semibold" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in to Dashboard'}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-slate-600">
            Don't have an account?{' '}
            <Link href="/doctor/register" className="font-semibold text-blue-600 hover:text-blue-700">
              Register here
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              Demo Account: dr.saman@healthcare.com / doctor123456
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}