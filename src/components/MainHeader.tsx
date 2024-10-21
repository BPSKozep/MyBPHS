"use client";

import React from "react";
import { trpc } from "utils/trpc";
import PWAInstall from "components/PWAInstall";
import Link from "next/link";
import Sheet from "components/Sheet";
import sleep from "utils/sleep";
import { FaRightFromBracket } from "react-icons/fa6";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import Button from "components/Button";
import { useRouter, usePathname } from "next/navigation";

export default function MainHeader() {
    const { data } = useSession();
    const [isSheetOpen, setSheetOpen] = useState(false);

    const router = useRouter();
    const path = usePathname();

    const { data: NfcId } = trpc.user.getNfcId.useQuery(
        data?.user?.email || "",
        {
            enabled: !!data?.user?.email,
        },
    );

    return (
        <header className="flex h-16 flex-shrink-0 select-none items-center justify-center bg-slate-800">
            <div className="absolute left-10 flex w-10 items-center justify-end">
                <PWAInstall />
            </div>
            <div className="text-center text-2xl font-bold text-white">
                {data ? (
                    <h1 className="text-center text-2xl font-bold text-white">
                        <Link href="/">
                            <span className="hidden sm:inline">
                                Üdvözlünk a{" "}
                            </span>
                            <span className="font-handwriting text-amber-400">
                                My
                            </span>
                            <span className="font-black">BPHS</span>
                            <span className="hidden sm:inline">-ben!</span>
                        </Link>
                    </h1>
                ) : (
                    <>
                        <span className="hidden sm:inline">Üdvözlünk a </span>
                        <span className="font-handwriting text-amber-400">
                            My
                        </span>
                        <span className="font-black">BPHS</span>
                        <span className="hidden sm:inline">-ben!</span>
                    </>
                )}
            </div>
            {data && (
                <div
                    className="absolute right-10 flex w-10 items-center justify-end"
                    onClick={() => {
                        setSheetOpen(true);
                    }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={data?.user?.image || ""}
                        alt="Profile picture"
                        className="cursor-pointer rounded-full"
                        draggable="false"
                    />
                </div>
            )}
            <Sheet
                isOpen={isSheetOpen}
                onClose={() => {
                    setSheetOpen(false);
                }}
            >
                <h1 className="text-2xl font-bold text-white">Felhasználó</h1>
                <p className="my-3 text-gray-400">
                    Itt megtekintheted a saját információidat vagy
                    kijelentkezhetsz.
                </p>
                <div className="flex flex-col gap-3 align-middle">
                    <h2 className="text-center align-middle font-bold text-white">
                        Név
                    </h2>
                    <input
                        type="text"
                        disabled
                        value={data?.user?.name || "Nincs adat"}
                        className="mb-5 h-10 overflow-scroll rounded-lg bg-white p-[0.1rem] text-center font-bold text-black"
                    />
                </div>
                <div className="flex flex-col gap-3 align-middle">
                    <h2 className="text-center font-bold text-white">
                        Email cím
                    </h2>
                    <input
                        type="text"
                        disabled
                        value={data?.user?.email || "Nincs adat"}
                        className="mb-5 h-10 overflow-scroll rounded-lg bg-white p-[0.1rem] text-center font-bold text-black"
                    />
                </div>
                <div className="flex flex-col gap-3 align-middle">
                    <h2 className="text-center font-bold text-white">
                        Token azonosító
                    </h2>
                    <input
                        type="text"
                        disabled
                        value={NfcId || "Nincs adat"}
                        className="mb-3 h-10 overflow-scroll rounded-lg bg-white p-[0.1rem] text-center font-bold text-black"
                    />
                </div>
                {path != "/auto-order" && (
                    <div className="my-5 flex flex-col gap-3 align-middle">
                        <Button
                            className=""
                            onClick={() => {
                                router.push("/auto-order");
                                setSheetOpen(false);
                            }}
                        >
                            Automatikus rendelés beállítása
                        </Button>
                    </div>
                )}
                <div
                    className="flex cursor-pointer items-center justify-center align-middle text-white"
                    onClick={async () => {
                        await sleep(500);

                        await signOut({
                            callbackUrl: "/",
                        });
                    }}
                >
                    <FaRightFromBracket />
                    <p className="ml-2 text-lg">Kijelentkezés</p>
                </div>
            </Sheet>
        </header>
    );
}
