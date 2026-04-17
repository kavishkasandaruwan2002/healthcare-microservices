"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React from "react";

interface BentoGridShowcaseProps {
  integrations: React.ReactNode;
  featureTags: React.ReactNode;
  mainFeature: React.ReactNode;
  secondaryFeature: React.ReactNode;
  statistic: React.ReactNode;
  journey: React.ReactNode;
  className?: string;
}

export function BentoGridShowcase({
  integrations,
  featureTags,
  mainFeature,
  secondaryFeature,
  statistic,
  journey,
  className,
}: BentoGridShowcaseProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-6 auto-rows-[280px] md:auto-rows-auto",
        className
      )}
    >
      {/* Main Feature - Takes up 2x2 space */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="md:col-span-2 md:row-span-2"
      >
        {mainFeature}
      </motion.div>

      {/* Integrations - Takes up 2x1 */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        viewport={{ once: true }}
        className="md:col-span-2 md:row-span-1"
      >
        {integrations}
      </motion.div>

      {/* Feature Tags - Takes up 1x1 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        viewport={{ once: true }}
        className="md:col-span-1 md:row-span-1"
      >
        {featureTags}
      </motion.div>

      {/* Statistic - Takes up 1x2 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        viewport={{ once: true }}
        className="md:col-span-1 md:row-span-2"
      >
        {statistic}
      </motion.div>

      {/* Secondary Feature - Takes up 2x1 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        viewport={{ once: true }}
        className="md:col-span-2 md:row-span-1"
      >
        {secondaryFeature}
      </motion.div>

      {/* Journey - Takes up 1x1 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        viewport={{ once: true }}
        className="md:col-span-1 md:row-span-1"
      >
        {journey}
      </motion.div>
    </div>
  );
}

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto ",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "row-span-1 rounded-3xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-4 dark:bg-black dark:border-white/[0.2] bg-white border border-transparent justify-between flex flex-col space-y-4",
        className
      )}
    >
      {header}
      <div className="group-hover/bento:translate-x-2 transition duration-200">
        {icon}
        <div className="font-sans font-bold text-neutral-600 dark:text-neutral-200 mb-2 mt-2">
          {title}
        </div>
        <div className="font-sans font-normal text-neutral-600 text-xs dark:text-neutral-300">
          {description}
        </div>
      </div>
    </div>
  );
};
