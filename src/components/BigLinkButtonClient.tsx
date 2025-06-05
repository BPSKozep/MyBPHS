"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { IoCloudOffline } from "react-icons/io5";

export function BigLinkButtonClient({
    title,
    url,
    disabled,
    allSitesUp,
}: {
    title: string;
    url: string;
    disabled?: boolean;
    allSitesUp: boolean | null;
}) {
    const router = useRouter();
    const [clicked, setClicked] = useState(false);

    const StatusIndicator = () => {
        if (allSitesUp === null || allSitesUp === true) return null;

        return (
            <div className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center">
                <IoCloudOffline className="text-gray-400" />
            </div>
        );
    };

    const isDisabled = disabled ?? (false || allSitesUp === false);

    if (isDisabled) {
        return (
            <motion.button
                whileHover={{ rotateZ: [null, 0.5, -0.5, 0] }}
                transition={{
                    duration: 0.5,
                    times: [0, 0.33, 0.66, 1],
                }}
                className="relative flex cursor-not-allowed rounded-md border border-gray-400 bg-slate-700 p-7 text-gray-300"
                disabled
            >
                <span className="w-full text-center text-xl font-bold">
                    {title}
                </span>
                <StatusIndicator />
            </motion.button>
        );
    }

    return (
        <motion.button
            whileHover={{ scale: clicked ? 1 : 1.1 }}
            whileFocus={{ scale: clicked ? 1 : 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{
                type: "spring",
                stiffness: 500,
                damping: 20,
            }}
            onClick={() => {
                setClicked(true);
                setTimeout(() => router.push(url), 150);
            }}
            className="relative flex cursor-pointer rounded-md border-2 bg-slate-700 p-7"
        >
            <span className="w-full text-center text-xl font-bold">
                {title}
            </span>
            <StatusIndicator />
        </motion.button>
    );
}
