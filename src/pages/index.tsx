import Link from "next/link";

export default function Home() {
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
                    <Link href="/credits">
                        <div className="border flex bg-slate-800 p-7 rounded-md cursor-pointer hover:bg-slate-700 hover:scale-105 transition-all delay-50 duration-200">
                            <span className="text-center w-full text-xl font-bold">
                                Kreditek
                            </span>
                        </div>
                    </Link>
                    <div className="border flex bg-slate-800 p-7 rounded-md cursor-pointer hover:bg-slate-700 hover:scale-105 transition-all delay-50 duration-200">
                        <span className="text-center w-full text-xl font-bold">
                            Hiányzások
                        </span>
                    </div>
                    <div className="border flex bg-slate-800 p-7 rounded-md cursor-pointer hover:bg-slate-700 hover:scale-105 transition-all delay-50 duration-200">
                        <span className="text-center w-full text-xl font-bold">
                            Ebédrendelés
                        </span>
                    </div>
                    <div className="border flex bg-slate-800 p-7 rounded-md cursor-pointer hover:bg-slate-700 hover:scale-105 transition-all delay-50 duration-200">
                        <span className="text-center w-full text-xl font-bold">
                            Kreditek
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}
