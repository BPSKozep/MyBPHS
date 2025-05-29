"use client";

import React from "react";
import IconSubmitButton from "@/components/IconSubmitButton";
import { FaCalendarXmark } from "react-icons/fa6";
import sleep from "@/utils/sleep";
import { api } from "@/trpc/react";
import { getWeek, getWeekYear } from "@/utils/isoweek";

export default function CloseMenuOrders() {
    const setIsOpen = api.menu.setIsopen.useMutation();

    const sendDiscordWebhook = api.webhook.sendDiscordWebhook.useMutation();

    return (
        <>
            <h2 className="mt-5 mb-3 font-bold text-white">
                Beküldések lezárása
            </h2>
            <div>
                <IconSubmitButton
                    icon={<FaCalendarXmark />}
                    onClick={async () => {
                        try {
                            await sleep(500);

                            const date = new Date();
                            date.setDate(date.getDate() + 7);

                            await setIsOpen.mutateAsync({
                                week: getWeek(date),
                                year: getWeekYear(date),
                                isOpen: false,
                            });

                            await sendDiscordWebhook.mutateAsync({
                                type: "Lunch",
                                message: "Beküldések lezárva. ❌",
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
        </>
    );
}
