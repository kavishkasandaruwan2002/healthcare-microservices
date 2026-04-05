"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PatientAppointments() {
    const [appointments, setAppointments] = useState([
        { id: 1, doctorName: 'Dr. Sarah Connor', specialty: 'Cardiologist', date: '2026-04-10', time: '10:30 AM', status: 'CONFIRMED' },
        { id: 2, doctorName: 'Dr. Bruce Wayne', specialty: 'Neurologist', date: '2026-04-15', time: '02:00 PM', status: 'PENDING' },
    ]);

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto"
            >
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                            My Appointments
                        </h1>
                        <p className="text-slate-400 mt-2">Manage your healthcare schedule with ease.</p>
                    </div>
                    <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                        + New Appointment
                    </button>
                </div>

                <div className="grid gap-6">
                    {appointments.map((app, index) => (
                        <motion.div 
                            key={app.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-center justify-between hover:bg-slate-800/50 transition-all group"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-blue-900/30 rounded-xl flex items-center justify-center border border-blue-500/30">
                                    <User className="text-blue-400" size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold">{app.doctorName}</h3>
                                    <p className="text-blue-400 text-sm">{app.specialty}</p>
                                </div>
                            </div>

                            <div className="flex gap-12 items-center">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <Calendar size={16} />
                                        <span>{app.date}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <Clock size={16} />
                                        <span>{app.time}</span>
                                    </div>
                                </div>

                                <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${
                                    app.status === 'CONFIRMED' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                                }`}>
                                    {app.status}
                                </div>

                                <button className="p-3 bg-slate-800 rounded-lg group-hover:bg-blue-600 transition-colors">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* AI Suggestion Section */}
                <div className="mt-16 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 p-8 rounded-3xl relative overflow-hidden backdrop-blur-xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <AlertCircle size={120} className="text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <span className="bg-indigo-500 p-1.5 rounded-lg">AI</span> Smart Scheduler
                    </h2>
                    <p className="text-indigo-300/80 mt-2 max-w-xl">
                        Based on your history and Dr. Sarah's load, we recommend a follow-up on <span className="text-white font-bold underline decoration-indigo-500">April 12 at 09:00 AM</span>.
                    </p>
                    <button className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all text-sm font-bold">
                        Accept Suggestion
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
