"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Activity, Calendar, FileText, Video } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.refresh()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold tracking-tight">HealthCare</span>
          </div>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href={user?.role === 'ROLE_PATIENT' || user?.role === 'PATIENT' ? '/patient/dashboard' : '/doctor/dashboard'}>
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <Button onClick={handleLogout} variant="outline">Sign Out</Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="w-full py-24 lg:py-32 bg-slate-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-4 max-w-3xl">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-slate-900">
                  Smart Healthcare Appointment & Telemedicine
                </h1>
                <p className="mx-auto max-w-[700px] text-slate-500 text-lg md:text-xl leading-relaxed">
                  Connect with top doctors, book appointments directly, and consult virtually securely from the comfort of your home.
                </p>
              </div>
              <div className="space-x-4 mt-8">
                <Link href="/register">
                  <Button size="lg" className="h-12 px-8 text-base">Get Started</Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">I'm a Doctor</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-20 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 shadow-sm">
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">Easy Booking</h3>
                <p className="text-slate-500">Book appointments instantly with your preferred specialists.</p>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 shadow-sm">
                  <Video className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">Telemedicine</h3>
                <p className="text-slate-500">Consult with doctors safely over high-quality video calls.</p>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 shadow-sm">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">Health Records</h3>
                <p className="text-slate-500">Access and share your medical history securely at any time.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-slate-50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500">
          © 2026 Smart HealthCare Platform. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
