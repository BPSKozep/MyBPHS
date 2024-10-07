"use client";

import React, { useState } from "react";
import Card from "components/Card";
import IconSubmitButton from "components/IconSubmitButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import sleep from "utils/sleep";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { trpc } from "utils/trpc";
import UserDropdown from "./UserDropdown";
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

    const { mutateAsync: sendGroupEmail } =
        trpc.email.sendAdminGroupEmail.useMutation();

    const { mutateAsync: sendUserEmail } =
        trpc.email.sendAdminUserEmail.useMutation();

    const { mutateAsync: sendDiscordWebhook } =
        trpc.webhook.sendDiscordWebhook.useMutation();

    const { data: user } = trpc.user.get.useQuery(selectedUser, {
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
                    className="h-10 w-40 rounded-md border-none p-2 text-center font-bold text-black"
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
                                    className="w-60 rounded-lg p-2 text-black sm:w-80"
                                    value={buttonLink}
                                    placeholder='https://my.bphs.hu/valami"'
                                    onChange={(e) =>
                                        setButtonLink(e.target.value)
                                    }
                                />
                                <p className="my-3">Gomb szöveg</p>
                                <input
                                    type="text"
                                    className="w-60 rounded-lg p-2 text-black sm:w-80"
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
                        className="h-10 w-52 rounded-md border-none p-2 text-center font-bold text-black"
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
                    <UserDropdown onChange={setSelectedUser} />
                )}

                <p className="mb-3 mt-5">Email tárgy</p>
                <input
                    type="text"
                    className="w-60 rounded-lg p-2 text-black sm:w-80"
                    value={emailSubject}
                    placeholder='+ "MyBPHS hírlevél"'
                    onChange={(e) => setEmailSubject(e.target.value)}
                />
                <p className="mb-3 mt-5">Email szöveg</p>
                <div className="flex flex-col items-center">
                    <textarea
                        className="mb-5 w-72 rounded-lg p-3 text-black sm:w-80"
                        value={emailText}
                        onChange={(e) => setEmailText(e.target.value)}
                    ></textarea>
                    <IconSubmitButton
                        icon={<FontAwesomeIcon icon={faEnvelope} />}
                        onClick={async () => {
                            try {
                                await sleep(500);

                                if (groupmode && !selectedUser && !user) {
                                    await sendGroupEmail({
                                        emailFormat,
                                        emailTo,
                                        emailSubject,
                                        emailText,
                                        buttonLink,
                                        buttonText,
                                    });
                                    await sendDiscordWebhook({
                                        type: "Info",
                                        message:
                                            emailFormat +
                                            " csoport email elkuldve: " +
                                            emailSubject,
                                    });
                                } else {
                                    await sendUserEmail({
                                        emailFormat,
                                        emailTo: selectedUser,
                                        emailSubject,
                                        emailText,
                                        buttonLink,
                                        buttonText,
                                        user: user ? user.name : "",
                                    });
                                    await sendDiscordWebhook({
                                        type: "Info",
                                        message:
                                            selectedUser +
                                            "-nak email elkuldve: " +
                                            emailSubject,
                                    });
                                }

                                return true;
                            } catch (err) {
                                await sendDiscordWebhook({
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
