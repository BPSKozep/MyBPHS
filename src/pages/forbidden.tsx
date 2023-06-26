import { faHome } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import React, { useState } from "react";

function Forbidden() {
    const [clicked, setClicked] = useState(false);
    const router = useRouter();

    return (
        <div className="absolute flex h-full w-full flex-col items-center justify-center gap-5 text-2xl font-bold text-white">
            <span className="text-center">
                A bejelentkezés nem engedélyezett!
            </span>

            <div
                className="rounded-full bg-blue-500 p-3 transition-all hover:p-5 hover:shadow-lg"
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
                    <FontAwesomeIcon
                        icon={faHome}
                        className={`transition-all`}
                    />
                </motion.div>
            </div>
        </div>
    );
}

export default Forbidden;
