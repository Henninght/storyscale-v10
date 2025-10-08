"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface WizardStepTransitionProps {
  step: number;
  children: ReactNode;
}

export function WizardStepTransition({ step, children }: WizardStepTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
