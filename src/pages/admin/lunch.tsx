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
import NFCInput from "components/NFCInput";

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

    // const date = new Date();

    // const year = getWeekYear(date);
    // const week = getWeek(date);

    const { mutateAsync: createMenu } = trpc.menu.create.useMutation();

    const { mutateAsync: sendEmail } = trpc.email.sendLunchEmail.useMutation();

    const { mutateAsync: sendDiscordWebhook } =
        trpc.webhook.sendDiscordWebhook.useMutation();

    const { mutateAsync: setIsOpen } = trpc.menu.setIsopen.useMutation();

    const [nfcId, setNfcId] = useState<string>("");
    const {
        data: user,
        isFetched,
        isLoading,
    } = trpc.user.getUserByNfcId.useQuery(nfcId);

    // const { data: order, isLoading: orderloading } = trpc.order.get.useQuery({
    //     email: user?.email,
    //     year,
    //     week,
    // });

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
                            <h2 className="mb-3 mt-5 font-bold text-white">
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

                                            await sendDiscordWebhook({
                                                type: "Lunch",
                                                message:
                                                    "Beküldések lezárva. ❌",
                                            });

                                            return true;
                                        } catch (err) {
                                            return false;
                                        }
                                    }}
                                />
                            </div>
                            <h2 className="mt-8 font-bold text-white">
                                Token Ellenőrzés
                            </h2>
                            <div className="m-3">
                                <NFCInput nfc={true} onChange={setNfcId} />
                            </div>
                            {nfcId && !user && isFetched && (
                                <h2 className="text-white">
                                    Nem érvényes NFC token
                                </h2>
                            )}
                            {nfcId && isLoading && (
                                <h2 className="text-white">Betöltés...</h2>
                            )}
                            {user && (
                                <div>
                                    <h2 className="text-white">{user.name}</h2>
                                    {/* <table className="mt-8 text-white">
                                        <thead>
                                            <tr>
                                                <th>Nap</th>
                                                <th>Rendelt</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {order &&
                                                order.map((order) => (
                                                    <tr key={order.chosen}>
                                                        <td>{order.chosen}</td>
                                                        <td>
                                                            {order.completed}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table> */}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </PageWithHeader>
        </OnlyRoles>
    );
}
