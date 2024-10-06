import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";

function IconButton({
    onClick,
    icon,
    className,
    disabled,
}: {
    onClick: () => void;
    icon: ReactNode;
    className?: string;
    disabled?: boolean;
}) {
    if (disabled) {
        return (
            <motion.button
                whileHover={{ rotateZ: [null, 0.5, -0.5, 0] }}
                transition={{
                    duration: 0.5,
                    times: [0, 0.33, 0.66, 1],
                }}
                className={twMerge(
                    "inline-block aspect-square h-10 cursor-not-allowed rounded-lg border-gray-400 bg-slate-700 text-gray-300",
                    className,
                )}
                disabled
            >
                {icon}
            </motion.button>
        );
    }

    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileFocus={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{
                type: "spring",
                stiffness: 500,
                damping: 20,
            }}
            className={twMerge(
                "inline-block aspect-square h-10 rounded-lg bg-slate-600",
                className,
            )}
            onClick={() => onClick()}
        >
            {icon}
        </motion.button>
    );
}

export default IconButton;
