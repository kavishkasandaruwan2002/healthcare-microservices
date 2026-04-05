"use client";

import { PulseFitHero } from "@/components/ui/pulse-fit-hero";
import { useRouter } from "next/navigation";

export default function PulseFitHeroDemo() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen">
      <PulseFitHero
        logo="HealthPulse"
        navigation={[
          { label: "Find Doctors", onClick: () => router.push("/patient/dashboard") },
          { label: "Specialties", hasDropdown: true, onClick: () => console.log("Specialties") },
          { label: "Telemedicine", onClick: () => router.push("/telemedicine") },
          { label: "Insurance", onClick: () => console.log("Insurance") },
          { label: "Support", onClick: () => console.log("Support") },
        ]}
        ctaButton={{
          label: "Book Appointment",
          onClick: () => router.push("/patient/appointments"),
        }}
        title="Predictive Care. Personalized Health."
        subtitle="Experience the future of healthcare with our AI-powered platform. Guided diagnostics, instant virtual consultations, and holistic health tracking tailored to your lifestyle."
        primaryAction={{
          label: "Start Journey",
          onClick: () => router.push("/register"),
        }}
        secondaryAction={{
          label: "Meet Specialists",
          onClick: () => router.push("/login"),
        }}
        disclaimer="*Verified by Board-Certified Professionals"
        socialProof={{
          avatars: [
            "https://images.unsplash.com/photo-1559839734-2b71f1536783?w=150&h=150&fit=crop", // Specialist 1
            "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop", // Specialist 2
            "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=150&h=150&fit=crop", // Specialist 3
            "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop", // Specialist 4
          ],
          text: "Trusted by 50,000+ Active Patients",
        }}
        programs={[
          {
            image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=500&fit=crop",
            category: "TELEMEDICINE",
            title: "24/7 Virtual Consultation",
            onClick: () => router.push("/telemedicine"),
          },
          {
            image: "https://images.unsplash.com/photo-1530490125459-847a6d437825?w=400&h=500&fit=crop", // Diagnostics
            category: "DIAGNOSTICS",
            title: "AI Symptom Analysis",
            onClick: () => console.log("Diagnostics"),
          },
          {
            image: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&h=500&fit=crop",
            category: "WELLNESS",
            title: "Holistic Health Tracking",
            onClick: () => console.log("Wellness"),
          },
          {
            image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=500&fit=crop",
            category: "PREVENTIVE",
            title: "Early Warning Systems",
            onClick: () => console.log("Preventive"),
          },
          {
            image: "https://images.unsplash.com/photo-1551076805-e1869033e561?w=400&h=500&fit=crop",
            category: "SPECIALIZED",
            title: "Cardiovascular Focus",
            onClick: () => console.log("Specialized"),
          },
        ]}
      />
    </div>
  );
}
