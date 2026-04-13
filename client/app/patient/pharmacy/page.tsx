"use client"

import { motion } from 'framer-motion'
import { Sidebar } from '@/components/ui/Sidebar'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { 
  Search, 
  MapPin, 
  Phone, 
  Clock, 
  Star, 
  Navigation,
  ArrowLeft,
  ChevronRight,
  Filter
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const pharmacies = [
  {
    name: 'Apollo Pharmacy',
    address: '123 Health Ave, Colombo 07',
    distance: '0.8 km',
    rating: 4.8,
    status: 'Open 24/7',
    isOpen: true,
  },
  {
    name: 'MediCare Plus',
    address: '45 Wellness St, Rajagiriya',
    distance: '2.4 km',
    rating: 4.5,
    status: 'Closes at 10 PM',
    isOpen: true,
  },
  {
    name: 'CureAll Drugs',
    address: '88 Mercy Blvd, Nugegoda',
    distance: '3.1 km',
    rating: 4.2,
    status: 'Opens at 8 AM',
    isOpen: false,
  },
]

export default function PharmacyPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="PATIENT" />

      <main className="flex-1 lg:ml-[80px] xl:ml-[280px] p-0 md:p-0 pt-20 lg:pt-0">
        <div className="flex h-full flex-col lg:flex-row">
          {/* Left Sidebar: Results */}
          <div className="w-full lg:w-[450px] bg-white border-r border-slate-100 flex flex-col h-screen overflow-hidden">
            <div className="p-6 border-b border-slate-50">
              <button 
                onClick={() => router.back()}
                className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Dashboard
              </button>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-6">Pharmacies Near You</h1>
              
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search by area or pharmacy..." 
                    className="h-14 w-full rounded-2xl border border-slate-100 bg-slate-50 pl-12 pr-4 focus:bg-white focus:border-primary-500 transition-all outline-none font-medium"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {['24/7 Open', 'Home Delivery', 'Top Rated', 'Near Me'].map(tag => (
                        <button key={tag} className="whitespace-nowrap rounded-xl border border-slate-100 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:border-primary-200 hover:text-primary-600 transition-all">
                            {tag}
                        </button>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {pharmacies.map((pharmacy, i) => (
                <motion.div
                  key={pharmacy.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-3xl border border-slate-50 bg-white p-5 shadow-xs hover:shadow-xl hover:border-primary-100 transition-all cursor-pointer group"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{pharmacy.name}</h3>
                      <p className="text-sm text-slate-500 font-medium flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {pharmacy.address}
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-inner">
                        <Star className="h-5 w-5 fill-current" />
                    </div>
                  </div>

                  <div className="mb-4 flex items-center gap-4 border-y border-slate-50 py-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                        <Clock className={cn("h-4 w-4", pharmacy.isOpen ? "text-emerald-500" : "text-rose-500")} />
                        <span className={pharmacy.isOpen ? "text-emerald-600" : "text-rose-600"}>{pharmacy.status}</span>
                    </div>
                    <div className="h-1 w-1 rounded-full bg-slate-200" />
                    <div className="text-xs font-bold text-slate-400">{pharmacy.distance}</div>
                  </div>

                  <div className="flex gap-2">
                    <AnimatedButton variant="primary" size="sm" className="flex-1 h-10 gap-2 bg-primary-600 font-bold">
                      <Navigation className="h-4 w-4" /> Directions
                    </AnimatedButton>
                    <AnimatedButton variant="glass" size="sm" className="h-10 w-12 bg-slate-50 text-slate-600 flex items-center justify-center border-none">
                      <Phone className="h-4 w-4" />
                    </AnimatedButton>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Section: Map Placeholder */}
          <div className="flex-1 relative bg-slate-200 hidden lg:block">
            {/* Mock Map Background */}
            <div className="absolute inset-0 bg-[#f8fafc] flex items-center justify-center">
                <div className="text-center">
                    <div className="mb-6 mx-auto h-24 w-24 rounded-full bg-primary-50 flex items-center justify-center animate-bounce">
                        <MapPin className="h-12 w-12 text-primary-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-400 opacity-50 uppercase tracking-widest italic">Live Interactive Map</h2>
                    <p className="text-slate-400 font-bold mt-2">Connecting to GPS positioning...</p>
                </div>
            </div>

            {/* Overlays */}
            <div className="absolute top-8 right-8 space-y-3">
                <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xl text-slate-600 hover:text-primary-600 transition-all">
                    <Navigation className="h-6 w-6" />
                </button>
                <div className="flex flex-col rounded-2xl bg-white shadow-xl overflow-hidden">
                    <button className="h-10 w-10 border-b border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50">+</button>
                    <button className="h-10 w-10 flex items-center justify-center text-slate-600 hover:bg-slate-50">-</button>
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
