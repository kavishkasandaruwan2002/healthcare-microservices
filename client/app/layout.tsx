import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'
import { GlobalLoading } from '@/components/ui/GlobalLoading'

const outfit = Outfit({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Smart Healthcare Platform | AI-Powered Virtual Care',
  description: 'Book appointments, consult with doctors, and manage your health records in a futuristic, secure platform.',
  keywords: ['healthcare', 'telemedicine', 'appointment booking', 'AI symptom checker'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${outfit.className} antialiased`}>
        <Providers>
          <div className="min-h-screen bg-mesh selection:bg-primary-100">
            {children}
          </div>
          <GlobalLoading />
        </Providers>
      </body>
    </html>
  )
}
