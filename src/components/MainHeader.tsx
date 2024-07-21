"use client";

import React, { useEffect } from "react";
import { trpc } from "utils/trpc";
import PWAInstall from "components/PWAInstall";
import Link from "next/link";
import Sheet from "components/Sheet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import sleep from "utils/sleep";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import useFcmToken from "./useFcmToken";
import { motion } from "framer-motion";
import Card from "./Card";

export default function MainHeader() {
    const { data } = useSession();
    const [isSheetOpen, setSheetOpen] = useState(false);

    const { data: NfcId } = trpc.user.getNfcId.useQuery(
        data?.user?.email || ""
    );

    const {mutateAsync: setNotificationPreference} = trpc.user.setNotificationPreference.useMutation();
    const {mutateAsync: sendPush} = trpc.fcmpush.sendPush.useMutation();

    const {data: notificationPreference, refetch: refetchNotificationPreference} = trpc.user.getNotificationPreference.useQuery();

    const [switchState, setSwitchState] = useState(false)

    const { token } = useFcmToken();

    useEffect(() => {
        if (notificationPreference === "push") {
            setSwitchState(true);
        }
        else {
            setSwitchState(false);
        }
    }, [notificationPreference]);  // TODO only change switch state if different from current state

    useEffect(() => {
        if (switchState) {
            setNotificationPreference("push");
        }
        else {
            setNotificationPreference("email");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [switchState]);

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
                        className="mb-5 h-10 overflow-scroll rounded-lg bg-white p-[0.1rem] text-center font-bold text-black"
                    />
                </div>
                <div className="flex flex-col gap-3 align-middle text-white mb-8">
                    <h2 className="text-center font-bold">
                        Értesítés típusa
                    </h2>
                    <div className="flex flex-row justify-center">
                        <p>Email</p>
                    <label className="inline-flex items-center cursor-pointer mx-3">
                        <input type="checkbox" value="" className="sr-only peer" checked={switchState} onChange={async (e) => {
                            await setSwitchState(e.target.checked)
                            refetchNotificationPreference();
                            sendPush({
                                token: token || "",
                                title: "Így fog kinézni a cím",
                                message: "Így pedig a leírás",
                            })
                            }}/>
                        <div className="relative w-11 h-6 peer-focus:outline-none rounded-full peer bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                    <p>Push</p>
                    </div>
                    <div className="text-center">
                    <Card>
                        {/* <h2>Értesítés teszt: {useFcmToken === "denied" ? <p>✅</p> : <p>❌</p>}</h2> */}
                        {/* <button onClick={() => {console.log(useFcmToken())}}>a</button> */}
                        <motion.span
                            className="text-white text-center"
                            initial={{
                                opacity: 0,
                                height: 0,
                            }}
                            animate={{
                                opacity: switchState ? 1 : 0,
                                height: switchState ? "auto" : 0,
                            }}
                            transition={{
                                height: { delay: switchState ? 0 : 0.2 },
                            }}
                        >
                            Figyelj arra, hogy a böngésződben engedélyezve legyenek a push értesítések!
                        </motion.span>
                    </Card></div>
                </div>
                <div
                    className="flex cursor-pointer items-center justify-center align-middle text-white"
                    onClick={async () => {
                        await sleep(500);

                        await signOut({
                            callbackUrl: "/",
                        });
                    }}
                >
                    <FontAwesomeIcon icon={faRightFromBracket} />
                    <p className="ml-2 text-lg">Kijelentkezés</p>
                </div>
            </Sheet>
        </header>
    );
}
