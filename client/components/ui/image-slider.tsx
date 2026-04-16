"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ImageSliderProps {
  images: string[];
  interval?: number;
  className?: string;
}

export function ImageSlider({ images, interval = 5000, className }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-slate-900", className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <img
            src={images[currentIndex]}
            alt={`Healthcare Slider ${currentIndex}`}
            className="h-full w-full object-cover"
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/80 via-slate-900/40 to-transparent z-10" />
        </motion.div>
      </AnimatePresence>

      {/* Slide Indicators */}
      <div className="absolute bottom-10 left-12 z-20 flex gap-2">
        {images.map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-1 rounded-full transition-all duration-500",
              index === currentIndex ? "w-8 bg-white" : "w-4 bg-white/30"
            )}
          />
        ))}
      </div>
    </div>
  );
}
