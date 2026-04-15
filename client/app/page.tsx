"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { Navbar } from '@/components/Navbar'
import { PulseFitHero } from "@/components/ui/pulse-fit-hero"
import { BentoFeatures } from "@/components/sections/BentoFeatures"
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { 
  Users, 
  Stethoscope, 
  ShieldCheck, 
  Zap,
  Activity,
  Heart,
  MessageCircle,
  Clock,
  Video,
  ClipboardList,
  CheckCircle2,
  Star,
  Quote,
  ChevronDown,
  Globe,
  MessageSquare
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isAuthenticated && user) {
      const role = user.role?.toUpperCase() || ''
      if (role.includes('ADMIN')) {
        router.push('/admin/dashboard')
      } else if (role.includes('DOCTOR')) {
        router.push('/doctor/dashboard')
      } else if (role.includes('PATIENT')) {
        router.push('/patient/dashboard')
      }
    }
  }, [isAuthenticated, user, router])

  // Show a loading state during redirection or the landing page for guests
  if (mounted && isAuthenticated && user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          <p className="text-sm font-bold text-slate-500 animate-pulse">Redirecting to your command center...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-white">
      <Navbar />
      <main className="flex-1 pt-24">
        <PulseFitHero
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

        {/* Brand Cloud */}
        <div className="bg-white pt-20 pb-32 border-y border-slate-100">
          <div className="container mx-auto px-6">
            <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10">
              Trusted by leading healthcare institutions
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
              {["Mayo Clinic", "Stanford Health", "Mt Sinai", "UnitedHealth", "Aetna"].map((brand) => (
                <span key={brand} className="text-2xl font-black tracking-tighter text-slate-900 border-x px-4 border-slate-100">
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <section id="stats" className="relative z-10 -mt-12 px-6">
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
                  <GlassCard className="flex flex-col items-center text-center bg-white/50 backdrop-blur-md">
                    <div className="mb-4 rounded-2xl bg-white p-3 text-primary-600 shadow-sm border border-slate-100">
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

        {/* Product Showcase */}
        <section className="py-32 bg-white overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="flex flex-col gap-32">
              {/* Feature 1 */}
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <motion.div 
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <Badge className="mb-6 bg-primary-100 text-primary-700 font-bold px-4 py-1 border-none uppercase tracking-widest text-[10px]">Command Center</Badge>
                  <h2 className="text-4xl font-black text-slate-900 mb-6 leading-tight">Everything you need <br /> in one powerful view.</h2>
                  <p className="text-lg text-slate-500 font-medium mb-10 leading-relaxed">
                    Track your vitals, manage appointments, and view AI health insights through our award-winning patient dashboard. Designed for clarity and speed.
                  </p>
                  <ul className="space-y-4">
                    {["Real-time health monitoring", "Encrypted medical records", "AI-driven wellness trends"].map(item => (
                      <li key={item} className="flex items-center gap-3 font-bold text-slate-700">
                        <CheckCircle2 className="text-primary-600 h-5 w-5" /> {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <div className="absolute -inset-4 bg-primary-600/5 rounded-[3rem] rotate-3" />
                  <img 
                    src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=800&fit=crop" 
                    alt="Dashboard Mockup" 
                    className="relative rounded-[2.5rem] shadow-2xl border-8 border-white object-cover"
                  />
                </motion.div>
              </div>

              {/* Feature 2 */}
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   whileInView={{ opacity: 1, scale: 1 }}
                   viewport={{ once: true }}
                   className="lg:order-2"
                >
                  <Badge className="mb-6 bg-accent-100 text-accent-700 font-bold px-4 py-1 border-none uppercase tracking-widest text-[10px]">Care Everywhere</Badge>
                  <h2 className="text-4xl font-black text-slate-900 mb-6 leading-tight">Virtual visits that <br /> feel like the real thing.</h2>
                  <p className="text-lg text-slate-500 font-medium mb-10 leading-relaxed">
                    Our high-fidelity video engine ensures no lag and crystal clear communication with your doctor, regardless of your connection speed.
                  </p>
                  <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                      <Zap className="text-accent-600" />
                    </div>
                    <div>
                      <div className="font-black text-slate-900">Ultra-low latency</div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global CDN Network</div>
                    </div>
                  </div>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="relative lg:order-1"
                >
                  <div className="absolute -inset-4 bg-accent-600/5 rounded-[3rem] -rotate-3" />
                  <img 
                    src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&h=800&fit=crop" 
                    alt="Telemedicine Experience" 
                    className="relative rounded-[2.5rem] shadow-2xl border-8 border-white object-cover"
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section id="process" className="py-32 bg-slate-50 relative overflow-hidden">
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-20">
              <Badge className="mb-4 bg-primary-100 text-primary-700 hover:bg-primary-100 border-none px-4 py-1">THE PROCESS</Badge>
              <h2 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">Your healthcare, <br /> simplified in 3 steps.</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  title: "Select Service", 
                  desc: "Choose from virtual appointments, AI diagnostics, or direct pharmacy access.",
                  icon: <ClipboardList className="w-8 h-8 text-white" />,
                  color: "bg-primary-600"
                },
                { 
                  title: "Connect Instantly", 
                  desc: "Connect with our certified medical professionals through secure HD video sessions.",
                  icon: <Video className="w-8 h-8 text-white" />,
                  color: "bg-accent-600"
                },
                { 
                  title: "Receive Care", 
                  desc: "Get diagnostic results, prescriptions, and follow-up plans within minutes.",
                  icon: <CheckCircle2 className="w-8 h-8 text-white" />,
                  color: "bg-emerald-600"
                }
              ].map((step, i) => (
                <div key={i} className="relative group">
                  <GlassCard className="h-full pt-16 flex flex-col items-center text-center hover:bg-white transition-colors bg-white/40 border-slate-200">
                    <div className={cn("absolute -top-8 left-1/2 -translate-x-1/2 h-16 w-16 rounded-2xl flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-6", step.color)}>
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-black mb-4">{step.title}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                  </GlassCard>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-32 bg-white">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div>
                <Badge className="mb-4 bg-slate-100 text-slate-600 hover:bg-slate-100 border-none px-4 py-1 uppercase tracking-widest text-[10px] font-black">Patient Stories</Badge>
                <h2 className="text-4xl font-black tracking-tight text-slate-900 md:text-6xl leading-tight mb-8">Loved by <br /> thousands of <br /> safe patients.</h2>
                <div className="flex items-center gap-4 py-4 border-y border-slate-100">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                        <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <span className="font-bold text-slate-500">4.9/5 Rating on App Store</span>
                </div>
              </div>
              
              <div className="grid gap-6">
                 {[
                   { name: "Sarah J.", role: "Patient", quote: "The AI diagnostic saved me so much time. Within minutes I knew exactly which specialist I needed to see." },
                   { name: "Robert M.", role: "Patient", quote: "Best telemedicine experience I’ve ever had. Clear video, no lag, and the doctor was extremely professional." }
                 ].map((t, i) => (
                   <motion.div 
                     key={i}
                     whileHover={{ x: 10 }}
                     className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 relative group"
                   >
                     <Quote className="absolute top-8 right-8 h-8 w-8 text-slate-200 group-hover:text-primary-200 transition-colors" />
                     <div className="flex items-center gap-1 text-amber-500 mb-6">
                       {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill="currentColor" />)}
                     </div>
                     <p className="text-lg font-medium text-slate-700 italic mb-6 leading-relaxed">"{t.quote}"</p>
                     <div>
                       <div className="font-black text-slate-900">{t.name}</div>
                       <div className="text-xs font-bold text-primary-600 uppercase tracking-widest">{t.role}</div>
                     </div>
                   </motion.div>
                 ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-32 bg-slate-50">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-primary-100 text-primary-700 hover:bg-primary-100 border-none px-4 py-1">FAQ</Badge>
              <h2 className="text-4xl font-black text-slate-900 leading-tight">Frequently Asked Questions</h2>
            </div>
            
            <div className="space-y-4">
              {[
                { q: "Is telemedicine as effective as in-person visits?", a: "For many common conditions and follow-ups, studies show telemedicine is equally effective and significantly more convenient." },
                { q: "How secure is my medical data?", a: "We use hospital-grade AES-256 encryption and are fully HIPAA and GDPR compliant to ensure your privacy." },
                { q: "Can I get a prescription through the platform?", a: "Yes, our board-certified doctors can provide digital prescriptions that are sent directly to your preferred pharmacy." },
                { q: "What insurance providers do you accept?", a: "We partner with over 50 major insurance providers including UnitedHealth, Aetna, and Cigna." }
              ].map((faq, i) => (
                <details key={i} className="group p-6 bg-white rounded-3xl border border-slate-100 cursor-pointer transition-all hover:shadow-md">
                   <summary className="flex items-center justify-between list-none font-bold text-slate-900">
                     <span>{faq.q}</span>
                     <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center group-open:rotate-180 transition-transform">
                       <ChevronDown size={14} />
                     </div>
                   </summary>
                   <p className="mt-4 text-slate-500 font-medium leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contact" className="py-32 bg-slate-900 text-white overflow-hidden relative">
          <div className="container mx-auto px-6 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="mb-6 text-4xl font-bold md:text-6xl leading-tight">Ready to take control <br /> of your health?</h2>
              <p className="mx-auto mb-12 max-w-lg text-slate-400 text-lg">Join thousands of patients who trust our platform for their daily healthcare needs.</p>
              <div className="flex justify-center gap-6">
                <AnimatedButton size="xl" className="bg-white text-slate-900 hover:bg-slate-100" onClick={() => router.push("/register")}>
                  Join for free today
                </AnimatedButton>
              </div>
            </motion.div>
          </div>
          <div className="absolute inset-0 opacity-10 blur-3xl pointer-events-none">
            <div className="absolute left-[10%] top-[20%] h-64 w-64 rounded-full bg-primary-500" />
            <div className="absolute right-[10%] bottom-[20%] h-64 w-64 rounded-full bg-accent-500" />
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-100 pt-32 pb-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg">
                  <Heart className="h-6 w-6 fill-current" />
                </div>
                <span className="text-2xl font-black tracking-tight text-slate-900">HealthPulse</span>
              </Link>
              <p className="text-slate-500 font-medium max-w-sm mb-8 leading-relaxed">
                Empowering patients through AI-driven insights and instant access to world-class medical care. Global healthcare in your pocket.
              </p>
              <div className="flex gap-4">
                {[Globe, MessageSquare, Users, Activity].map((Icon, i) => (
                  <button key={i} className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary-600 hover:border-primary-200 transition-all hover:scale-110">
                    <Icon size={18} />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-xs">Platform</h4>
              <ul className="space-y-4">
                {["Find Doctors", "Telemedicine", "Diagnostics", "Wellness"].map(item => (
                  <li key={item}><Link href="#" className="text-slate-500 hover:text-primary-600 font-bold transition-colors">{item}</Link></li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-xs">Company</h4>
              <ul className="space-y-4">
                {["About Us", "Careers", "Press", "Contact"].map(item => (
                  <li key={item}><Link href="#" className="text-slate-500 hover:text-primary-600 font-bold transition-colors">{item}</Link></li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-xs">Support</h4>
              <ul className="space-y-4">
                {["Help Center", "Status", "API Docs", "Community"].map(item => (
                  <li key={item}><Link href="#" className="text-slate-500 hover:text-primary-600 font-bold transition-colors">{item}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-sm font-bold text-slate-400 italic">© 2026 HealthPulse Medical Network. All rights reserved.</div>
            <div className="flex gap-8">
              {["Privacy", "Terms", "Cookies"].map(item => (
                <Link key={item} href="#" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">{item}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
