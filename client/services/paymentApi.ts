import api from './api'  // reuse existing axios instance (port 8085)

export interface PaymentInitiateResponse {
  paymentId: string
  clientSecret: string
  amount: number
  currency: string
  status: string
  stripePublishableKey: string
}

export interface PaymentResponse {
  paymentId: string
  appointmentId: string
  patientId: string
  doctorId: string
  amount: number
  currency: string
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
  description: string
  createdAt: string
}

export const paymentApiService = {
  // Initiate payment — creates Stripe PaymentIntent
  initiatePayment: async (appointmentId: string): Promise<PaymentInitiateResponse> => {
    const res = await api.post('/v1/payments/initiate', { appointmentId })
    return res.data
  },

  // Get payment by appointment ID
  getPaymentByAppointment: async (appointmentId: string): Promise<PaymentResponse> => {
    const res = await api.get(`/v1/payments/appointment/${appointmentId}`)
    return res.data
  },

  // Get my payments list
  getMyPayments: async (): Promise<PaymentResponse[]> => {
    const res = await api.get('/v1/payments/my-payments')
    return res.data.content || res.data
  },
}
