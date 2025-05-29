"use client";

import type { PropsWithChildren } from "react";
import React from "react";
import { motion } from "motion/react";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends PropsWithChildren {
    disabled?: boolean;
    className?: string;
    onClick?: () => void;
}

export default function Button({
    children,
    disabled,
    className,
    onClick,
}: ButtonProps) {
    return (
        <motion.button
            whileHover={
                disabled ? { rotateZ: [null, 0.5, -0.5, 0] } : { scale: 1.02 }
            }
            whileFocus={disabled ? undefined : { scale: 1.02 }}
            whileTap={disabled ? undefined : { scale: 0.98 }}
            transition={
                disabled
                    ? {
                          duration: 0.5,
                          times: [0, 0.33, 0.66, 1],
                      }
                    : {
                          type: "spring",
                          stiffness: 500,
                          damping: 20,
                      }
            }
            className={twMerge(
                disabled
                    ? "inline-block cursor-not-allowed rounded-lg border-gray-400 bg-slate-700 p-3 text-gray-300"
                    : "inline-block cursor-pointer rounded-lg bg-slate-600 p-3 text-white",
                className,
            )}
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
        >
            {children}
        </motion.button>
    );
}
