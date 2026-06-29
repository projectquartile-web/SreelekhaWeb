"use client";

import React from "react";
import { motion } from "framer-motion";
import { theme } from "@/lib/theme";

interface AnimatedRevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  yOffset?: number;
}

export default function AnimatedReveal({
  children,
  delay = 0,
  className = "",
  yOffset = 30,
}: AnimatedRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        ...theme.animations.springDefault,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
