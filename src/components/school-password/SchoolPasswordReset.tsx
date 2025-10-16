"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import sleep from "@/utils/sleep";
import IconSubmitButton from "@/components/IconSubmitButton";
import {
    FaFloppyDisk,
    FaEye,
    FaEyeSlash,
    FaKey,
    FaCircleExclamation,
    FaChevronDown,
    FaCircleQuestion,
} from "react-icons/fa6";
import { api } from "@/trpc/react";
import Card from "../Card";
import Loading from "../Loading";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { InfoBox } from "@/components/InfoBox";

export default function SchoolPasswordReset() {
    const [input, setInput] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showFaq, setShowFaq] = useState(false);
    const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(
        null,
    );
    const lastChanged = api.ad.getPasswordLastChanged.useQuery();
    const setNewPassword = api.ad.setNewPassword.useMutation();

    const inputValid = input.length >= 8;

    const sendDiscordWebhook = api.webhook.sendDiscordWebhook.useMutation();

    const [laptopPassResetAvailable, setlaptopAvailable] = useState(true);

    const [laptopPassResetShown, setLaptopPassResetShown] = useState(false);

    const session = useSession();

    const faqItems = [
        {
            question: "Mire való ez a jelszó?",
            answer: "Ez a jelszó az iskolai számítógépekre és az ENT WiFi-re való bejelentkezéshez szükséges.",
        },
        {
            question: "Ki látja a jelszavamat?",
            answer: "Senki. A jelszavad, titkosított formátumban, az iskolai szerverén van tárolva, így senki sem tud hozzáférni.",
        },
        {
            question: "Mit tegyek, ha elfelejtett a jelszavam?",
            answer: "Ezen az oldalon bármikor visszaállíthatod. Csak add meg az új jelszót és mentsd el.",
        },
    ];

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
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex h-full w-full flex-col content-center items-center justify-center px-5 text-center"
                >
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-600">
                        <FaCircleExclamation className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="mb-2 text-2xl font-bold text-white">
                        Szolgáltatás nem elérhető
                    </h1>
                    <p className="text-gray-300">
                        A jelszó visszaállítás jelenleg nem elérhető. <br />
                        Kérjük, próbáld újra később.
                    </p>
                </motion.div>
            )}
            {laptopPassResetAvailable && laptopPassResetShown && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md px-4"
                >
                    <Card>
                        <div className="flex flex-col items-center p-2 text-center">
                            {/* Icon Header */}
                            <div className="mb-6">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
                                    <FaKey className="h-8 w-8 text-white" />
                                </div>
                                <h1 className="mb-2 text-2xl font-bold text-white">
                                    Iskolai jelszó beállítása
                                </h1>
                            </div>

                            {/* Password Input */}
                            <div className="mb-6 w-full space-y-4">
                                <div>
                                    <label
                                        htmlFor="password"
                                        className="mb-2 block text-left text-sm text-gray-400"
                                    >
                                        Új jelszó
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Input
                                                id="password"
                                                type={
                                                    showPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                value={input}
                                                onChange={(e) =>
                                                    setInput(e.target.value)
                                                }
                                                placeholder="Legalább 8 karakter"
                                                className="bg-gray-700 text-white placeholder-gray-500"
                                                autoComplete="new-password"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            className="text-gray-400 transition-colors hover:text-white"
                                            aria-label={
                                                showPassword
                                                    ? "Jelszó elrejtése"
                                                    : "Jelszó mutatása"
                                            }
                                        >
                                            {showPassword ? (
                                                <FaEyeSlash className="h-5 w-5" />
                                            ) : (
                                                <FaEye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Validation Message */}
                                {input.length > 0 && !inputValid && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <InfoBox variant="warning">
                                            A jelszónak legalább 8 karakter
                                            hosszúnak kell lennie.
                                        </InfoBox>
                                    </motion.div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="mb-4">
                                <IconSubmitButton
                                    icon={<FaFloppyDisk />}
                                    disabled={!inputValid}
                                    onClick={async () => {
                                        try {
                                            await sleep(500);
                                            await setNewPassword.mutateAsync(
                                                input,
                                            );

                                            await lastChanged.refetch();

                                            return true;
                                        } catch (error) {
                                            await sendDiscordWebhook.mutateAsync(
                                                {
                                                    title: "SchoolPasswordReset Hiba",
                                                    body:
                                                        session.data?.user
                                                            ?.email +
                                                        "\n\n" +
                                                        String(error),
                                                    error: true,
                                                },
                                            );
                                            return false;
                                        }
                                    }}
                                />
                            </div>

                            {/* Last Changed Info */}
                            {lastChanged.data && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="mb-4 w-full rounded-lg border border-gray-600 bg-gray-700/50 p-3"
                                >
                                    <p className="text-sm text-gray-300">
                                        Legutoljára módosítva:{" "}
                                        <span className="font-semibold text-white">
                                            {lastChanged.data}
                                        </span>
                                    </p>
                                </motion.div>
                            )}

                            {/* FAQ Section */}
                            <div className="w-full">
                                <button
                                    onClick={() => setShowFaq(!showFaq)}
                                    className="flex w-full items-center justify-between rounded-lg border border-gray-600 bg-gray-700/30 p-3 transition-colors hover:bg-gray-700/50"
                                >
                                    <div className="flex items-center gap-2">
                                        <FaCircleQuestion className="h-4 w-4 text-blue-400" />
                                        <span className="font-semibold text-white">
                                            Hogyan használd?
                                        </span>
                                    </div>
                                    <motion.div
                                        animate={{ rotate: showFaq ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <FaChevronDown className="h-4 w-4 text-gray-400" />
                                    </motion.div>
                                </button>

                                <motion.div
                                    initial={false}
                                    animate={{
                                        height: showFaq ? "auto" : 0,
                                        opacity: showFaq ? 1 : 0,
                                    }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-2 space-y-2">
                                        {faqItems.map((item, index) => (
                                            <div
                                                key={index}
                                                className="rounded-lg border border-gray-600 bg-gray-700/20"
                                            >
                                                <button
                                                    onClick={() =>
                                                        setExpandedFaqIndex(
                                                            expandedFaqIndex ===
                                                                index
                                                                ? null
                                                                : index,
                                                        )
                                                    }
                                                    className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-gray-700/30"
                                                >
                                                    <span className="text-sm font-medium text-white">
                                                        {item.question}
                                                    </span>
                                                    <motion.div
                                                        animate={{
                                                            rotate:
                                                                expandedFaqIndex ===
                                                                index
                                                                    ? 180
                                                                    : 0,
                                                        }}
                                                        transition={{
                                                            duration: 0.2,
                                                        }}
                                                    >
                                                        <FaChevronDown className="h-3 w-3 flex-shrink-0 text-gray-400" />
                                                    </motion.div>
                                                </button>
                                                <motion.div
                                                    initial={false}
                                                    animate={{
                                                        height:
                                                            expandedFaqIndex ===
                                                            index
                                                                ? "auto"
                                                                : 0,
                                                        opacity:
                                                            expandedFaqIndex ===
                                                            index
                                                                ? 1
                                                                : 0,
                                                    }}
                                                    transition={{
                                                        duration: 0.2,
                                                    }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="border-t border-gray-600 p-3 pt-2">
                                                        <p className="text-sm text-gray-300">
                                                            {item.answer}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}
        </>
    );
}
