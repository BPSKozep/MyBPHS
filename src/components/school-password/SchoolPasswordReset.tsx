"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import sleep from "@/utils/sleep";
import IconSubmitButton from "@/components/IconSubmitButton";
import { FaFloppyDisk } from "react-icons/fa6";
import { api } from "@/trpc/react";
import Card from "../Card";
import Loading from "../Loading";
import { useSession } from "next-auth/react";

export default function SchoolPasswordReset() {
    const [input, setInput] = useState("");
    const lastChanged = api.ad.getPasswordLastChanged.useQuery();
    const setNewPassword = api.ad.setNewPassword.useMutation();

    const inputValid = input.length >= 8;

    const sendDiscordWebhook = api.webhook.sendDiscordWebhook.useMutation();

    const [laptopPassResetAvailable, setlaptopAvailable] = useState(true);

    const [laptopPassResetShown, setLaptopPassResetShown] = useState(false);

    const session = useSession();

    useEffect(() => {
        const timer = setTimeout(() => {
            setLaptopPassResetShown(true);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        fetch("/api/laptop/ping")
            .then((response) => {
                if (response.status != 200) {
                    setlaptopAvailable(false);
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }, []);

    return (
        <>
            {!laptopPassResetShown && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 1 }}
                    className="flex h-full w-full max-w-md flex-col content-center items-center justify-center"
                >
                    <Loading />
                    <h2 className="mt-5 font-bold text-white">
                        Csatlakozás a szolgáltatáshoz...
                    </h2>
                </motion.div>
            )}
            {!laptopPassResetAvailable && laptopPassResetShown && (
                <div className="flex h-full w-full flex-col content-center items-center justify-center text-center text-xl font-bold text-white">
                    <p>A laptop jelszó visszaállítás</p>
                    <p>jelenleg nem elérhető.</p>
                </div>
            )}
            {laptopPassResetAvailable && laptopPassResetShown && (
                <Card>
                    <div className="flex flex-col items-center text-center">
                        <h1 className="mb-5 font-bold text-white">
                            Iskolai jelszó be- vagy visszaállítása
                        </h1>
                        <input
                            type="password"
                            placeholder="Jelszó"
                            className="mb-3 rounded-md bg-white p-1 text-center text-black transition-all"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />

                        <motion.span
                            className="text-white"
                            initial={{
                                opacity: 0,
                                height: 0,
                            }}
                            animate={{
                                opacity: inputValid ? 0 : 1,
                                height: inputValid ? 0 : "auto",
                            }}
                            transition={{
                                height: { delay: inputValid ? 0.2 : 0 },
                            }}
                        >
                            A jelszó legalább 8 karakter hosszú legyen.
                        </motion.span>

                        <div className="mt-3">
                            <IconSubmitButton
                                icon={<FaFloppyDisk />}
                                disabled={!inputValid}
                                onClick={async () => {
                                    try {
                                        await sleep(500);
                                        await setNewPassword.mutateAsync(input);

                                        await lastChanged.refetch();

                                        return true;
                                    } catch (error) {
                                        await sendDiscordWebhook.mutateAsync({
                                            title: "SchoolPasswordReset Hiba",
                                            body:
                                                session.data?.user?.email +
                                                "\n\n" +
                                                String(error),
                                            error: true,
                                        });
                                        return false;
                                    }
                                }}
                            />
                        </div>
                        {lastChanged.data && (
                            <h1 className="mt-5 text-white">
                                Legutoljára módosítva: {lastChanged.data}
                            </h1>
                        )}
                    </div>
                </Card>
            )}
        </>
    );
}
