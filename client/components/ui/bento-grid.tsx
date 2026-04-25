"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Animation variants for the container to stagger children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Animation variants for each grid item
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10,
    },
  },
};

/**
 * Props for the BentoGridShowcase component.
 */
interface BentoGridShowcaseProps {
  integrations: React.ReactNode;
  featureTags: React.ReactNode;
  mainFeature: React.ReactNode;
  secondaryFeature: React.ReactNode;
  statistic: React.ReactNode;
  journey: React.ReactNode;
  className?: string;
}

/**
 * A responsive, animated 3-column bento grid layout component.
 */
export const BentoGridShowcase = ({
  integrations,
  featureTags,
  mainFeature,
  secondaryFeature,
  statistic,
  journey,
  className,
}: BentoGridShowcaseProps) => {
  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className={cn(
        "grid w-full grid-cols-1 gap-6 md:grid-cols-3 md:grid-rows-3 auto-rows-[minmax(250px,auto)]",
        className
      )}
    >
      {/* Slot 1: Integrations (Row 1, Col 1) */}
      <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-1 h-full">
        {integrations}
      </motion.div>

      {/* Slot 2: Main Feature (Row 1-3, Col 2) */}
      <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-3 h-full">
        {mainFeature}
      </motion.div>

      {/* Slot 3: Feature Tags (Row 1, Col 3) */}
      <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-1 h-full">
        {featureTags}
      </motion.div>

      {/* Slot 4: Secondary Feature (Row 2, Col 1) */}
      <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-1 h-full">
        {secondaryFeature}
      </motion.div>

      {/* Slot 5: Statistic (Row 2-3, Col 3) */}
      <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-2 h-full">
        {statistic}
      </motion.div>

      {/* Slot 6: Journey (Row 3, Col 1) */}
      <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-1 h-full">
        {journey}
      </motion.div>
    </motion.section>
  );
};
