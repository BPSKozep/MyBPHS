"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { motion } from "motion/react";
import type { ObjectValues } from "@/utils/types";
import { FaCheck } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import sleep from "@/utils/sleep";
import { twMerge } from "tailwind-merge";

const COLORS = {
    DEFAULT: "#565e85",
    PENDING: "var(--sky-600)",
    SUCCESS: "var(--green-500)",
    ERROR: "var(--red-700)",
} as const;

function LoadingIcon() {
    return (
        <motion.div
            className="aspect-square h-3 rounded-full bg-white"
            animate={{
                scale: [1, 1.6, 1],
            }}
            transition={{
                duration: 0.8,
                repeat: Infinity,
                repeatDelay: 0.5,
            }}
        ></motion.div>
    );
}

export default function IconSubmitButton({
    onClick,
    icon,
    className,
    disabled,
}: {
    onClick: () => Promise<boolean> | boolean;
    icon: ReactNode;
    className?: string;
    disabled?: boolean;
}) {
    const [isPressed, setIsPressed] = useState(false);
    const [buttonRotation, setButtonRotation] = useState(0);
    const [buttonColor, setButtonColor] = useState<ObjectValues<typeof COLORS>>(
        COLORS.DEFAULT,
    );
    const [currentIcon, setCurrentIcon] = useState<ReactNode>(icon);

    return (
        <motion.button
            className={twMerge(
                "h-12 w-12 cursor-pointer rounded-2xl p-3 text-white disabled:opacity-50",
                className,
            )}
            initial={{
                scale: 1,
                backgroundColor: COLORS.DEFAULT,
            }}
            animate={{
                scale: isPressed ? 1.2 : 1,
                backgroundColor: buttonColor,
                rotate: buttonRotation,
            }}
            transition={{
                /* FIXED: Temporarily (19 months) disable spring, see: https://github.com/framer/motion/issues/2369 🙏🙏🙏 */
                scale: {
                    type: "spring",
                    damping: 9,
                    stiffness: 200,
                },
                rotate: {
                    type: "spring",
                    damping: 20,
                    stiffness: 300,
                },
            }}
            whileHover={{
                backgroundColor: isPressed ? buttonColor : "#3a445d",
            }}
            onClick={async () => {
                if (isPressed || disabled) return;

                setIsPressed(true);

                setButtonRotation((rotation) => rotation + 45);
                setButtonColor(COLORS.PENDING);
                setCurrentIcon(<LoadingIcon />);

                const result = await onClick();

                if (result) {
                    setButtonRotation((rotation) => rotation + 360);
                    setButtonColor(COLORS.SUCCESS);
                    setCurrentIcon(<FaCheck />);
                } else {
                    setButtonRotation((rotation) => rotation - 180);
                    setButtonColor(COLORS.ERROR);
                    setCurrentIcon(<FaXmark />);
                }

                await sleep(1500);

                setButtonColor(COLORS.DEFAULT);
                setCurrentIcon(icon);

                const rotateBack = ((Number(result) + 1) * 2 - 3) * 45;

                setButtonRotation((rotation) => rotation + rotateBack);
                setIsPressed(false);
            }}
            disabled={disabled}
        >
            <div
                className="relative flex items-center justify-center"
                style={{ transform: `rotate(${-buttonRotation}deg)` }}
            >
                {currentIcon}
            </div>
        </motion.button>
    );
}
