"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import api from '@/services/api';
import { ImageSlider } from "@/components/ui/image-slider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { 
  User, 
  Mail, 
  Lock, 
  ArrowRight, 
  Stethoscope, 
  ShieldAlert, 
  ArrowLeft,
  HeartPulse,
  UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'PATIENT'
  });
  const [loading, setLoading] = useState(false);

  const images = [
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1504813184591-01592f2bb94f?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1551076805-e1869033e561?w=1200&auto=format&fit=crop&q=80",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (role: string) => {
    setFormData({ ...formData, role });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/patients/register', formData);
      toast.success('Account created! Initializing your portal...');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'PATIENT', label: 'Patient', icon: <User className="h-5 w-5" />, desc: 'Personal Care' },
    { id: 'DOCTOR', label: 'Doctor', icon: <Stethoscope className="h-5 w-5" />, desc: 'Specialist' },
    { id: 'ADMIN', label: 'Admin', icon: <ShieldAlert className="h-5 w-5" />, desc: 'System Mgmt' },
  ];

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
        className="w-full max-w-6xl h-[800px] grid grid-cols-1 lg:grid-cols-2 rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-white bg-white"
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Left side: Community & Care Image Slider */}
        <div className="hidden lg:block relative">
          <ImageSlider images={images} interval={5000} />
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute top-1/2 left-12 -translate-y-1/2 z-20 max-w-sm"
          >
            <div className="p-8 rounded-[2rem] bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl">
              <div className="h-14 w-14 rounded-2xl bg-primary-600 flex items-center justify-center mb-6 shadow-lg shadow-primary-600/30">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
                Embrace the Future <br /> of Wellness.
              </h2>
              <p className="text-primary-50/80 text-sm font-medium mt-4 leading-relaxed">
                Connect with the world's most advanced healthcare network and take control of your journey today.
              </p>
            </div>
          </motion.div>

          <div className="absolute bottom-12 right-12 z-20">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60">
                Join 250,000+ members worldwide
              </p>
          </div>
        </div>

        {/* Right side: Modern High-Fidelity Registration Form */}
        <div className="w-full h-full bg-white flex flex-col items-center justify-start p-10 lg:p-16 relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute -top-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-primary-500/5 blur-[100px]" />

          <motion.div 
            className="w-full max-w-md relative z-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/20">
                        <HeartPulse className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">HealthPulse</span>
                </div>
                <Link href="/" className="text-sm font-bold text-slate-400 hover:text-primary-600 transition-colors flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" /> Home
                </Link>
            </motion.div>

            <motion.div variants={itemVariants}>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">
                  Initialize Account.
                </h1>
                <p className="text-slate-500 text-sm font-medium mb-8">
                  Begin your medical transformation. Choose your role below.
                </p>
            </motion.div>

            {/* Premium Role Selector */}
            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3 mb-8">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleSelect(role.id)}
                    className={cn(
                      "group relative flex flex-col items-center justify-center rounded-2xl border-2 p-3 py-4 transition-all duration-300",
                      formData.role === role.id 
                        ? "border-primary-600 bg-primary-50/50 shadow-sm" 
                        : "border-slate-100 bg-white hover:border-slate-200"
                    )}
                  >
                    <div className={cn(
                      "mb-2 flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                      formData.role === role.id ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
                    )}>
                      {role.icon}
                    </div>
                    <span className={cn("text-[10px] items-center text-center font-black uppercase tracking-wider", formData.role === role.id ? "text-primary-900" : "text-slate-500")}>
                      {role.label}
                    </span>
                    {formData.role === role.id && (
                        <motion.div 
                            layoutId="role-active"
                            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary-600 border-2 border-white"
                        />
                    )}
                  </button>
                ))}
            </motion.div>

            <motion.form variants={itemVariants} onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                  <Input 
                    id="name" 
                    name="name"
                    type="text" 
                    className="pl-12"
                    placeholder="Doctor Julian Smith" 
                    value={formData.name}
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                  <Input 
                    id="email" 
                    name="email"
                    type="email" 
                    className="pl-12"
                    placeholder="dr.smith@healthpulse.ai" 
                    value={formData.email}
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Access Key</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                  <Input 
                    id="password" 
                    name="password"
                    type="password" 
                    className="pl-12"
                    placeholder="••••••••" 
                    value={formData.password}
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full mt-4 group" disabled={loading}>
                {loading ? "Initializing..." : "Create Secure Account"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
              </Button>
            </motion.form>

            <motion.p variants={itemVariants} className="text-center text-sm font-medium text-slate-500 mt-8">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-primary-600 hover:text-primary-700 transition-colors">
                Sign in
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
