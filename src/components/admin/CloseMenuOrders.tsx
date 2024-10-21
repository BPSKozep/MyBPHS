"use client";

import React from "react";
import IconSubmitButton from "components/IconSubmitButton";
import { FaCalendarXmark } from "react-icons/fa6";
import sleep from "utils/sleep";
import { trpc } from "utils/trpc";
import { getWeek, getWeekYear } from "utils/isoweek";

function CloseMenuOrders() {
    const { mutateAsync: setIsOpen } = trpc.menu.setIsopen.useMutation();

    const { mutateAsync: sendDiscordWebhook } =
        trpc.webhook.sendDiscordWebhook.useMutation();

    return (
        <>
            <h2 className="mb-3 mt-5 font-bold text-white">
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

                            await setIsOpen({
                                week: getWeek(date),
                                year: getWeekYear(date),
                                isOpen: false,
                            });

                            await sendDiscordWebhook({
                                type: "Lunch",
                                message: "Beküldések lezárva. ❌",
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
        </>
    );
}

export default CloseMenuOrders;
