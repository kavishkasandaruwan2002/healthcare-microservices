"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import {
  CreditCard,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  Video,
  Calendar,
  Clock,
  ArrowLeft,
  Stethoscope
} from 'lucide-react'

// ─── Payment Content ────────────────────────────────────────────────────────

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_cNi8wO4dD8S3bj6e9X24000'

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuthStore()

  const appointmentId = searchParams.get('appointmentId') || ''
  const doctorName = searchParams.get('doctorName') || 'Your Doctor'
  const scheduledAt = searchParams.get('scheduledAt') || ''
  const fee = searchParams.get('fee') || '0'

  const [status, setStatus] = useState<'idle' | 'redirecting' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (!appointmentId) {
      setStatus('error')
      setErrorMessage('No appointment ID provided.')
    }
  }, [isAuthenticated, appointmentId])

  const handlePay = () => {
    setStatus('redirecting')
    window.location.href = STRIPE_PAYMENT_LINK
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Scheduled'
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })
    } catch { return dateStr }
  }

  const formatTime = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      return new Date(dateStr).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit'
      })
    } catch { return '' }
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-primary-600 font-semibold text-sm uppercase tracking-wider">
              <CreditCard className="h-4 w-4" />
              Secure Checkout
            </div>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2">
            {['Select Specialist', 'Choose Schedule', 'Confirm & Pay'].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
                  i < 2
                    ? 'bg-emerald-500 text-white'
                    : 'bg-primary-600 text-white'
                }`}>
                  {i < 2 ? <CheckCircle className="h-4 w-4" /> : <span>{i + 1}</span>}
                  <span className="hidden sm:block">{step}</span>
                </div>
                {i < 2 && <div className="h-px w-6 bg-slate-300" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Page Title */}
      <div className="max-w-4xl mx-auto px-8 pt-8 pb-4">
        <p className="text-primary-600 font-semibold text-sm uppercase tracking-wider mb-1">
          💳 Payment
        </p>
        <h1 className="text-3xl font-black text-slate-900">Complete Your Booking</h1>
        <p className="text-slate-500 mt-1">Secure payment powered by Stripe. No card data touches our servers.</p>
      </div>

      <div className="max-w-4xl mx-auto px-8 pb-12 grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* Left — Pay Button Area */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">

            {/* ERROR */}
            {status === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard hover={false} className="text-center py-12">
                  <div className="h-16 w-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="h-8 w-8 text-rose-500" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">Payment Unavailable</h2>
                  <p className="text-slate-500 text-sm mb-6">{errorMessage}</p>
                  <AnimatedButton variant="outline" onClick={() => router.back()}>
                    Go Back
                  </AnimatedButton>
                </GlassCard>
              </motion.div>
            )}

            {/* READY */}
            {status !== 'error' && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard hover={false}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 bg-primary-100 rounded-2xl flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Payment Details</h2>
                      <p className="text-xs text-slate-500">You will be redirected to Stripe's secure checkout</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                      <Shield className="h-3 w-3" />
                      Encrypted
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                      Click the button below to proceed to Stripe's hosted payment page.
                      Use test card <span className="font-mono font-semibold text-slate-700">4242 4242 4242 4242</span> with
                      any future expiry and any CVC.
                    </p>

                    <AnimatedButton
                      variant="primary"
                      size="lg"
                      className="w-full"
                      onClick={handlePay}
                      isLoading={status === 'redirecting'}
                      disabled={status === 'redirecting'}
                    >
                      {status === 'redirecting' ? (
                        <>Redirecting to Stripe...</>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5 mr-2" />
                          Pay ${parseFloat(fee).toFixed(2)} via Stripe
                        </>
                      )}
                    </AnimatedButton>
                  </div>
                </GlassCard>

                {/* Security badges */}
                <div className="flex items-center justify-center gap-6 mt-4">
                  {['SSL Secured', 'PCI Compliant', 'Stripe Protected'].map(badge => (
                    <div key={badge} className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <Shield className="h-3.5 w-3.5 text-slate-300" />
                      {badge}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Right — Order Summary */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard hover={false}>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
              Booking Summary
            </h3>

            {/* Doctor */}
            <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100">
              <div className="h-12 w-12 bg-primary-100 rounded-2xl flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Doctor</p>
                <p className="font-bold text-slate-900">{doctorName}</p>
              </div>
            </div>

            {/* Session details */}
            <div className="space-y-3">
              {scheduledAt && (
                <>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4 text-primary-400" />
                    <span>{formatDate(scheduledAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="h-4 w-4 text-primary-400" />
                    <span>{formatTime(scheduledAt)}</span>
                  </div>
                </>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Video className="h-4 w-4 text-primary-400" />
                <span className="font-semibold text-primary-600 uppercase text-xs tracking-wider">
                  Video Session
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="mt-5 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Consultation Fee</span>
                <span className="font-black text-slate-900">
                  ${parseFloat(fee).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-400">Platform Fee</span>
                <span className="text-xs text-emerald-600 font-semibold">Free</span>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                <span className="font-bold text-slate-900">Total Due</span>
                <span className="text-2xl font-black text-primary-600">
                  ${parseFloat(fee).toFixed(2)}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Trust badges */}
          <GlassCard hover={false} className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-bold text-slate-700">Payment Security</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-500">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                256-bit SSL encryption
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Card details never stored on our servers
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                PCI DSS Level 1 compliant
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Powered by Stripe
              </li>
            </ul>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

// ─── Wrapper Page ───────────────────────────────────────────────────────────

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 text-primary-500 animate-spin" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}
