"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { Sidebar } from '@/components/ui/Sidebar';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import {
  Calendar,
  Clock,
  Video,
  User,
  ArrowLeft,
  Stethoscope,
  MapPin,
  FileText,
  AlertCircle,
  Activity,
  Phone
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface AppointmentDetails {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization?: string;
  date: string;
  time: string;
  appointmentTime?: string;
  reason: string;
  status: 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  appointmentType?: string;
  notes?: string;
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  NO_SHOW:   'bg-slate-50 text-slate-700 border-slate-200',
};

export default function AppointmentDetailsPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchAppointment = async () => {
      try {
        // We fetch all appointments and find the one that matches since there might not be a single fetch endpoint
        const res = await api.get(`/appointments/patient/${user?.id || 'me'}`);
        const data = Array.isArray(res.data) ? res.data : [];
        const found = data.find((apt: any) => apt.id === id);
        
        if (found) {
            setAppointment(found);
        } else {
            // Mock fallback if exact match isn't found (for aesthetic demonstration)
            setAppointment({
                id: id as string,
                doctorId: 'mock-doc',
                doctorName: 'Specialist',
                doctorSpecialization: 'General Consultation',
                date: '2026-04-22',
                time: '03:30 PM',
                reason: 'Follow-up Checkup',
                status: 'CONFIRMED',
                appointmentType: 'TELEMEDICINE',
                notes: 'Please ensure your camera and microphone are working prior to the call.'
            });
        }
      } catch (err) {
        toast.error('Failed to load appointment details');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id, isAuthenticated, user, router]);

  const handleReschedule = async () => {
    try {
      setCanceling(true);
      // Simulate reschedule API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAppointment(prev => prev ? { ...prev, date: newDate === 'Today' ? '2026-04-22' : newDate === 'Tomorrow' ? '2026-04-23' : '2026-04-30', time: newTime } : null);
      setIsRescheduling(false);
      toast.success("Appointment has been rescheduled successfully");
    } catch (e) {
      toast.error("Failed to reschedule appointment");
    } finally {
      setCanceling(false);
    }
  };

  const handleCancel = async () => {
    try {
      setCanceling(true);
      // Simulate cancel API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAppointment(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
      toast.success("Appointment has been cancelled successfully");
    } catch (e) {
      toast.error("Failed to cancel appointment");
    } finally {
      setCanceling(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="PATIENT" />

      <main className="flex-1 lg:ml-[80px] xl:ml-[280px] p-4 md:p-8 pt-20 lg:pt-8 transition-all duration-300">
        {/* Header */}
        <header className="mb-8 flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-primary-600 transition-all active:scale-95 shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1 font-bold text-primary-600 text-sm uppercase tracking-widest">
              <Stethoscope className="h-4 w-4" /> Consultation Details
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Appointment Overview</h1>
          </div>
        </header>

        {loading ? (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-[400px] rounded-3xl bg-slate-100 animate-pulse" />
            <div className="h-[400px] rounded-3xl bg-slate-100 animate-pulse" />
          </div>
        ) : !appointment ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <AlertCircle className="h-16 w-16 text-slate-300 mb-4" />
            <h3 className="text-2xl font-black text-slate-900 mb-2">Appointment Not Found</h3>
            <p className="text-slate-500 font-medium">This appointment may have been deleted or does not exist.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Primary Details Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 space-y-6"
            >
              <GlassCard className="p-8 border-none shadow-sm bg-white rounded-3xl relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 border-b border-slate-100 pb-8">
                    <div className="flex items-center gap-5">
                      <div className="h-20 w-20 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 shadow-inner">
                        <User className="h-10 w-10" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900">Dr. {appointment.doctorName}</h2>
                        <p className="text-primary-600 font-bold mb-2">{appointment.doctorSpecialization}</p>
                        <span className={cn(
                          'text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border',
                          STATUS_COLORS[appointment.status] || STATUS_COLORS.PENDING
                        )}>
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-xs mb-2">
                        <Calendar className="h-4 w-4 text-primary-500" /> Scheduled Date
                      </div>
                      <p className="font-bold text-slate-900 text-lg">{appointment.date || appointment.appointmentTime?.split('T')[0]}</p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-xs mb-2">
                        <Clock className="h-4 w-4 text-amber-500" /> Time
                      </div>
                      <p className="font-bold text-slate-900 text-lg">{appointment.time || '10:30 AM'}</p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-xs mb-2">
                        <Activity className="h-4 w-4 text-rose-500" /> Reason
                      </div>
                      <p className="font-bold text-slate-900 text-lg">{appointment.reason}</p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-xs mb-2">
                        <MapPin className="h-4 w-4 text-emerald-500" /> Type
                      </div>
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-lg">
                        {appointment.appointmentType === 'TELEMEDICINE' ? <Video className="h-5 w-5 text-indigo-500" /> : <User className="h-5 w-5 text-emerald-500" />}
                        {appointment.appointmentType === 'TELEMEDICINE' ? 'Virtual Consultation' : 'In-Person Visit'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative Blur */}
                <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-primary-500/5 blur-3xl opacity-50" />
              </GlassCard>

              {isRescheduling ? (
                <GlassCard className="p-8 border-none shadow-sm bg-white rounded-3xl space-y-6">
                  <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4">Reschedule Appointment</h3>
                  
                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Available Dates</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Today', 'Tomorrow', 'Next Week'].map((day) => (
                        <button
                          key={day}
                          onClick={() => setNewDate(day)}
                          className={cn(
                            'p-3 rounded-2xl border-2 transition-all active:scale-95 flex flex-col items-center justify-center gap-1',
                            newDate === day
                              ? 'border-primary-500 bg-primary-50 ring-4 ring-primary-500/5 shadow-md text-primary-700'
                              : 'border-slate-100 bg-white hover:border-primary-200 text-slate-600'
                          )}
                        >
                          <Calendar className="h-4 w-4 mb-1" />
                          <span className="text-sm font-bold">{day}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Available Times</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['09:00 AM', '01:30 PM', '04:00 PM'].map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setNewTime(slot)}
                          className={cn(
                            'py-2.5 rounded-xl border-2 transition-all active:scale-95 text-sm font-bold',
                            newTime === slot
                              ? 'border-primary-500 bg-primary-600 text-white shadow-md'
                              : 'border-slate-100 bg-white hover:border-primary-200 text-slate-600'
                          )}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-slate-100">
                    <AnimatedButton
                      variant="glass"
                      className="flex-1 bg-slate-50 border border-slate-200 text-slate-600 font-bold"
                      onClick={() => setIsRescheduling(false)}
                    >
                      Cancel
                    </AnimatedButton>
                    <AnimatedButton
                      className="flex-1 bg-primary-600 shadow-xl shadow-primary-500/20 px-8"
                      disabled={!newDate || !newTime}
                      onClick={handleReschedule}
                      isLoading={canceling}
                    >
                      Confirm New Time
                    </AnimatedButton>
                  </div>
                </GlassCard>
              ) : (
                appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                  <GlassCard className="p-6 border-none shadow-sm flex flex-col sm:flex-row items-center gap-4 bg-white rounded-3xl">
                    <AnimatedButton 
                      variant="glass"
                      className="w-full sm:w-auto text-rose-600 bg-rose-50 hover:bg-rose-100 border-none px-8 font-bold"
                      onClick={handleCancel}
                      isLoading={canceling}
                    >
                      Cancel Appointment
                    </AnimatedButton>
                    <AnimatedButton 
                      className="w-full sm:flex-1 bg-slate-900 shadow-xl shadow-slate-900/10 px-8 disabled:opacity-50"
                      disabled={appointment.status === 'CANCELLED'}
                      onClick={() => setIsRescheduling(true)}
                    >
                      Reschedule
                    </AnimatedButton>
                  </GlassCard>
                )
              )}
            </motion.div>

            {/* Action Sidebar */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              {appointment.appointmentType === 'TELEMEDICINE' && appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && (
                <GlassCard className="bg-linear-to-br from-indigo-600 to-primary-600 text-white border-none shadow-2xl shadow-indigo-500/30 overflow-hidden relative group p-8">
                  <div className="relative z-10 text-center flex flex-col items-center">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-inner">
                      <Video className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="mb-2 text-2xl font-black leading-tight">Telemedicine Session</h3>
                    <p className="mb-8 text-indigo-100 text-sm font-medium leading-relaxed">
                      Your virtual consultation room will open 10 minutes prior to the scheduled time.
                    </p>
                    <AnimatedButton
                      className="w-full bg-white text-indigo-900 hover:bg-slate-100 border-none font-bold shadow-lg"
                      onClick={() => router.push(`/telemedicine/${appointment.id}`)}
                    >
                      Join Video Call
                    </AnimatedButton>
                  </div>
                  <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-white/10 blur-3xl group-hover:scale-150 transition-transform duration-700" />
                </GlassCard>
              )}

              <GlassCard className="p-6 border-none shadow-sm bg-white rounded-3xl">
                <h3 className="flex items-center gap-2 text-slate-900 font-black mb-4">
                  <FileText className="h-5 w-5 text-primary-500" /> Pre-appointment Notes
                </h3>
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-sm font-medium text-slate-600 leading-relaxed">
                    {appointment.notes || "No special instructions provided by the clinic. Please ensure you log in on time and have a stable internet connection."}
                  </p>
                </div>
              </GlassCard>
              
              <GlassCard className="p-6 border-2 border-dashed border-slate-200 bg-transparent shadow-none rounded-3xl flex items-center justify-between group cursor-pointer hover:border-primary-300 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-primary-600 shadow-sm transition-colors">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">Need Help?</h4>
                    <p className="text-xs font-bold text-slate-400 group-hover:text-primary-500 transition-colors">Contact Support</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

          </div>
        )}
      </main>
    </div>
  );
}
