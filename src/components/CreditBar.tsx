import React from "react";
import { motion } from "framer-motion";

const months = [
    "Szeptember",
    "Október",
    "November",
    "December",
    "Január",
    "Február",
    "Március",
    "Április",
    "Május",
    "Június",
];

type CreditStatus = "COMPLETED" | "FAILED" | "PENDING";

const creditClasses = {
    COMPLETED: "bg-[#21B290] h-5 w-5 rounded-full",
    FAILED: "bg-[#B23B21] h-[1.15rem] w-[1.15rem] rounded-full",
    PENDING: "bg-[#C3C182] h-4 w-4 rounded-full",
};

function CreditBar({
    progress,
    credits,
}: {
    progress: number;
    credits: CreditStatus[];
}) {
    return (
        <>
            <div className="flex h-40 flex-col items-stretch overflow-auto rounded-lg">
                <div className="relative h-[70%] min-w-[65rem] bg-[#242424]">
                    <div className="rounded-full">
                        <motion.div
                            className={`pointer-events-none absolute left-0 top-1/2 mx-[1.5%] h-10 w-[97%] -translate-y-1/2 ${
                                progress === 0 ? "rounded-lg" : "rounded-l-lg"
                            } bg-[#133B57] [transform-origin:0%_50%]`}
                            initial={{ width: 0 }}
                            animate={{
                                width: `${(() => {
                                    const clampedProgress = Math.min(
                                        Math.max(progress * 100, 0),
                                        100
                                    );

                                    if (
                                        clampedProgress === 0 ||
                                        clampedProgress === 100
                                    )
                                        return clampedProgress * 0.97;

                                    return 0.97 * (clampedProgress * 0.98 + 1);
                                })()}%`,
                            }}
                        ></motion.div>
                    </div>

                    <div className="absolute left-0 right-0 top-1/2 mx-[2.5%] flex h-1.5 w-[95%] -translate-y-1/2 items-center justify-evenly rounded-lg bg-[#8F8F8F]">
                        <motion.div
                            className="absolute left-0 h-1.5 rounded-lg bg-[#838EC7]"
                            initial={{ width: 0 }}
                            animate={{
                                width: `${(() => {
                                    const clampedProgress = Math.min(
                                        Math.max(progress * 100, 0),
                                        100
                                    );

                                    return clampedProgress;
                                })()}%`,
                            }}
                        ></motion.div>
                        {credits.map((credit: CreditStatus, index) => (
                            <div
                                className="z-10 flex h-5 w-5 items-center justify-center"
                                key={index}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.3 }}
                                    transition={{ duration: 0.1 }}
                                    className={`${creditClasses[credit]}`}
                                ></motion.div>
                            </div>
                        ))}
                    </div>

                    <div className="pointer-events-none absolute left-0 top-1/2 mx-[1.5%] h-10 w-[97%] -translate-y-1/2">
                        <motion.div
                            className="absolute h-10 w-1.5 -translate-x-1/2 rounded-lg bg-[#3F9E7C]"
                            initial={{ left: 0 }}
                            animate={{
                                left: `${(() => {
                                    const clampedProgress = Math.min(
                                        Math.max(progress * 100, 0),
                                        100
                                    );

                                    if (clampedProgress === 100)
                                        return clampedProgress;

                                    return clampedProgress * 0.98 + 1;
                                })()}%`,
                            }}
                        ></motion.div>
                    </div>
                </div>
                <div className="box-border flex h-[30%] min-w-[65rem] items-center justify-between bg-[#565E85] px-[2.5%]">
                    {months.map((month) => (
                        <span
                            className="w-[10%] text-center font-extrabold text-white"
                            key={month}
                        >
                            {month}
                        </span>
                    ))}
                </div>
            </div>
        </>
    );
}

export default CreditBar;
