import React, { useState } from "react";
import PageWithHeader from "components/PageWithHeader";
import Card from "components/Card";
import LunchOrders from "components/LunchOrders";
import SetMenuForm from "components/SetMenuForm";
import OnlyRoles from "components/OnlyRoles";
import { trpc } from "utils/trpc";
import IconSubmitButton from "components/IconSubmitButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import sleep from "utils/sleep";

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

    return (
        <OnlyRoles roles={["administrator"]}>
            <PageWithHeader title="Ebédrendelés Admin">
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

                                            await createMenu({
                                                options: menuOptions,
                                            });

                                            await sendEmail();

                                            return true;
                                        } catch (err) {
                                            return false;
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <LunchOrders />
                    </Card>
                </div>
            </PageWithHeader>
        </OnlyRoles>
    );
}