"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import type React from "react";

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <motion.main
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="flex-1 overflow-hidden"
    >
      {children}
    </motion.main>
  );
}
