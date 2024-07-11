"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image"; // Assuming you're using Next.js for Image component
import Loading from "./Loading"; // Your Loading component path
import { signIn } from "next-auth/react";

export default function GoogleSignIn() {
    const [clicked, setClicked] = React.useState(false);

    // Variants for animation states
    const buttonVariants = {
        initial: { width: "auto" },
        clicked: { width: "200px" },
    };

    return (
        <motion.div
            // initial="initial"
            // animate={clicked ? "clicked" : "initial"}
            variants={buttonVariants}
            onClick={() => {
                setClicked(true);
                signIn("google", { callbackUrl: "/" });
            }}
            className="flex h-14 cursor-pointer select-none rounded-2xl border-2 bg-gray-300 px-6 align-middle transition-all duration-300 hover:border-blue-400"
        >
            {!clicked ? (
                <div className="relative flex items-center justify-center space-x-4 px-5 align-middle">
                    <Image
                        src="https://cdn.bpskozep.hu/google.svg"
                        className="absolute left-0 w-5 scale-150"
                        alt="google logo"
                        width={48}
                        height={48}
                    />
                    <span className="w-max font-bold tracking-wide text-black">
                        Továbblépés Google-lel
                    </span>
                </div>
            ) : (
                <motion.div className="relative flex w-full scale-90 items-center justify-center align-middle">
                    <Loading />
                </motion.div>
            )}
        </motion.div>
    );
}
