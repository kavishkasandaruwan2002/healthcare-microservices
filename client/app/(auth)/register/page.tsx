"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import api from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Activity } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'PATIENT'
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await api.post('/auth/register', formData)
      toast.success('Registration successful! Please login.')
      router.push('/login')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="flex flex-col items-center justify-center space-y-2">
          <Activity className="h-10 w-10 text-blue-600" />
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Create an account</h2>
          <p className="text-sm text-slate-500">Join our Smart Healthcare platform</p>
        </div>
        
        <form onSubmit={handleRegister} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium leading-none" htmlFor="name">Full Name</label>
              <Input 
                id="name" 
                name="name"
                type="text" 
                placeholder="John Doe" 
                value={formData.name}
                onChange={handleChange}
                required 
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium leading-none" htmlFor="email">Email</label>
              <Input 
                id="email" 
                name="email"
                type="email" 
                placeholder="name@example.com" 
                value={formData.email}
                onChange={handleChange}
                required 
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium leading-none" htmlFor="password">Password</label>
              <Input 
                id="password" 
                name="password"
                type="password" 
                value={formData.password}
                onChange={handleChange}
                required 
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium leading-none" htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1 flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="PATIENT">Patient</option>
                <option value="DOCTOR">Doctor</option>
              </select>
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </Button>
        </form>
        
        <div className="text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
