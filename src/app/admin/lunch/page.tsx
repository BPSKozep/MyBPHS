"use client";

import React, { useState } from "react";
import PageWithHeader from "components/PageWithHeader";
import Card from "components/Card";
import LunchOrders from "components/admin/LunchOrders";
import SetMenuForm from "components/admin/SetMenuForm";
import OnlyRoles from "components/OnlyRoles";
import { trpc } from "utils/trpc";
import IconSubmitButton from "components/IconSubmitButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import sleep from "utils/sleep";
import { getWeek, getWeekYear } from "utils/isoweek";
import TokenCheck from "components/admin/TokenCheck";
import CloseMenuOrders from "components/admin/CloseMenuOrders";

// export const metadata = {
//     title: "MyBPHS - Admin / Ebédrendelés",
// };

export default function LunchAdmin() {
    const [menuOptions, setMenuOptions] = useState(
        Array(5)
            .fill(0)
            .map(() => {
                return {
                    "a-menu": "",
                    "b-menu": "",
                };
            })
    );

    const { mutateAsync: createMenu } = trpc.menu.create.useMutation();

    const { mutateAsync: sendEmail } = trpc.email.sendLunchEmail.useMutation();

    const { mutateAsync: sendDiscordWebhook } =
        trpc.webhook.sendDiscordWebhook.useMutation();

    return (
        <OnlyRoles roles={["administrator"]}>
            <PageWithHeader title="Admin / Ebédrendelés" homeLocation="/admin">
                <div className="flex flex-col justify-center lg:flex-row">
                    <Card>
                        <div className="flex flex-col items-center justify-center">
                            <SetMenuForm onChange={setMenuOptions} />
                            <h2 className="mb-3 mt-5 text-white">
                                Mentés és email kiküldése:
                            </h2>
                            <div>
                                <IconSubmitButton
                                    icon={<FontAwesomeIcon icon={faEnvelope} />}
                                    onClick={async () => {
                                        try {
                                            await sleep(500);

                                            const date = new Date();
                                            date.setDate(date.getDate() + 7);

                                            await createMenu({
                                                options: menuOptions,
                                                week: getWeek(date),
                                                year: getWeekYear(date),
                                            });

                                            await sendEmail();

                                            await sendDiscordWebhook({
                                                type: "Lunch",
                                                message:
                                                    "Új menü feltöltve, email kiküldve. 📩",
                                            });

                                            return true;
                                        } catch (err) {
                                            // await sendDiscordWebhook({
                                            //     type: "Error",
                                            //     message: err,
                                            // });
                                            return false;
                                        }
                                    }}
                                />
                            </div>
                            <span className="mt-3 font-bold text-white">
                                Címzettek:
                            </span>
                            {process.env.NEXT_PUBLIC_TO_EMAILS?.split(",").map(
                                (email, index) => (
                                    <span className="text-white" key={index}>
                                        {email}
                                    </span>
                                )
                            )}
                        </div>
                    </Card>
                    <Card>
                        <LunchOrders />
                    </Card>
                    <Card>
                        <div className="flex flex-col items-center justify-center text-center">
                            <CloseMenuOrders />
                            <hr className="border-1 my-5 h-1 w-full bg-gray-900" />
                            <TokenCheck />
                        </div>
                    </Card>
                </div>
            </PageWithHeader>
        </OnlyRoles>
    );
}
