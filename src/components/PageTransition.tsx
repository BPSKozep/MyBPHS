"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function PageTransition({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    useEffect(() => {
        console.log(pathname);
    }, [pathname]);

    return (
        <motion.main
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="h-full w-full"
        >
            {children}
        </motion.main>
    );
}
