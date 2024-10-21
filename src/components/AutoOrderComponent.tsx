"use client";

import React, { useState } from "react";
import AutoOrderForm from "./AutoOrderForm";
import menuCombine from "utils/menuCombine";
import IconSubmitButton from "./IconSubmitButton";
import sleep from "utils/sleep";
import { RiRobot2Line } from "react-icons/ri";
import { trpc } from "utils/trpc";

function AutoOrderComponent() {
    const { data: autoOrder } = trpc.user.getAutoOrder.useQuery();

    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

    React.useEffect(() => {
        if (autoOrder) {
            setSelectedOptions(autoOrder);
        } else {
            setSelectedOptions(Array(5).fill("i_am_not_want_food"));
        }
    }, [autoOrder]);

    const options = [
        { "a-menu": "A Menü", "b-menu": "B Menü" },
        { "a-menu": "A Menü", "b-menu": "B Menü" },
        { "a-menu": "A Menü", "b-menu": "B Menü" },
        { "a-menu": "A Menü", "b-menu": "B Menü" },
        { "a-menu": "A Menü", "b-menu": "B Menü" },
    ];

    const { mutateAsync: sendDiscordWebhook } =
        trpc.webhook.sendDiscordWebhook.useMutation();

    const { mutateAsync: setAutoOrder } = trpc.user.setAutoOrder.useMutation();

    return (
        <div className="text-center text-white">
            <AutoOrderForm
                options={options.map((menuDay) => {
                    if (!menuDay["a-menu"] && !menuDay["b-menu"]) {
                        const newMenuDay = menuCombine(menuDay, false);

                        Object.keys(newMenuDay).forEach(
                            (key) => (newMenuDay[key] = ""),
                        );

                        return newMenuDay;
                    }

                    return menuCombine(menuDay, false);
                })}
                selectedOptions={selectedOptions}
                onChange={(chosenOptions) => {
                    setSelectedOptions(chosenOptions);
                }}
            />
            <IconSubmitButton
                icon={<RiRobot2Line />}
                className="mt-5"
                onClick={async () => {
                    try {
                        await sleep(500);

                        await setAutoOrder({
                            chosenOptions: selectedOptions,
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
    );
}

export default AutoOrderComponent;
