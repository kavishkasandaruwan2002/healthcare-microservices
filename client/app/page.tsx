"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Activity, Stethoscope, Users, Zap, ArrowRight, LogOut } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'ROLE_ADMIN' || user.role === 'ADMIN') {
        router.push('/admin/dashboard')
      } else if (user.role === 'ROLE_DOCTOR' || user.role === 'DOCTOR') {
        router.push('/doctor/dashboard')
      } else if (user.role === 'ROLE_PATIENT' || user.role === 'PATIENT') {
        router.push('/patient/dashboard')
      }
    }
  }, [isAuthenticated, user, router])

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-600 p-2">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">HealthHub</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/doctors" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                Find Doctors
              </Link>
              <Link href="/login" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                Patient Login
              </Link>
              <Link href="/doctor/login" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                Doctor Login
              </Link>
              <Button className="bg-blue-600 hover:bg-blue-700 h-10">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
              Your Health, Our Priority
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              Connect with verified doctors, book appointments, attend video consultations, and receive AI-powered health suggestions - all in one platform.
            </p>
            <div className="flex gap-4 pt-4">
              <Link href="/register">
                <Button className="bg-blue-600 hover:bg-blue-700 h-12 px-8 text-base font-semibold">
                  Register as Patient
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/doctor/register">
                <Button className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 h-12 px-8 text-base font-semibold">
                  Join as Doctor
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 rounded-3xl opacity-10 blur-3xl"></div>
            <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 text-white">
              <Activity className="h-24 w-24 opacity-20 mb-4" />
              <h3 className="text-3xl font-bold mb-4">Smart Healthcare</h3>
              <p className="text-blue-100 leading-relaxed">
                Experience next-generation healthcare with AI-powered diagnostics and expert medical professionals available 24/7.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-center text-slate-900 mb-16">Why Choose HealthHub?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: Stethoscope,
              title: 'Verified Doctors',
              description: 'Connect with licensed medical professionals'
            },
            {
              icon: Zap,
              title: 'Quick Appointments',
              description: 'Book consultations in minutes'
            },
            {
              icon: Users,
              title: 'Patient Care',
              description: 'Comprehensive health management tools'
            },
            {
              icon: Activity,
              title: 'AI Health Tips',
              description: 'Get personalized health suggestions'
            }
          ].map((feature, idx) => (
            <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Healthcare?</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of patients and doctors who trust HealthHub for their medical needs.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button className="bg-white text-blue-600 hover:bg-blue-50 h-12 px-8 font-semibold">
                Get Started Now
              </Button>
            </Link>
            <Link href="/doctors">
              <Button className="border-2 border-white text-white hover:bg-white/10 h-12 px-8 font-semibold">
                Browse Doctors
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-slate-900">HealthHub</span>
            </div>
            <p className="text-slate-600 text-sm">© 2026 HealthHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
