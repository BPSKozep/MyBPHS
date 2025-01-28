"use client";

import React, { useState } from "react";
import { trpc } from "utils/trpc";
import { FaFloppyDisk } from "react-icons/fa6";
import Card from "components/Card";
import IconSubmitButton from "components/IconSubmitButton";

export default function CreateUsers() {
    const [names, setNames] = useState<string[]>([]);
    const [emails, setEmails] = useState<string[]>([]);
    const [roles, setRoles] = useState<string[]>([]);
    const [nfcIds, setNfcIds] = useState<string[]>([]);

    const { mutateAsync: createMany } = trpc.user.createMany.useMutation();

    const { mutateAsync: sendDiscordWebhook } =
        trpc.webhook.sendDiscordWebhook.useMutation();

    return (
        <div className="flex flex-col justify-center text-white md:flex-row">
            <Card>
                <div className="flex flex-col items-center">
                    <h2 className="text-lg font-bold">
                        Felhasználók létrehozása
                    </h2>
                    <p className="mt-3">Nevek</p>
                    <textarea
                        value={names.join("\n")}
                        onChange={(e) => setNames(e.target.value.split("\n"))}
                        className="h-24 w-60 resize-none rounded-md p-2 text-black sm:h-32 sm:w-96"
                        placeholder={"Kovács Júdás\nBakos Gergely"}
                    ></textarea>
                    <p className="mt-3">Email címek</p>
                    <textarea
                        value={emails.join("\n")}
                        onChange={(e) => setEmails(e.target.value.split("\n"))}
                        className="h-24 w-60 resize-none rounded-md p-2 text-black sm:h-32 sm:w-96"
                        placeholder={"email@example.com\nemail@example.com"}
                    ></textarea>
                    <p className="mt-3">NFCk</p>
                    <textarea
                        value={nfcIds.join("\n")}
                        onChange={(e) => setNfcIds(e.target.value.split("\n"))}
                        className="h-24 w-60 resize-none rounded-md p-2 text-black sm:h-32 sm:w-96"
                        placeholder={"f72aeb82\n92fba9c8"}
                    ></textarea>
                    <p className="mt-3">Szerepkör</p>
                    <textarea
                        value={roles.join("\n")}
                        onChange={(e) => setRoles(e.target.value.split("\n"))}
                        className="h-10 w-60 resize-none rounded-md p-2 text-black sm:h-32 sm:w-96"
                        placeholder={"student"}
                    ></textarea>
                    <div className="mt-3">
                        <IconSubmitButton
                            icon={<FaFloppyDisk />}
                            onClick={async () => {
                                try {
                                    await createMany({
                                        emails: emails,
                                        names,
                                        roles: new Array(emails.length).fill(
                                            roles,
                                        ),
                                        nfcIds,
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
                    </div>
                </div>
            </Card>
        </div>
    );
}
