import { faHome } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import React, { useState } from "react";

function Forbidden() {
    const [clicked, setClicked] = useState(false);
    const router = useRouter();

    return (
        <div className="absolute flex h-full w-full justify-center items-center text-white text-2xl font-bold flex-col gap-5">
            <span className="text-center">
                A bejelentkezés nem engedélyezett!
            </span>

            <div
                className="bg-blue-500 p-3 rounded-full hover:p-5 hover:shadow-lg transition-all"
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
