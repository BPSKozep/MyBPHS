import React, { useState } from "react";
import PageWithHeader from "components/PageWithHeader";
import Card from "components/Card";
import LunchOrders from "components/LunchOrders";
import SetMenuForm from "components/SetMenuForm";
import OnlyRoles from "components/OnlyRoles";
import { trpc } from "utils/trpc";
import IconSubmitButton from "components/IconSubmitButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faCalendarXmark } from "@fortawesome/free-solid-svg-icons";
import sleep from "utils/sleep";
import { getWeek, getWeekYear } from "utils/isoweek";

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

    const { mutateAsync: setIsOpen } = trpc.menu.setIsopen.useMutation();

    return (
        <OnlyRoles roles={["administrator"]}>
            <PageWithHeader title="Admin | Ebédrendelés" homeLocation="/admin">
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

                                            return true;
                                        } catch (err) {
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
                        <div className="flex w-44 flex-col items-center justify-center">
                            <h2 className="mb-3 mt-5 text-white">
                                Beküldések lezárása
                            </h2>
                            <div>
                                <IconSubmitButton
                                    icon={
                                        <FontAwesomeIcon
                                            icon={faCalendarXmark}
                                        />
                                    }
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

                                            return true;
                                        } catch (err) {
                                            return false;
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            </PageWithHeader>
        </OnlyRoles>
    );
}
