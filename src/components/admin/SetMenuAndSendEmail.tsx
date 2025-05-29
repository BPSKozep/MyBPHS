"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";
import IconSubmitButton from "@/components/IconSubmitButton";
import { FaEnvelope } from "react-icons/fa6";
import sleep from "@/utils/sleep";
import { getWeek, getWeekYear } from "@/utils/isoweek";
import SetMenuForm from "@/components/admin/SetMenuForm";

export default function SetMenuAndSendEmail() {
    const [menuOptions, setMenuOptions] = useState(
        Array(5)
            .fill(0)
            .map(() => {
                return {
                    "a-menu": "",
                    "b-menu": "",
                };
            }),
    );

    const createMenu = api.menu.create.useMutation();

    const sendEmail = api.email.sendLunchEmail.useMutation();

    const sendDiscordWebhook = api.webhook.sendDiscordWebhook.useMutation();

    return (
        <div className="flex flex-col items-center justify-center">
            <SetMenuForm onChange={setMenuOptions} />
            <h2 className="mt-5 mb-3 text-white">Mentés és email kiküldése:</h2>
            <div>
                <IconSubmitButton
                    icon={<FaEnvelope />}
                    onClick={async () => {
                        try {
                            await sleep(500);

                            const date = new Date();
                            date.setDate(date.getDate() + 7);

                            await createMenu.mutateAsync({
                                options: menuOptions,
                                week: getWeek(date),
                                year: getWeekYear(date),
                            });

                            await sendEmail.mutateAsync();

                            await sendDiscordWebhook.mutateAsync({
                                type: "Lunch",
                                message:
                                    "Új menü feltöltve, email kiküldve. 📩",
                            });

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
            <span className="mt-3 font-bold text-white">Címzettek:</span>
            {process.env.NEXT_PUBLIC_TO_EMAILS?.split(",").map(
                (email, index) => (
                    <span className="text-white" key={index}>
                        {email}
                    </span>
                ),
            )}
        </div>
    );
}
