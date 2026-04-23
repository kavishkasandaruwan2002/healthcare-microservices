"use client";

import { useState, useEffect } from 'react';
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
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const { login: setLogin, isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('PATIENT'); // PATIENT, DOCTOR, ADMIN
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated && user) {
      const userRole = user.role?.toUpperCase() || '';
      console.log("Current authenticated role:", userRole);
      if (userRole.includes('ADMIN')) router.push('/admin/dashboard');
      else if (userRole.includes('DOCTOR')) router.push('/doctor/dashboard');
      else if (userRole.includes('PATIENT')) router.push('/patient/dashboard');
    }
  }, [isAuthenticated, user, router, mounted]);

  const images = [
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1551076805-e1869033e561?w=1200&auto=format&fit=crop&q=80",
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Choose endpoint based on selected role
      const endpoint = role === 'DOCTOR' ? '/doctors/login' : '/patients/login';
      console.log(`Attempting login for ${role} at ${endpoint}`);
      
      const res = await api.post(endpoint, { email, password });
      
      // Normalize response structure (patient returns 'user', doctor returns 'doctor')
      const token = res.data.token;
      const userData = res.data.user || res.data.doctor;
      
      if (!userData) {
        console.error("Auth response missing user data:", res.data);
        throw new Error("User data not found in server response");
      }
      
      // Ensure role is preserved if not present in normalized data
      if (!userData.role) userData.role = role === 'ADMIN' ? 'ROLE_ADMIN' : role === 'DOCTOR' ? 'ROLE_DOCTOR' : 'ROLE_PATIENT';
      
      setLogin(userData, token);
      toast.success('Authentication successful!');
      
      const userRole = (userData.role || '').toUpperCase();
      if (userRole.includes('ADMIN')) router.push('/admin/dashboard');
      else if (userRole.includes('DOCTOR')) router.push('/doctor/dashboard');
      else if (userRole.includes('PATIENT')) router.push('/patient/dashboard');
      else router.push('/');
    } catch (err: any) {
      console.error("Login Error:", err);
      const errorMsg = err.response?.data?.message || err.message || 'Invalid email or password';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <motion.div 
        className="w-full max-w-6xl h-[750px] grid grid-cols-1 lg:grid-cols-2 rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-white bg-white"
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Left side: Premium Image Slider Showcase */}
        <div className="hidden lg:block relative">
          <ImageSlider images={images} interval={4500} />
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute top-12 left-12 z-20"
          >
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-[2rem] max-w-xs shadow-2xl">
                <div className="flex items-center gap-2 mb-4 text-emerald-400">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Trust Assurance</span>
                </div>
                <h4 className="text-xl font-bold text-white mb-2 leading-tight">ISO 27001 Certified Health Platform</h4>
                <p className="text-xs text-white/60 leading-relaxed font-medium">Your medical records are encrypted with military-grade AES-256 protocols.</p>
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

        {/* Right side: Modern Auth Form */}
        <div className="relative flex items-center justify-center p-8 md:p-16 bg-white">
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
                  Select your role and authenticate to access your specialized healthcare portal.
                </p>
            </motion.div>

            {/* Role Toggle */}
            <motion.div variants={itemVariants} className="flex p-1 bg-slate-100 rounded-2xl mb-8">
              {['PATIENT', 'DOCTOR', 'ADMIN'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all",
                    role === r 
                      ? "bg-white text-primary-600 shadow-sm" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {r}
                </button>
              ))}
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 mb-8">
              <Button variant="outline" type="button" className="w-full group">
                <Globe className="mr-3 h-5 w-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
                <span className="text-xs font-bold uppercase tracking-wider">Web Portal</span>
              </Button>
              <Button variant="outline" type="button" className="w-full group">
                <Apple className="mr-3 h-5 w-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
                <span className="text-xs font-bold uppercase tracking-wider">iOS App</span>
              </Button>
            </motion.div>

            <form onSubmit={handleLogin} className="space-y-6">
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
                    <Link href="/forgot-password" className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors underline-offset-4 hover:underline">
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
            </form>

            <motion.p variants={itemVariants} className="text-center mt-10 text-sm font-medium text-slate-400">
              New to HealthPulse?{" "}
              <Link href="/register" className="text-primary-600 font-bold hover:text-primary-700 transition-colors">
                Create Secure Account
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
