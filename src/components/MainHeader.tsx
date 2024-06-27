"use client";

import React from "react";
import { trpc } from "utils/trpc";
import PWAInstall from "components/PWAInstall";
import Link from "next/link";
import Sheet from "components/Sheet";
import IconSubmitButton from "components/IconSubmitButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import sleep from "utils/sleep";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

export default function MainHeader() {
    const { data } = useSession();
    const [isSheetOpen, setSheetOpen] = useState(false);

    const { data: NfcId } = trpc.user.getNfcId.useQuery(
        data?.user?.email || ""
    );

    return (
        <header className="flex h-16 flex-shrink-0 select-none items-center justify-center bg-slate-800">
            <div className="absolute left-10 flex w-10 items-center justify-end">
                <PWAInstall />
            </div>
            <h1 className="text-center text-2xl font-bold text-white">
                <Link href="/">
                    <span className="hidden sm:inline">Üdvözlünk a </span>
                    <span className="font-handwriting text-amber-400">My</span>
                    <span className="font-black">BPHS</span>
                    <span className="hidden sm:inline">-ben!</span>
                </Link>
            </h1>
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
                    Itt megtekintheted a saját információidat
                </p>
                <div className="flex flex-col gap-3 align-middle">
                    <h2 className="text-center align-middle font-bold text-white">
                        Név
                    </h2>
                    <input
                        type="text"
                        disabled
                        value={data?.user?.name || "Nincs adat"}
                        className="mb-5 h-10 overflow-scroll rounded-md border-2 border-slate-400 bg-[#09090b] p-[0.1rem] text-center text-slate-500"
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
                        className="mb-5 h-10 overflow-scroll rounded-md border-2 border-slate-400 bg-[#09090b] p-[0.1rem] text-center text-slate-500"
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
                        className="mb-5 h-10 rounded-md border-2 border-slate-400 bg-[#09090b] p-[0.1rem] text-center text-slate-500"
                    />
                </div>
                <div className="flex justify-center">
                    <IconSubmitButton
                        icon={<FontAwesomeIcon icon={faRightFromBracket} />}
                        onClick={async () => {
                            try {
                                await sleep(500);

                                await signOut({
                                    callbackUrl: "/",
                                });

                                return true;
                            } catch (err) {
                                return false;
                            }
                        }}
                    />
                </div>
            </Sheet>
        </header>
    );
}
