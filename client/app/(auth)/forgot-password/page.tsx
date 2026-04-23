"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ImageSlider } from "@/components/ui/image-slider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { HeartPulse, Mail, ArrowRight, ShieldAlert, ArrowLeft, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const images = [
    "https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=1200&auto=format&fit=crop&q=80",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
        toast.error("Please enter your email address");
        return;
    }
    
    setLoading(true);
    // Simulate API call for password reset
    setTimeout(() => {
        setLoading(false);
        setSubmitted(true);
        toast.success("Recovery link dispatched securely.");
    }, 1500);
  };

  if (!mounted) return null;

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <motion.div 
        className="w-full max-w-6xl h-[650px] grid grid-cols-1 lg:grid-cols-2 rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-white bg-white"
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
                <div className="flex items-center gap-2 mb-4 text-rose-400">
                    <ShieldAlert className="h-5 w-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Security First</span>
                </div>
                <h4 className="text-xl font-bold text-white mb-2 leading-tight">Recover Your Key</h4>
                <p className="text-xs text-white/60 leading-relaxed font-medium">To maintain medical data integrity, verification is required for all access key resets.</p>
            </div>
          </motion.div>
        </div>

        {/* Right side: Modern Auth Form */}
        <div className="relative flex items-center justify-center p-8 md:p-16 bg-white">
          <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-rose-500/5 blur-[100px]" />
          <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-accent-500/5 blur-[100px]" />

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

            {!submitted ? (
                <>
                    <motion.div variants={itemVariants}>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">
                            Forgot Key?
                        </h1>
                        <p className="text-slate-500 font-medium mb-10">
                            Enter the email associated with your account, and we'll send you a secure link to reset your access key.
                        </p>
                    </motion.div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <motion.div variants={itemVariants} className="space-y-3">
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
                        </motion.div>
                        
                        <motion.div variants={itemVariants}>
                            <Button type="submit" className="w-full mt-4 group bg-slate-900 hover:bg-slate-800 text-white" disabled={loading}>
                                {loading ? "Verifying..." : "Send Reset Link"}
                                {!loading && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
                            </Button>
                        </motion.div>
                    </form>
                </>
            ) : (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center py-8"
                >
                    <div className="w-20 h-20 mb-6 bg-emerald-50 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-4">Secure Link Sent</h2>
                    <p className="text-slate-500 font-medium mb-8">
                        We've securely dispatched instructions to <span className="text-slate-900 font-bold">{email}</span>. Please check your inbox and spam folder.
                    </p>
                    <Button 
                        variant="outline" 
                        onClick={() => router.push('/login')} 
                        className="w-full group"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Return to Authentication
                    </Button>
                </motion.div>
            )}

            {!submitted && (
                <motion.p variants={itemVariants} className="text-center mt-10 text-sm font-medium text-slate-400">
                Remembered your key?{" "}
                <Link href="/login" className="text-primary-600 font-bold hover:text-primary-700 transition-colors">
                    Return to the login portal.
                </Link>
                </motion.p>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
