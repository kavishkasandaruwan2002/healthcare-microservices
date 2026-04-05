"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { BentoGridShowcase } from "@/components/ui/bento-grid";
import {
  Calendar,
  HeartPulse,
  Plus,
  Slack,
  Zap,
  Activity,
  ShieldCheck,
  BrainCircuit,
} from "lucide-react";
import { motion } from "framer-motion";

// --- Demo Content Components ---

const IntegrationsCard = () => (
  <Card className="h-full border-primary-100 bg-primary-50/10">
    <CardHeader>
      <CardTitle className="text-xl">Smart Integrations</CardTitle>
      <CardDescription>
        Connect your health data with wearable devices and clinical systems.
      </CardDescription>
    </CardHeader>
    <CardContent className="flex items-center justify-center gap-6 py-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform hover:scale-110">
        <Activity className="h-7 w-7 text-primary-600" />
      </div>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform hover:scale-110">
        <ShieldCheck className="h-7 w-7 text-emerald-600" />
      </div>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform hover:scale-110">
        <BrainCircuit className="h-7 w-7 text-purple-600" />
      </div>
    </CardContent>
  </Card>
);

const FeatureTagsCard = () => (
  <Card className="h-full">
    <CardContent className="flex h-full flex-col justify-center gap-4 p-8">
      <Badge
        variant="outline"
        className="w-fit items-center gap-2 border-primary-200 py-2 px-4 text-xs font-bold text-primary-700 backdrop-blur-sm"
      >
        AI-Powered Diagnosis <Plus className="h-3 w-3" />
      </Badge>
      <Badge
        variant="secondary"
        className="w-fit items-center gap-2 bg-primary-100 py-2 px-4 text-xs font-bold text-primary-700 hover:bg-primary-200 uppercase tracking-widest"
      >
        Predictive Analytics
      </Badge>
      <Badge
        variant="outline"
        className="w-fit items-center gap-2 border-indigo-200 py-2 px-4 text-xs font-bold text-indigo-700 backdrop-blur-sm"
      >
        Real-time Insights <Plus className="h-3 w-3" />
      </Badge>
    </CardContent>
  </Card>
);

const MainFeatureCard = () => (
  <Card className="relative h-full w-full overflow-hidden group">
    <div className="absolute top-6 left-6 z-20 rounded-2xl bg-white/70 p-4 backdrop-blur-xl border border-white/50 shadow-xl">
      <p className="text-2xl font-black tracking-tight text-slate-900">Virtual Care Expert</p>
      <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mt-1">Specialized diagnostics</p>
    </div>
    <img
      src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&h=1200&fit=crop"
      alt="Modern medical diagnostic laboratory"
      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none" />
  </Card>
);

const StatCard = () => (
  <Card className="flex h-full flex-col justify-between bg-primary-600 p-8 text-white">
    <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
      <HeartPulse className="h-8 w-8 text-white" />
    </div>
    <div className="mt-8">
      <p className="text-7xl font-black tracking-tighter">99.2%</p>
      <p className="text-sm font-medium text-primary-100 leading-relaxed mt-4">
        Patient satisfaction and accuracy across our global network of diagnostic specialists.
      </p>
    </div>
  </Card>
);

const SecondaryFeatureCard = () => (
  <Card className="relative h-full w-full overflow-hidden group">
    <img
      src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&h=600&fit=crop"
      alt="Friendly modern clinician"
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-primary-950/80 via-transparent to-transparent pointer-events-none" />
    <p className="absolute bottom-8 left-8 z-10 max-w-[85%] text-2xl font-black text-white leading-tight">
      Empowering the next generation of patient care.
    </p>
  </Card>
);

const JourneyCard = () => (
  <Card className="relative h-full w-full overflow-hidden p-8 bg-slate-50">
    <div className="relative z-10">
      <CardTitle className="text-xl">Seamless Transitions</CardTitle>
      <CardDescription className="text-slate-500 text-sm mt-2 max-w-[70%]">
        Mapping clinical workflows to patient outcomes within weeks, not months.
      </CardDescription>
    </div>
    {/* Avatar constellation */}
    <div className="absolute right-0 bottom-0 h-40 w-40 opacity-60">
      <div className="absolute top-4 left-16 animate-bounce" style={{ animationDuration: '3s' }}>
        <Avatar className="h-14 w-14 border-4 border-white shadow-2xl">
          <AvatarImage src="https://images.unsplash.com/photo-1559839734-2b71f1536783" />
          <AvatarFallback>DR</AvatarFallback>
        </Avatar>
      </div>
      <div className="absolute top-20 left-4 animate-bounce" style={{ animationDuration: '4s' }}>
        <Avatar className="h-12 w-12 border-4 border-white shadow-xl">
          <AvatarImage src="https://images.unsplash.com/photo-1594824476967-48c8b964273f" />
          <AvatarFallback>PT</AvatarFallback>
        </Avatar>
      </div>
    </div>
  </Card>
);

export default function BentoGridShowcaseDemo() {
  return (
    <div className="min-h-screen bg-slate-50/50 py-20 px-6">
      <div className="container mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <Badge variant="secondary" className="mb-6 px-6 py-2 rounded-full border-primary-100 bg-primary-50 text-primary-700 font-black tracking-[0.2em] uppercase text-[10px]">
            Future of Care
          </Badge>
          <h1 className="text-5xl font-black tracking-tight text-slate-900 md:text-7xl">
            Virtual Medical Care
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-medium text-slate-500 md:text-xl">
            A full range of futuristic solutions to effectively enhance <br className="hidden md:block" /> and automate your clinical care journey.
          </p>
        </motion.div>

        <BentoGridShowcase
          integrations={<IntegrationsCard />}
          featureTags={<FeatureTagsCard />}
          mainFeature={<MainFeatureCard />}
          secondaryFeature={<SecondaryFeatureCard />}
          statistic={<StatCard />}
          journey={<JourneyCard />}
        />
      </div>
    </div>
  );
}
