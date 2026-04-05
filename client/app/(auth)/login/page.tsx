"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { ImageSlider } from "@/components/ui/image-slider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Globe, Apple, ArrowRight, ShieldCheck, HeartPulse, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const setLogin = useAuthStore(state => state.login);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const images = [
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=1200&auto=format&fit=crop&q=80",
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/patients/login', { email, password });
      const { token, user } = res.data;
      setLogin(user, token);
      toast.success('Welcome back to HealthCare!');
      
      const role = user.role?.toUpperCase() || '';
      if (role.includes('PATIENT')) router.push('/patient/dashboard');
      else if (role.includes('DOCTOR')) router.push('/doctor/dashboard');
      else if (role.includes('ADMIN')) router.push('/admin/dashboard');
      else router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants: any = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 14,
      },
    },
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <motion.div 
        className="w-full max-w-6xl h-[750px] grid grid-cols-1 lg:grid-cols-2 rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-white bg-white"
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Left side: Premium Image Slider Showcase */}
        <div className="hidden lg:block relative">
          <ImageSlider images={images} interval={4500} />
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute top-1/2 left-12 -translate-y-1/2 z-20 max-w-sm"
          >
            <div className="p-8 rounded-[2rem] bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl">
              <div className="h-14 w-14 rounded-2xl bg-primary-600 flex items-center justify-center mb-6 shadow-lg shadow-primary-600/30">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
                Your Health, <br /> Securely Managed.
              </h2>
              <p className="text-primary-50/80 text-sm font-medium mt-4 leading-relaxed">
                Experience the next generation of clinical data management with military-grade encryption.
              </p>
            </div>
          </motion.div>

          <div className="absolute bottom-12 right-12 z-20 flex items-center gap-4">
              <div className="flex -space-x-3">
                  {[1,2,3].map(i => (
                      <div key={i} className="h-10 w-10 rounded-full border-2 border-primary-900 bg-slate-800" />
                  ))}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60">
                Trusted by 1.2K+ Specialists
              </p>
          </div>
        </div>

        {/* Right side: Authentication Form */}
        <div className="w-full h-full bg-white flex flex-col items-center justify-center p-12 lg:p-20 relative overflow-hidden">
          <div className="absolute -top-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-primary-500/5 blur-[100px]" />
          <div className="absolute -bottom-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-accent-500/5 blur-[100px]" />

          <motion.div 
            className="w-full max-w-md relative z-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-10">
                <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/20">
                    <HeartPulse className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-black tracking-tighter text-slate-900 uppercase">HealthPulse</span>
            </motion.div>

            <motion.div variants={itemVariants}>
                <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">
                  Welcome Back.
                </h1>
                <p className="text-slate-500 font-medium mb-10">
                  Access your personalized health dashboard and consult with your specialists.
                </p>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 mb-8">
              <Button variant="outline" type="button" className="w-full group">
                <Globe className="mr-3 h-5 w-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
                Google
              </Button>
              <Button variant="outline" type="button" className="w-full group">
                <Apple className="mr-3 h-5 w-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                Apple
              </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                <span className="bg-white px-4 text-slate-400">
                  Secure Credentials
                </span>
              </div>
            </motion.div>

            <motion.form variants={itemVariants} onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                  <Input 
                    id="email" 
                    type="email" 
                    className="pl-12"
                    placeholder="dr.smith@healthpulse.ai" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-3">
                 <div className="flex items-center justify-between">
                    <Label htmlFor="password">Security Key</Label>
                    <Link href="#" className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors underline-offset-4 hover:underline">
                        Forgot Key?
                    </Link>
                 </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                  <Input 
                    id="password" 
                    type="password" 
                    className="pl-12"
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full mt-4 group" disabled={loading}>
                {loading ? "Authenticating..." : "Authenticate Securely"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
              </Button>
            </motion.form>

            <motion.p variants={itemVariants} className="text-center text-sm font-medium text-slate-500 mt-10">
              New to HealthPulse?{" "}
              <Link href="/register" className="font-bold text-primary-600 hover:text-primary-700 transition-colors">
                Initialize Account
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
