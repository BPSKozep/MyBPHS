"use client";

import { FaHome } from "react-icons/fa";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

function ForbiddenComponent() {
    const [clicked, setClicked] = useState(false);
    const router = useRouter();
    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-white">
            <span className="text-center text-2xl font-bold">
                Hozzáférés megtagadva!
            </span>

            <div className="flex h-20 w-20 items-center justify-center">
                <div
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 transition-all hover:h-20 hover:w-20 hover:shadow-lg"
                    onClick={() => {
                        setClicked(true);
                        setTimeout(() => {
                            router.push("/");
                        }, 700);
                    }}
                >
                    <motion.div
                        animate={{ rotate: clicked ? 360 : 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <FaHome className="transition-all" />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default ForbiddenComponent;
