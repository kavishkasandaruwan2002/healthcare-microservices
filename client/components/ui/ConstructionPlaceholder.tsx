"use client";

import { motion } from 'framer-motion';
import { Hammer, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface ConstructionPlaceholderProps {
  title: string;
  description?: string;
}

export default function ConstructionPlaceholder({ 
  title, 
  description = "Our engineering team is currently crafting this experience. Check back soon for the full release." 
}: ConstructionPlaceholderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center bg-white/50 backdrop-blur-sm rounded-[2.5rem] border border-slate-100 shadow-xl">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="mb-8"
      >
        <div className="h-24 w-24 rounded-3xl bg-primary-50 flex items-center justify-center relative overflow-hidden group">
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <Hammer className="h-12 w-12 text-primary-600 relative z-10" />
          </motion.div>
          <div className="absolute inset-0 bg-primary-500/10 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-full" />
        </div>
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-4xl font-black text-slate-900 mb-4 tracking-tight"
      >
        {title} <span className="text-primary-600">.</span>
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-slate-500 max-w-md mb-10 font-medium leading-relaxed"
      >
        {description}
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex gap-4"
      >
        <Button onClick={() => router.back()} variant="outline" className="rounded-2xl px-8">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
        <Button onClick={() => router.push('/')} className="rounded-2xl px-8 shadow-lg shadow-primary-600/20">
          <Home className="mr-2 h-4 w-4" /> Dashboard
        </Button>
      </motion.div>
    </div>
  );
}
