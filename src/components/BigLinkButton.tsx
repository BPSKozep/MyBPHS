import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";

function BigLinkButton({
    title,
    url,
    disabled,
}: {
    title: string;
    url: string;
    disabled?: boolean;
}) {
    const router = useRouter();

    if (disabled) {
        return (
            <motion.button
                whileHover={{ rotateZ: [null, 0.5, -0.5, 0] }}
                transition={{
                    duration: 0.5,
                    times: [0, 0.33, 0.66, 1],
                }}
                className="flex cursor-not-allowed rounded-md border border-gray-400 bg-slate-700 p-7 text-gray-300"
                disabled
            >
                <span className="w-full text-center text-xl font-bold">
                    {title}
                </span>
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
            onClick={() => setTimeout(() => router.push(url), 350)}
            className="flex cursor-pointer rounded-md border-2 bg-slate-700 p-7"
        >
            <span className="w-full text-center text-xl font-bold">
                {title}
            </span>
        </motion.button>
    );
}

export default BigLinkButton;
