'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useLoadingStore } from '@/store/loadingStore'
import { Activity } from 'lucide-react'

export function GlobalLoading() {
  const { isLoading } = useLoadingStore()

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-white shadow-2xl space-y-4 min-w-[240px]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="text-primary-600"
            >
              <Activity className="w-14 h-14 opacity-80" />
            </motion.div>
            <h3 className="text-xl font-black text-slate-900 animate-pulse tracking-tight">
              Processing...
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
              Please Wait
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
