"use client"

import Link from 'next/link'
import { motion } from 'framer-motion'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { 
  Users, 
  Stethoscope, 
  ShieldCheck, 
  Zap,
  Activity
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { PulseFitHero } from "@/components/ui/pulse-fit-hero"
import { BentoFeatures } from "@/components/sections/BentoFeatures"
import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { cn } from '@/lib/utils'

export default function LandingPage() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.refresh()
  }

  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      <main className="flex-1">
        <PulseFitHero
          isAuthenticated={isAuthenticated}
          user={user}
          onLogout={handleLogout}
          logo="HealthPulse"
          title="Experience the Future of Medical Care"
          subtitle="The most advanced AI-powered health platform. Connect with world-class doctors and manage your health with ease and security."
          primaryAction={{
            label: "Start Journey",
            onClick: () => router.push("/register"),
          }}
          secondaryAction={{
            label: "Sign In",
            onClick: () => router.push("/login"),
          }}
          disclaimer="*Verified by Board-Certified Professionals"
          socialProof={{
            avatars: [
              "https://images.unsplash.com/photo-1559839734-2b71f1536783?w=150&h=150&fit=crop",
              "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop",
              "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=150&h=150&fit=crop",
              "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop",
            ],
            text: "Trusted by 50,000+ Active Patients",
          }}
          programs={[
            {
              image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=500&fit=crop",
              category: "TELEMEDICINE",
              title: "24/7 Virtual Consultation",
              onClick: () => router.push("/telemedicine"),
            },
            {
              image: "https://images.unsplash.com/photo-1530490125459-847a6d437825?w=400&h=500&fit=crop",
              category: "DIAGNOSTICS",
              title: "AI Symptom Analysis",
              onClick: () => console.log("Diagnostics"),
            },
            {
              image: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&h=500&fit=crop",
              category: "WELLNESS",
              title: "Holistic Health Tracking",
              onClick: () => console.log("Wellness"),
            },
          ]}
        />

        {/* Stats Section */}
        <section className="relative z-10 -mt-20 px-6">
          <div className="container mx-auto">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Patients Helped", value: "250K+", icon: <Users /> },
                { label: "Top Specialists", value: "1.2K+", icon: <Stethoscope /> },
                { label: "Success Rate", value: "99.2%", icon: <ShieldCheck /> },
                { label: "Avg Wait Time", value: "15 min", icon: <Zap /> },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <GlassCard className="flex flex-col items-center text-center">
                    <div className="mb-4 rounded-2xl bg-white p-3 text-primary-600 shadow-sm">
                      {stat.icon}
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                    <div className="text-sm font-medium text-slate-500">{stat.label}</div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <BentoFeatures />

        {/* CTA Section */}
        <section className="py-32 bg-slate-900 text-white overflow-hidden relative">
          <div className="container mx-auto px-6 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="mb-6 text-4xl font-bold md:text-6xl">Ready to take control <br /> of your health?</h2>
              <p className="mx-auto mb-12 max-w-lg text-slate-400 text-lg">Join thousands of patients who trust our platform for their daily healthcare needs.</p>
              <Link href="/register">
                <AnimatedButton size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                  Join for free today
                </AnimatedButton>
              </Link>
            </motion.div>
          </div>
          <div className="absolute inset-0 opacity-10 blur-3xl pointer-events-none">
            <div className="absolute left-[10%] top-[20%] h-64 w-64 rounded-full bg-primary-500" />
            <div className="absolute right-[10%] bottom-[20%] h-64 w-64 rounded-full bg-accent-500" />
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="container mx-auto px-6 text-center">
          <div className="mb-8 flex items-center justify-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">HealthCare</span>
          </div>
          <div className="text-sm text-slate-500">
            © 2026 Smart HealthCare Platform. Built for the future of medicine.
          </div>
        </div>
      </footer>
    </div>
  )
}
