"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { Sidebar } from "@/components/ui/Sidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import {
  Calendar,
  Clock,
  Search,
  User,
  Star,
  MapPin,
  Video,
  CheckCircle,
  ChevronRight,
  Stethoscope,
  Filter,
  ArrowLeft,
  ListChecks,
  PlusCircle,
  AlertCircle,
  XCircle,
  LayoutList,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  rating: number;
  location: string;
  image: string;
}

interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization?: string;
  date: string;
  time: string;
  appointmentTime?: string;
  reason: string;
  status: "CONFIRMED" | "PENDING" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  appointmentType?: string;
  notes?: string;
}

// Generates the next 7 real dates in display + YYYY-MM-DD format
function getNextDays(count = 7): { label: string; value: string }[] {
  const days: { label: string; value: string }[] = [];
  const today = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const value = d.toISOString().split("T")[0]; // YYYY-MM-DD
    const label = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    days.push({ label, value });
  }
  return days;
}

// Time slots in display format → convert to HH:mm for API
const TIME_SLOTS = [
  { label: "09:00 AM", value: "09:00" },
  { label: "10:00 AM", value: "10:00" },
  { label: "11:00 AM", value: "11:00" },
  { label: "01:00 PM", value: "13:00" },
  { label: "02:30 PM", value: "14:30" },
  { label: "04:00 PM", value: "16:00" },
];

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  NO_SHOW: "bg-slate-50 text-slate-700 border-slate-200",
};

export default function PatientAppointments() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Tab: 'book' | 'my'
  const [activeTab, setActiveTab] = useState<"book" | "my">("book");

  // ── Booking flow
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedDateLabel, setSelectedDateLabel] = useState("");
  const [selectedTime, setSelectedTime] = useState<{
    label: string;
    value: string;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [appointmentType, setAppointmentType] = useState<
    "IN_PERSON" | "TELEMEDICINE"
  >("IN_PERSON");
  const [searchQuery, setSearchQuery] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  // ── My Appointments
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [loadingMy, setLoadingMy] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  const DAYS = getNextDays(7);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    if (!isAuthenticated) {
      router.push("/login");
    } else {
      fetchDoctors();
    }
  }, [isAuthenticated, hasMounted, router]);

  useEffect(() => {
    if (activeTab === "my" && isAuthenticated && user?.id) {
      fetchMyAppointments();
    }
  }, [activeTab, isAuthenticated, user?.id]);

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const res = await api.get("/doctors/verified");
      const formatted = res.data.map((doc: any) => ({
        id: doc.id,
        name: doc.name?.startsWith("Dr.") ? doc.name : `Dr. ${doc.name}`,
        specialization: doc.specialization || "General Specialist",
        rating: +(4.8 + Math.random() * 0.2).toFixed(1),
        location: doc.hospitalAffiliation || "Virtual Clinic",
        image:
          doc.image ||
          `https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=400&h=300`,
      }));
      setDoctors(formatted);
    } catch {
      toast.error("Unable to load specialist directory");
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchMyAppointments = useCallback(async () => {
    try {
      setLoadingMy(true);
      const res = await api.get(`/appointments/patient/${user?.id}`);
      setMyAppointments(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Could not load your appointments");
    } finally {
      setLoadingMy(false);
    }
  }, [user?.id]);

  if (!hasMounted || !isAuthenticated) return null;

  const handleBooking = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast.error("Please select doctor, date and time");
      return;
    }
    if (!user?.id) {
      toast.error("Session expired — please log in again");
      router.push("/login");
      return;
    }
    setIsBooking(true);
    try {
      const res = await api.post("/appointments", {
        patientId: user.id, //non-null now
        doctorId: selectedDoctor.id,
        date: selectedDate,
        time: selectedTime.value,
        reason: reason || "General Consultation",
        appointmentType: appointmentType,
      });
      
      const newAptId = res.data?.id || res.data?.appointmentId;
      if (newAptId) {
        toast.success("Booking secured! Redirecting to payment...");
        router.push(`/patient/payment?appointmentId=${newAptId}&doctorName=${encodeURIComponent(selectedDoctor.name)}&scheduledAt=${selectedDate}T${selectedTime.value}&fee=150`);
      } else {
        setStep(4);
        toast.success("Appointment booked successfully!");
      }
    } catch (err: any) {
      console.error(
        "Full error response:",
        JSON.stringify(err?.response?.data, null, 2),
      );
      const data = err?.response?.data;
      const msg =
        typeof data === "object"
          ? Object.entries(data)
              .map(([k, v]) => `${k}: ${v}`)
              .join(" | ")
          : "Booking failed — please try again";
      toast.error(msg);
    } finally {
      setIsBooking(false);
    }
  };
  const resetBooking = () => {
    setStep(1);
    setSelectedDoctor(null);
    setSelectedDate("");
    setSelectedDateLabel("");
    setSelectedTime(null);
    setReason("");
    setAppointmentType("IN_PERSON");
  };

  const safeDate = (apt: Appointment) => {
    const raw = apt.date || apt.appointmentTime;
    if (!raw) return "N/A";
    try {
      return new Date(raw).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return raw;
    }
  };

  const steps = [
    { number: 1, label: "Select Doctor" },
    { number: 2, label: "Choose Time" },
    { number: 3, label: "Confirm" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="PATIENT" />

      <main className="flex-1 lg:ml-[80px] xl:ml-[280px] p-4 md:p-8 pt-20 lg:pt-8 transition-all duration-300">
        {/* ── Header */}
        <header className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-2 mb-1 font-bold text-primary-600 text-sm uppercase tracking-widest">
              <Stethoscope className="h-4 w-4" /> Appointments
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Virtual Care Hub
            </h1>
            <p className="text-slate-500 font-medium italic">
              Book and manage your healthcare appointments
            </p>
          </motion.div>

          {/* Tab switch */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm gap-1"
          >
            <button
              id="tab-book"
              onClick={() => {
                setActiveTab("book");
                resetBooking();
              }}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeTab === "book"
                  ? "bg-primary-600 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-900",
              )}
            >
              <PlusCircle className="h-4 w-4" /> Book
            </button>
            <button
              id="tab-my-appointments"
              onClick={() => setActiveTab("my")}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeTab === "my"
                  ? "bg-primary-600 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-900",
              )}
            >
              <LayoutList className="h-4 w-4" /> My Appointments
            </button>
          </motion.div>
        </header>

        {/* ════════════════════════════════════════
            TAB: MY APPOINTMENTS
        ════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {activeTab === "my" && (
            <motion.div
              key="my-appointments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black text-slate-900">
                    Your Appointments
                  </h3>
                  <button
                    id="btn-refresh-appointments"
                    onClick={fetchMyAppointments}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 text-primary-700 font-bold text-sm hover:bg-primary-100 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" /> Refresh
                  </button>
                </div>

                {loadingMy ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-24 rounded-2xl bg-slate-100 animate-pulse"
                      />
                    ))}
                  </div>
                ) : myAppointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Calendar className="h-16 w-16 text-slate-200 mb-4" />
                    <h4 className="text-xl font-black text-slate-900 mb-2">
                      No appointments yet
                    </h4>
                    <p className="text-slate-500 font-medium mb-6">
                      Book your first consultation using the Book tab
                    </p>
                    <AnimatedButton onClick={() => setActiveTab("book")}>
                      <PlusCircle className="h-4 w-4" /> Book Appointment
                    </AnimatedButton>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {myAppointments.map((apt, i) => (
                        <motion.div
                          key={apt.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <GlassCard className="p-5 border border-slate-200 hover:border-primary-200 hover:shadow-md transition-all">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                              <div className="flex items-start gap-4 flex-1">
                                <div className="h-12 w-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-black text-lg flex-shrink-0">
                                  {apt.doctorName?.charAt(0) || "D"}
                                </div>
                                <div>
                                  <h4 className="font-black text-slate-900">
                                    {apt.doctorName || "Doctor"}
                                  </h4>
                                  {apt.doctorSpecialization && (
                                    <p className="text-xs font-bold text-primary-600 mb-1">
                                      {apt.doctorSpecialization}
                                    </p>
                                  )}
                                  <p className="text-sm text-slate-500 mb-2">
                                    {apt.reason || "Consultation"}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600">
                                    <span className="flex items-center gap-1.5">
                                      <Calendar className="h-3.5 w-3.5 text-primary-600" />
                                      {safeDate(apt)}
                                    </span>
                                    {apt.time && (
                                      <span className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-orange-500" />
                                        {apt.time}
                                      </span>
                                    )}
                                    {apt.appointmentType && (
                                      <span className="flex items-center gap-1.5">
                                        <Video className="h-3.5 w-3.5 text-indigo-500" />
                                        {apt.appointmentType === "TELEMEDICINE"
                                          ? "Virtual"
                                          : "In-Person"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                                <div className="flex flex-col items-end gap-2">
                                  <span
                                    className={cn(
                                      "text-xs font-black uppercase px-3 py-1.5 rounded-lg border",
                                      STATUS_COLORS[apt.status] ||
                                        STATUS_COLORS.PENDING,
                                    )}
                                  >
                                    {apt.status}
                                  </span>
                                  {apt.status === "CONFIRMED" && apt.appointmentType === "TELEMEDICINE" && (
                                    <AnimatedButton 
                                      variant="primary" 
                                      size="sm" 
                                      className="h-9 px-4 text-xs bg-indigo-600 shadow-indigo-500/20"
                                      onClick={() => router.push(`/telemedicine?appointmentId=${apt.id}`)}
                                    >
                                      Join Call
                                    </AnimatedButton>
                                  )}
                                </div>
                            </div>
                          </GlassCard>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}

          {/* ════════════════════════════════════════
              TAB: BOOK — Step indicator
          ════════════════════════════════════════ */}
          {activeTab === "book" && step < 4 && (
            <motion.div
              key="stepper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-4 bg-white p-2 px-4 rounded-2xl border border-slate-200 shadow-sm w-fit mb-8"
            >
              {steps.map((s, i) => (
                <div key={s.number} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black transition-all",
                      step === s.number
                        ? "bg-primary-600 text-white shadow-lg"
                        : step > s.number
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-400",
                    )}
                  >
                    {step > s.number ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      s.number
                    )}
                  </div>
                  <span
                    className={cn(
                      "hidden text-xs font-bold md:block",
                      step >= s.number ? "text-slate-900" : "text-slate-400",
                    )}
                  >
                    {s.label}
                  </span>
                  {i < steps.length - 1 && (
                    <div className="h-[1px] w-4 bg-slate-200" />
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ════════════════════════════════════════
            BOOKING STEPS
        ════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {/* STEP 1 — Select Doctor */}
          {activeTab === "book" && step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.03 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    id="doctor-search"
                    type="text"
                    placeholder="Search by name or specialization..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-bold outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 placeholder:font-normal"
                  />
                </div>
                <button className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  <Filter className="h-5 w-5" /> Filter
                </button>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {loadingDoctors ? (
                  [1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-[380px] w-full bg-slate-100 rounded-3xl animate-pulse"
                    />
                  ))
                ) : doctors.filter(
                    (doc) =>
                      doc.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      doc.specialization
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()),
                  ).length > 0 ? (
                  doctors
                    .filter(
                      (doc) =>
                        doc.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        doc.specialization
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()),
                    )
                    .map((doc, i) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <GlassCard
                          onClick={() => setSelectedDoctor(doc)}
                          className={cn(
                            "group cursor-pointer border-2 transition-all p-0 overflow-hidden",
                            selectedDoctor?.id === doc.id
                              ? "border-primary-500 ring-4 ring-primary-500/10 shadow-xl"
                              : "border-transparent hover:border-primary-200 hover:shadow-lg",
                          )}
                        >
                          <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden relative">
                            <img
                              src={doc.image}
                              alt={doc.name}
                              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="p-5">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-100">
                                {doc.specialization}
                              </span>
                              <div className="flex items-center gap-1 text-xs font-black text-amber-500">
                                <Star className="h-3 w-3 fill-amber-500" />{" "}
                                {doc.rating}
                              </div>
                            </div>
                            <h3 className="text-base font-black text-slate-900 leading-tight mb-1">
                              {doc.name}
                            </h3>
                            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-4 italic">
                              <MapPin className="h-3 w-3" /> {doc.location}
                            </p>
                            <AnimatedButton
                              id={`select-doctor-${doc.id}`}
                              variant={
                                selectedDoctor?.id === doc.id
                                  ? "primary"
                                  : "outline"
                              }
                              className="w-full h-10 text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDoctor(doc);
                                setStep(2);
                              }}
                            >
                              Select Doctor
                            </AnimatedButton>
                          </div>
                        </GlassCard>
                      </motion.div>
                    ))
                ) : (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-slate-500 font-bold italic">
                      No doctors found matching your search.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Pick Date & Time */}
          {activeTab === "book" && step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <button
                id="btn-back-to-doctors"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-sm font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
              >
                <ArrowLeft className="h-4 w-4" /> Change Doctor
              </button>

              {/* Selected doctor preview */}
              {selectedDoctor && (
                <GlassCard className="p-4 flex items-center gap-4 border border-primary-100">
                  <div className="h-12 w-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-black">
                    {selectedDoctor.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary-600 uppercase tracking-widest">
                      {selectedDoctor.specialization}
                    </p>
                    <p className="font-black text-slate-900">
                      {selectedDoctor.name}
                    </p>
                  </div>
                </GlassCard>
              )}

              <div className="grid gap-8 md:grid-cols-2">
                {/* Date picker */}
                <div className="space-y-4">
                  <h3 className="text-xl font-black text-slate-900">
                    Select Date
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {DAYS.map((day) => (
                      <button
                        key={day.value}
                        id={`date-${day.value}`}
                        onClick={() => {
                          setSelectedDate(day.value);
                          setSelectedDateLabel(day.label);
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-95",
                          selectedDate === day.value
                            ? "border-primary-500 bg-primary-50 ring-4 ring-primary-500/5 shadow-md"
                            : "border-slate-100 bg-white hover:border-primary-200",
                        )}
                      >
                        <Calendar
                          className={cn(
                            "h-5 w-5 mb-1.5",
                            selectedDate === day.value
                              ? "text-primary-600"
                              : "text-slate-400",
                          )}
                        />
                        <span
                          className={cn(
                            "text-sm font-black",
                            selectedDate === day.value
                              ? "text-primary-900"
                              : "text-slate-600",
                          )}
                        >
                          {day.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time + extras */}
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 mb-3">
                      Available Slots
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot.value}
                          id={`time-${slot.value}`}
                          onClick={() => setSelectedTime(slot)}
                          className={cn(
                            "py-2.5 rounded-xl border transition-all active:scale-95 text-xs font-black",
                            selectedTime?.value === slot.value
                              ? "bg-primary-600 text-white border-primary-600 shadow"
                              : "bg-white text-slate-500 border-slate-100 hover:border-primary-400",
                          )}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Appointment type */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-2">
                      Type
                    </label>
                    <div className="flex gap-3">
                      {(["IN_PERSON", "TELEMEDICINE"] as const).map((type) => (
                        <button
                          key={type}
                          id={`type-${type}`}
                          onClick={() => setAppointmentType(type)}
                          className={cn(
                            "flex items-center gap-2 flex-1 justify-center py-2.5 rounded-xl border-2 text-sm font-bold transition-all",
                            appointmentType === type
                              ? "border-primary-500 bg-primary-50 text-primary-700"
                              : "border-slate-100 bg-white text-slate-500 hover:border-primary-200",
                          )}
                        >
                          {type === "TELEMEDICINE" ? (
                            <Video className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                          {type === "TELEMEDICINE" ? "Virtual" : "In-Person"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-2">
                      Reason (optional)
                    </label>
                    <input
                      id="appointment-reason"
                      type="text"
                      placeholder="e.g. Follow-up, Headache, Check-up..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 placeholder:font-normal"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <AnimatedButton
                  id="btn-continue-to-confirm"
                  size="xl"
                  className={cn(
                    "px-12",
                    !selectedDate || !selectedTime
                      ? "opacity-50 pointer-events-none"
                      : "",
                  )}
                  onClick={() => setStep(3)}
                >
                  Continue <ChevronRight className="ml-2 h-5 w-5" />
                </AnimatedButton>
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Confirm */}
          {activeTab === "book" && step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-lg mx-auto"
            >
              <GlassCard className="p-10 border-none shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-3xl font-black text-slate-900 mb-8 border-b border-slate-100 pb-6 uppercase tracking-tighter">
                    Confirmation
                  </h3>

                  <div className="space-y-4 mb-10">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-primary-600">
                        <User className="h-7 w-7" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Doctor
                        </div>
                        <div className="text-xl font-black text-slate-900">
                          {selectedDoctor?.name}
                        </div>
                        <div className="text-xs font-bold text-primary-600">
                          {selectedDoctor?.specialization}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                          Date
                        </div>
                        <div className="font-black text-slate-900 text-sm">
                          {selectedDateLabel}
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                          Time
                        </div>
                        <div className="font-black text-slate-900 text-sm">
                          {selectedTime?.label}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-primary-50/50 border border-primary-100 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-primary-700">
                        {appointmentType === "TELEMEDICINE" ? (
                          <Video className="h-5 w-5" />
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                        <span className="text-sm font-black uppercase tracking-widest">
                          {appointmentType === "TELEMEDICINE"
                            ? "Virtual Session"
                            : "In-Person Visit"}
                        </span>
                      </div>
                    </div>

                    {reason && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                          Reason
                        </div>
                        <div className="font-bold text-slate-700 text-sm">
                          {reason}
                        </div>
                      </div>
                    )}
                  </div>

                  <AnimatedButton
                    id="btn-confirm-booking"
                    size="xl"
                    className="w-full h-16 bg-slate-900 text-white shadow-xl shadow-slate-900/20"
                    isLoading={isBooking}
                    onClick={handleBooking}
                  >
                    Confirm &amp; Book Appointment
                  </AnimatedButton>

                  <button
                    id="btn-reschedule"
                    onClick={() => setStep(2)}
                    className="w-full mt-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors"
                  >
                    Reschedule
                  </button>
                </div>
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-500/5 blur-3xl opacity-50" />
              </GlassCard>
            </motion.div>
          )}

          {/* STEP 4 — Success */}
          {activeTab === "book" && step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-lg mx-auto text-center"
            >
              <div className="relative mb-10 inline-block">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="h-32 w-32 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30"
                >
                  <CheckCircle className="h-16 w-16" />
                </motion.div>
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
              </div>

              <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
                Appointment Booked!
              </h2>
              <p className="text-slate-500 text-lg mb-4 font-medium">
                Your appointment with{" "}
                <span className="font-black text-slate-900">
                  {selectedDoctor?.name}
                </span>{" "}
                on{" "}
                <span className="font-black text-slate-900">
                  {selectedDateLabel}
                </span>{" "}
                at{" "}
                <span className="font-black text-slate-900">
                  {selectedTime?.label}
                </span>{" "}
                is confirmed.
              </p>
              <p className="text-slate-400 text-sm mb-10 italic">
                A confirmation email has been sent to{" "}
                <span className="text-primary-600 font-bold">
                  {user?.email}
                </span>
              </p>

              <div className="flex flex-col gap-4">
                <AnimatedButton
                  id="btn-view-my-appointments"
                  size="xl"
                  onClick={() => {
                    setActiveTab("my");
                    fetchMyAppointments();
                  }}
                >
                  <ListChecks className="h-5 w-5" /> View My Appointments
                </AnimatedButton>
                <AnimatedButton
                  id="btn-book-another"
                  variant="outline"
                  size="xl"
                  className="border-slate-200"
                  onClick={resetBooking}
                >
                  <PlusCircle className="h-5 w-5" /> Book Another
                </AnimatedButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
