"use client";

import React, { useMemo, useState } from "react";
import Card from "components/Card";
import OrderForm from "components/OrderForm";
import IconSubmitButton from "components/IconSubmitButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEnvelope,
    faArrowLeft,
    faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { trpc } from "utils/trpc";
import sleep from "utils/sleep";
import { getWeek, getWeekYear } from "utils/isoweek";
import menuCombine from "utils/menuCombine";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import IconButton from "components/IconButton";
import { useSession } from "next-auth/react";

function LunchOrder() {
    const [selectedOptions, setSelectedOptions] = useState<string[]>(
        Array(5).fill("i_am_not_want_food")
    );

    const [weekOffset, setWeekOffset] = useState(1);

    const [year, week] = useMemo(() => {
        const date = new Date();
        date.setDate(date.getDate() + weekOffset * 7);

        return [getWeekYear(date), getWeek(date)];
    }, [weekOffset]);

    const { data: menu, isLoading } = trpc.menu.get.useQuery({ year, week });

    const { data: order, refetch: refetchOrder } = trpc.order.get.useQuery({
        year,
        week,
    });

    const { mutateAsync: createOrder } = trpc.order.create.useMutation();

    const { mutateAsync: sendDiscordWebhook } =
        trpc.webhook.sendDiscordWebhook.useMutation();

    const orderExists = order && order.length > 0;

    const showMenu =
        menu &&
        menu.options.length > 0 &&
        (orderExists || menu.isOpenForOrders === true);

    const noMenu = !isLoading && (!menu || menu.options.length === 0);

    const menuClosed =
        !isLoading && !noMenu && !orderExists && !menu?.isOpenForOrders;

    const showText = isLoading || noMenu || menuClosed;

    const userEmail = useSession().data?.user?.email;

    return (
        <div className="flex h-full w-full justify-center text-white">
            <div className="m-auto">
                {showText && (
                    <div className="flex flex-col items-center md:flex-row">
                        <IconButton
                            icon={<FontAwesomeIcon icon={faArrowLeft} />}
                            onClick={() =>
                                setWeekOffset((offset) => offset - 1)
                            }
                            className="m-3 w-full md:w-auto"
                        />
                        <h1 className="text-center text-lg font-bold">
                            {isLoading && "Menü betöltése..."}
                            {noMenu && "Nincs még feltöltve a menü."}
                            {menuClosed && "A rendelés már le lett zárva."}
                            {` (${year}. ${week}. hét)`}
                        </h1>
                        <IconButton
                            icon={<FontAwesomeIcon icon={faArrowRight} />}
                            onClick={() =>
                                setWeekOffset((offset) => offset + 1)
                            }
                            className="m-3 w-full md:w-auto"
                        />
                    </div>
                )}
                {showMenu && (
                    <Card>
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className="flex w-full items-center justify-between">
                                <IconButton
                                    icon={
                                        <FontAwesomeIcon icon={faArrowLeft} />
                                    }
                                    onClick={() =>
                                        setWeekOffset((offset) => offset - 1)
                                    }
                                />
                                <h1 className="inline-block text-center font-bold text-white">
                                    {orderExists
                                        ? `Leadott rendelés (${year}. ${week}. hét)`
                                        : `Rendelés (${year}. ${week}. hét)`}
                                </h1>
                                <IconButton
                                    icon={
                                        <FontAwesomeIcon icon={faArrowRight} />
                                    }
                                    onClick={() =>
                                        setWeekOffset((offset) => offset + 1)
                                    }
                                />
                            </div>

                            <>
                                <OrderForm
                                    options={menu.options.map((menuDay) => {
                                        if (
                                            !menuDay["a-menu"] &&
                                            !menuDay["b-menu"]
                                        ) {
                                            const newMenuDay = menuCombine(
                                                menuDay,
                                                false
                                            );

                                            Object.keys(newMenuDay).forEach(
                                                (key) => (newMenuDay[key] = "")
                                            );

                                            return newMenuDay;
                                        }

                                        return menuCombine(menuDay, false);
                                    })}
                                    selectedOptions={
                                        orderExists
                                            ? order.map((day) => day.chosen)
                                            : selectedOptions
                                    }
                                    onChange={(chosenOptions) => {
                                        if (orderExists) return;

                                        setSelectedOptions(chosenOptions);
                                    }}
                                />

                                <AnimatePresence>
                                    {!orderExists && (
                                        <motion.div
                                            initial={{
                                                opacity: 1,
                                                height: "auto",
                                            }}
                                            exit={{
                                                opacity: 0,
                                                height: 0,
                                            }}
                                            transition={{
                                                height: { delay: 0.5 },
                                            }}
                                        >
                                            <IconSubmitButton
                                                icon={
                                                    <FontAwesomeIcon
                                                        icon={faEnvelope}
                                                    />
                                                }
                                                onClick={async () => {
                                                    try {
                                                        await sleep(500);

                                                        await createOrder({
                                                            week,
                                                            year,
                                                            chosenOptions:
                                                                selectedOptions,
                                                        });

                                                        await sendDiscordWebhook(
                                                            {
                                                                type: "Lunch",
                                                                message:
                                                                    userEmail +
                                                                    " beküldte a rendelést. 📨",
                                                            }
                                                        );

                                                        sleep(1700).then(() => {
                                                            refetchOrder();
                                                        });

                                                        return true;
                                                    } catch (err) {
                                                        return false;
                                                    }
                                                }}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}

export default LunchOrder;
