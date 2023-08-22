import { motion } from "framer-motion";
import { useRouter } from "next/router";

export default function Home() {
    const router = useRouter();

    return (
        <>
            <header className="flex h-[7vh] items-center justify-center bg-slate-800">
                <h1 className="text-center text-xl font-bold text-white sm:text-2xl">
                    Üdvözlünk a{" "}
                    <span className="font-handwriting text-amber-400">My</span>
                    <span className="font-black">BPHS</span>-ben!
                </h1>
            </header>

            <div className="relative flex h-[93vh] w-full items-center justify-center">
                <div className="m-3 inline-grid grid-cols-1 grid-rows-4 gap-4 text-white sm:grid-cols-2 sm:grid-rows-2">
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
                        className="flex cursor-pointer rounded-md border bg-slate-700 p-7"
                    >
                        <span className="w-full text-center text-xl font-bold">
                            Kreditek
                        </span>
                    </motion.button>
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
                            Hiányzások
                        </span>
                    </motion.button>
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
                            Órarend
                        </span>
                    </motion.button>
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
                            Ebédrendelés
                        </span>
                    </motion.button>
                </div>
            </div>
        </>
    );
}
