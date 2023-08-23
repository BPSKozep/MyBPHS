import { faHome } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import React, { useState } from "react";

function Forbidden() {
    const [clicked, setClicked] = useState(false);
    const router = useRouter();

    return (
        <div className="relative flex h-[93vh] w-full flex-col items-center justify-center gap-5 text-2xl font-bold text-white">
            <span className="text-center">
                A bejelentkezés nem engedélyezett!
            </span>

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
                    <FontAwesomeIcon icon={faHome} className="transition-all" />
                </motion.div>
            </div>
        </div>
    );
}

export default Forbidden;
