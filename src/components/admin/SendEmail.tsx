"use client";

import React, { useState } from "react";
import Card from "components/Card";
import IconSubmitButton from "components/IconSubmitButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import sleep from "utils/sleep";
import { trpc } from "utils/trpc";
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

    const { mutateAsync: sendEmail } = trpc.email.sendAdminEmail.useMutation();

    const { mutateAsync: sendDiscordWebhook } =
        trpc.webhook.sendDiscordWebhook.useMutation();

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
                    <option value="general">Altalanos</option>
                    <option value="update">Hirlevel</option>
                    <option value="important">Fontos</option>
                </select>
                <p className="my-3">Cimzettek</p>
                <select
                    className="h-10 w-40 rounded-md border-none p-2 text-center font-bold text-black"
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
                        Rendszergazdak
                    </option>
                    <option value="jpp-students@budapestschool.org">
                        Mindenki
                    </option>
                    <option value="jpp-students-only@budapestschool.org">
                        Diakok
                    </option>
                    <option value="jpp-teachers@budapestschool.org">
                        Tanarok
                    </option>
                </select>
                <p className="mb-3 mt-5">Email targy</p>
                <input
                    type="text"
                    className="w-60 rounded-lg p-2 text-black sm:w-80"
                    value={emailSubject}
                    placeholder='+ "MyBPHS hírlevél"'
                    onChange={(e) => setEmailSubject(e.target.value)}
                />
                <p className="mb-3 mt-5">Email szoveg</p>
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

                            await sendEmail({
                                emailFormat,
                                emailTo,
                                emailSubject,
                                emailText,
                            });

                            await sendDiscordWebhook({
                                type: "Info",
                                message:
                                    emailFormat +
                                    " email elkuldve: " +
                                    emailSubject,
                            });
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
            </Card>
        </div>
    );
}
