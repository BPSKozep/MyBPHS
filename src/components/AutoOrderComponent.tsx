"use client";

import React from "react";
import IconSubmitButton from "./IconSubmitButton";
import sleep from "utils/sleep";
import { RiRobot2Line } from "react-icons/ri";
import { trpc } from "utils/trpc";

function AutoOrderComponent() {
    const { mutateAsync: sendDiscordWebhook } =
        trpc.webhook.sendDiscordWebhook.useMutation();

    return (
        <div className="text-center text-white">
            <IconSubmitButton
                icon={<RiRobot2Line />}
                className="mt-5"
                onClick={async () => {
                    try {
                        await sleep(500);

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
