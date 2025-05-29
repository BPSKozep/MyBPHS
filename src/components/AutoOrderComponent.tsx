"use client";

import React from "react";
import IconSubmitButton from "./IconSubmitButton";
import sleep from "@/utils/sleep";
import { RiRobot2Line } from "react-icons/ri";
import { api } from "@/trpc/react";

export default function AutoOrderComponent() {
    const sendDiscordWebhook = api.webhook.sendDiscordWebhook.useMutation();

    return (
        <div className="text-center text-white">
            <IconSubmitButton
                icon={<RiRobot2Line />}
                className="mt-5"
                onClick={async () => {
                    try {
                        await sleep(500);

                        return true;
                    } catch (error) {
                        await sendDiscordWebhook.mutateAsync({
                            type: "Error",
                            message: String(error),
                        });
                        return false;
                    }
                }}
            />
        </div>
    );
}
