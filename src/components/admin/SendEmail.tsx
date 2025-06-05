"use client";

import React, { useState } from "react";
import Card from "@/components/Card";
import IconSubmitButton from "@/components/IconSubmitButton";
import { FaEnvelope } from "react-icons/fa6";
import sleep from "@/utils/sleep";
import { motion } from "motion/react";
import { AnimatePresence } from "motion/react";
import { api } from "@/trpc/react";
import UserInput from "./UserInput";

export default function CreateUsers() {
    const [emailFormat, setEmailFormat] = useState<
        "general" | "update" | "important"
    >("general");

    const [emailTo, setEmailTo] = useState<
        | "bphs-sysadmins@budapest.school"
        | "jpp-students@budapestschool.org"
        | "jpp-students-only@budapestschool.org"
        | "jpp-teachers@budapestschool.org"
    >("bphs-sysadmins@budapest.school");

    const [emailSubject, setEmailSubject] = useState("");
    const [emailText, setEmailText] = useState("");
    const [buttonLink, setButtonLink] = useState("");
    const [buttonText, setButtonText] = useState("");
    const [groupmode, setGroupMode] = useState(true);
    const [selectedUser, setSelectedUser] = useState("");

    const sendGroupEmail = api.email.sendAdminGroupEmail.useMutation();

    const sendUserEmail = api.email.sendAdminUserEmail.useMutation();

    const sendDiscordWebhook = api.webhook.sendDiscordWebhook.useMutation();

    const user = api.user.get.useQuery(selectedUser, {
        enabled: !!selectedUser,
    });

    return (
        <div className="flex flex-col justify-center text-center text-white md:flex-row">
            <Card>
                <div className="flex flex-col items-center">
                    <h2 className="text-lg font-bold">Admin emailek küldése</h2>
                </div>
                <p className="my-3">Email formátum</p>
                <select
                    className="h-10 w-40 rounded-md border-none bg-white p-2 text-center font-bold text-black"
                    value={emailFormat}
                    onChange={(e) =>
                        setEmailFormat(
                            e.target.value as
                                | "general"
                                | "update"
                                | "important",
                        )
                    }
                >
                    <option value="general">Általános</option>
                    <option value="update">Frissítés</option>
                    <option value="important">Fontos</option>
                </select>
                <AnimatePresence>
                    {emailFormat === "update" && (
                        <motion.div
                            initial={{
                                opacity: 0,
                                height: 0,
                            }}
                            animate={{
                                opacity: emailFormat != "update" ? 0 : 1,
                                height: emailFormat != "update" ? 0 : "auto",
                            }}
                            transition={{
                                height: {
                                    delay: emailFormat != "update" ? 0.2 : 0,
                                },
                            }}
                            exit={{
                                opacity: 0,
                                height: 0,
                            }}
                        >
                            <>
                                <p className="my-3">Link</p>
                                <input
                                    type="text"
                                    className="w-60 rounded-lg bg-white p-2 text-black sm:w-80"
                                    value={buttonLink}
                                    placeholder='https://my.bphs.hu/valami"'
                                    onChange={(e) =>
                                        setButtonLink(e.target.value)
                                    }
                                />
                                <p className="my-3">Gomb szöveg</p>
                                <input
                                    type="text"
                                    className="w-60 rounded-lg bg-white p-2 text-black sm:w-80"
                                    value={buttonText}
                                    placeholder='MBI ✨ on top"'
                                    onChange={(e) =>
                                        setButtonText(e.target.value)
                                    }
                                />
                            </>
                        </motion.div>
                    )}
                </AnimatePresence>

                <p className="my-3">Címzettek</p>
                <div className="my-3 text-center text-white">
                    <button
                        className={`h-12 w-20 rounded-l-xl p-3 transition-all hover:bg-[#3a445d] ${
                            groupmode === true ? "bg-[#3a445d]" : "bg-[#565e85]"
                        }`}
                        onClick={() => setGroupMode(true)}
                    >
                        Csoport
                    </button>
                    <button
                        className={`h-12 w-20 rounded-r-xl p-3 transition-all hover:bg-[#3a445d] ${
                            groupmode === false
                                ? "bg-[#3a445d]"
                                : "bg-[#565e85]"
                        }`}
                        onClick={() => setGroupMode(false)}
                    >
                        Ember
                    </button>
                </div>
                {groupmode ? (
                    <select
                        className="h-10 w-52 rounded-md border-none bg-white p-2 text-center font-bold text-black"
                        value={emailTo}
                        onChange={(e) =>
                            setEmailTo(
                                e.target.value as
                                    | "bphs-sysadmins@budapest.school"
                                    | "jpp-students@budapestschool.org"
                                    | "jpp-students-only@budapestschool.org"
                                    | "jpp-teachers@budapestschool.org",
                            )
                        }
                    >
                        <option value="bphs-sysadmins@budapest.school">
                            Rendszergazdák
                        </option>
                        <option value="jpp-students@budapestschool.org">
                            Mindenki
                        </option>
                        <option value="jpp-students-only@budapestschool.org">
                            Diákok
                        </option>
                        <option value="jpp-teachers@budapestschool.org">
                            Tanárok
                        </option>
                    </select>
                ) : (
                    <div className="flex justify-center">
                        <UserInput
                            onSelect={(user) => setSelectedUser(user.email)}
                        />
                    </div>
                )}

                <p className="mt-5 mb-3">Email tárgy</p>
                <input
                    type="text"
                    className="w-60 rounded-lg bg-white p-2 text-black sm:w-80"
                    value={emailSubject}
                    placeholder='+ "MyBPHS hírlevél"'
                    onChange={(e) => setEmailSubject(e.target.value)}
                />
                <p className="mt-5 mb-3">Email szöveg</p>
                <div className="flex flex-col items-center">
                    <textarea
                        className="mb-5 w-72 rounded-lg bg-white p-3 text-black sm:w-80"
                        value={emailText}
                        onChange={(e) => setEmailText(e.target.value)}
                    ></textarea>
                    <IconSubmitButton
                        icon={<FaEnvelope />}
                        onClick={async () => {
                            try {
                                await sleep(500);

                                if (groupmode && !selectedUser && !user) {
                                    await sendGroupEmail.mutateAsync({
                                        emailFormat,
                                        emailTo,
                                        emailSubject,
                                        emailText,
                                        buttonLink,
                                        buttonText,
                                    });
                                    await sendDiscordWebhook.mutateAsync({
                                        type: "Info",
                                        message:
                                            emailFormat +
                                            " csoport email elkuldve: " +
                                            emailSubject,
                                    });
                                } else {
                                    await sendUserEmail.mutateAsync({
                                        emailFormat,
                                        emailTo: selectedUser,
                                        emailSubject,
                                        emailText,
                                        buttonLink,
                                        buttonText,
                                        user: user.data?.name ?? "",
                                    });
                                    await sendDiscordWebhook.mutateAsync({
                                        type: "Info",
                                        message:
                                            selectedUser +
                                            "-nak email elkuldve: " +
                                            emailSubject,
                                    });
                                }

                                return true;
                            } catch (err) {
                                await sendDiscordWebhook.mutateAsync({
                                    type: "Error",
                                    message: String(err),
                                });
                                return false;
                            }
                        }}
                    />
                </div>
            </Card>
        </div>
    );
}
