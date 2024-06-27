import React from "react";
import IconSubmitButton from "components/IconSubmitButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarXmark } from "@fortawesome/free-solid-svg-icons";
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
                    icon={<FontAwesomeIcon icon={faCalendarXmark} />}
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
                            return false;
                        }
                    }}
                />
            </div>
        </>
    );
}

export default CloseMenuOrders;
