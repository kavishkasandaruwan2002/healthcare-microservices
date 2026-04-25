"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ImageSliderProps extends React.HTMLAttributes<HTMLDivElement> {
  images: string[];
  interval?: number;
}

const ImageSlider = React.forwardRef<HTMLDivElement, ImageSliderProps>(
  ({ images, interval = 4000, className, ...props }, ref) => {
    const [currentIndex, setCurrentIndex] = React.useState(0);

    React.useEffect(() => {
      const timer = setInterval(() => {
        setCurrentIndex((prevIndex) =>
          prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
      }, interval);

      return () => clearInterval(timer);
    }, [images, interval]);

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full h-full overflow-hidden bg-slate-900 rounded-l-2xl",
          className
        )}
        {...props}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <img
              src={images[currentIndex]}
              alt={`Clinical Showcase ${currentIndex + 1}`}
              className="h-full w-full object-cover brightness-[0.85] contrast-[1.05]"
            />
            {/* Elegant Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary-950/40 via-transparent to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Futuristic Pagination */}
        <div className="absolute bottom-10 left-12 flex gap-3 z-20">
            {images.map((_, index) => (
                <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className="group relative h-1.5 overflow-hidden rounded-full bg-white/20 transition-all focus:outline-none"
                    style={{ width: currentIndex === index ? '48px' : '16px' }}
                    aria-label={`Go to slide ${index + 1}`}
                >
                    <div 
                      className={cn(
                        "absolute inset-0 bg-white transition-transform duration-[4000ms] ease-linear origin-left",
                        currentIndex === index ? "scale-x-100" : "scale-x-0"
                      )}
                    />
                </button>
            ))}
        </div>

        {/* Branding Accent */}
        <div className="absolute top-12 left-12 z-20">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                <div className="h-2 w-2 rounded-full bg-primary-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Clinical Innovation</span>
            </div>
        </div>
      </div>
    );
  }
);

ImageSlider.displayName = "ImageSlider";

export { ImageSlider };
