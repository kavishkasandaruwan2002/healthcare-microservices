import Link from "next/link";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { GlassCard } from "@/components/ui/GlassCard";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-100 via-slate-50 to-slate-50">
      <GlassCard className="max-w-2xl text-center space-y-8 py-16">
        <h1 className="text-6xl font-black text-slate-900 tracking-tighter">
          Medi<span className="text-primary-600">Sync</span>
        </h1>
        <p className="text-xl text-slate-500 font-medium leading-relaxed">
          The future of healthcare is here. Seamless telemedicine, 
          secure payments, and integrated care management.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/patient/dashboard">
            <AnimatedButton size="lg" className="w-full sm:w-auto">
              Patient Portal
            </AnimatedButton>
          </Link>
          <Link href="/doctor/dashboard">
            <AnimatedButton variant="secondary" size="lg" className="w-full sm:w-auto">
              Doctor Console
            </AnimatedButton>
          </Link>
        </div>
      </GlassCard>
    </main>
  );
}
