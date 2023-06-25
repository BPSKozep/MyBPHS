import { motion } from "framer-motion";
import { useRouter } from "next/router";

export default function Home() {
    const router = useRouter();

    return (
        <>
            <div className="flex bg-slate-800 items-center justify-center h-[7vh]">
                <h1 className="text-center text-xl sm:text-2xl font-bold text-white">
                    Üdvözlünk a{" "}
                    <span className="font-handwriting text-amber-400">My</span>
                    <span className="font-black">BPHS</span>-ben!
                </h1>
            </div>

            <div className="flex justify-center items-center absolute h-[93vh] w-full">
                <div className="inline-grid gap-4 grid-cols-1 grid-rows-4 sm:grid-cols-2 sm:grid-rows-2 text-white m-3">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileFocus={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 20,
                        }}
                        onClick={() =>
                            setTimeout(() => router.push("/credits"), 350)
                        }
                        className="border flex bg-slate-700 p-7 rounded-md cursor-pointer"
                    >
                        <span className="text-center w-full text-xl font-bold">
                            Kreditek
                        </span>
                    </motion.button>
                    <motion.button
                        className="border border-gray-400 flex bg-slate-700 text-gray-300 p-7 rounded-md cursor-not-allowed"
                        disabled
                    >
                        <span className="text-center w-full text-xl font-bold">
                            Hiányzások
                        </span>
                    </motion.button>
                    <motion.button
                        className="border border-gray-400 flex bg-slate-700 text-gray-300 p-7 rounded-md cursor-not-allowed"
                        disabled
                    >
                        <span className="text-center w-full text-xl font-bold">
                            Órarend
                        </span>
                    </motion.button>
                    <motion.button
                        className="border border-gray-400 flex bg-slate-700 text-gray-300 p-7 rounded-md cursor-not-allowed"
                        disabled
                    >
                        <span className="text-center w-full text-xl font-bold">
                            Ebédrendelés
                        </span>
                    </motion.button>
                </div>
            </div>
        </>
    );
}
