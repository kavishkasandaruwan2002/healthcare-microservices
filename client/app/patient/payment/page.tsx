"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { paymentApiService, type PaymentInitiateResponse } from '@/services/paymentApi'
import {
  CreditCard,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  Video,
  Calendar,
  Clock,
  Lock,
  ArrowLeft,
  Stethoscope
} from 'lucide-react'
import toast from 'react-hot-toast'

// Stripe dynamic import
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

// ─── Card Form Component ────────────────────────────────────────────────────

interface CardFormProps {
  clientSecret: string
  paymentId: string
  amount: number
  currency: string
  appointmentId: string
  onSuccess: () => void
  onError: (msg: string) => void
}

function CardForm({ clientSecret, paymentId, amount, currency, appointmentId, onSuccess, onError }: CardFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const { user } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsProcessing(true)
    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('Card element not found')

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: user?.name || user?.email || 'Patient',
            email: user?.email || '',
          },
        },
      })

      if (error) {
        onError(error.message || 'Payment failed')
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess()
      }
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card Element */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Card Details
        </label>
        <div className="p-4 border-2 border-slate-200 rounded-2xl focus-within:border-primary-500 transition-colors bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#1e293b',
                  fontFamily: 'Outfit, sans-serif',
                  '::placeholder': { color: '#94a3b8' },
                },
                invalid: { color: '#ef4444' },
              },
              hidePostalCode: true,
            }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
          <Lock className="h-3 w-3" />
          Secured by Stripe. Test card: 4242 4242 4242 4242
        </p>
      </div>

      {/* Pay Button */}
      <AnimatedButton
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isProcessing}
        className="w-full"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>Processing...</>
        ) : (
          <>
            <Lock className="h-5 w-5 mr-2" />
            Pay {currency.toUpperCase()} {amount.toFixed(2)}
          </>
        )}
      </AnimatedButton>
    </form>
  )
}

// ─── Payment Content ────────────────────────────────────────────────────────

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuthStore()

  const appointmentId = searchParams.get('appointmentId') || ''
  const doctorName = searchParams.get('doctorName') || 'Your Doctor'
  const scheduledAt = searchParams.get('scheduledAt') || ''
  const fee = searchParams.get('fee') || '0'

  const [paymentData, setPaymentData] = useState<PaymentInitiateResponse | null>(null)
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (!appointmentId) {
      setStatus('error')
      setErrorMessage('No appointment ID provided.')
      return
    }
    initPayment()
  }, [isAuthenticated, appointmentId])

  const initPayment = async () => {
    try {
      setStatus('loading')
      // 1. Call backend to create PaymentIntent
      const data = await paymentApiService.initiatePayment(appointmentId)
      setPaymentData(data)

      // 2. Load Stripe with publishable key from backend response
      const stripe = loadStripe(data.stripePublishableKey)
      setStripePromise(stripe)

      setStatus('ready')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initialize payment'
      setErrorMessage(msg)
      setStatus('error')
    }
  }

  const handleSuccess = () => {
    setStatus('success')
    toast.success('Payment successful! Your consultation is confirmed.')
    // Redirect to appointment page after 3 seconds
    setTimeout(() => {
      router.push('/patient/appointments')
    }, 3000)
  }

  const handleError = (msg: string) => {
    toast.error(msg)
    setErrorMessage(msg)
  }

  // Format scheduled date
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
      {/* Header — matches existing app style */}
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

          {/* Stepper — matches Virtual Care Hub stepper style */}
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

        {/* Left — Payment Form */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">

            {/* LOADING */}
            {status === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                <GlassCard className="flex flex-col items-center justify-center py-16 gap-4">
                  <Loader2 className="h-10 w-10 text-primary-500 animate-spin" />
                  <p className="text-slate-500 font-medium">Preparing secure checkout...</p>
                </GlassCard>
              </motion.div>
            )}

            {/* READY — Stripe Card Form */}
            {status === 'ready' && paymentData && stripePromise && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard hover={false}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 bg-primary-100 rounded-2xl flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Payment Details</h2>
                      <p className="text-xs text-slate-500">Enter your card information below</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                      <Shield className="h-3 w-3" />
                      Encrypted
                    </div>
                  </div>

                  <Elements stripe={stripePromise} options={{ clientSecret: paymentData.clientSecret }}>
                    <CardForm
                      clientSecret={paymentData.clientSecret}
                      paymentId={paymentData.paymentId}
                      amount={paymentData.amount}
                      currency={paymentData.currency}
                      appointmentId={appointmentId}
                      onSuccess={handleSuccess}
                      onError={handleError}
                    />
                  </Elements>
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

            {/* SUCCESS */}
            {status === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              >
                <GlassCard hover={false} className="text-center py-12">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="h-24 w-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/30"
                  >
                    <CheckCircle className="h-12 w-12 text-white" />
                  </motion.div>
                  <h2 className="text-3xl font-black text-slate-900 mb-3">
                    Confirmed! Your path to better health begins.
                  </h2>
                  <p className="text-slate-500 mb-6">
                    We&apos;ve sent a calendar invitation and encrypted meeting details to{' '}
                    <span className="text-primary-600 font-semibold">{user?.email}</span>.
                  </p>
                  <AnimatedButton
                    variant="primary"
                    size="lg"
                    onClick={() => router.push('/patient/appointments')}
                  >
                    Return to Dashboard
                  </AnimatedButton>
                </GlassCard>
              </motion.div>
            )}

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
                  <div className="flex gap-3 justify-center">
                    <AnimatedButton variant="outline" onClick={() => router.back()}>
                      Go Back
                    </AnimatedButton>
                    <AnimatedButton variant="primary" onClick={initPayment}>
                      Try Again
                    </AnimatedButton>
                  </div>
                </GlassCard>
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
                  ${paymentData?.amount?.toFixed(2) || parseFloat(fee).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-400">Platform Fee</span>
                <span className="text-xs text-emerald-600 font-semibold">Free</span>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                <span className="font-bold text-slate-900">Total Due</span>
                <span className="text-2xl font-black text-primary-600">
                  ${paymentData?.amount?.toFixed(2) || parseFloat(fee).toFixed(2)}
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
