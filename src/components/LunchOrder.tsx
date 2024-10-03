"use client";

import React, { useMemo, useState, useEffect } from "react";
import Card from "components/Card";
import OrderForm from "components/OrderForm";
import IconSubmitButton from "components/IconSubmitButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEnvelope,
    faArrowLeft,
    faArrowRight,
    faEdit,
} from "@fortawesome/free-solid-svg-icons";
import { trpc } from "utils/trpc";
import sleep from "utils/sleep";
import { getWeek, getWeekYear } from "utils/isoweek";
import menuCombine from "utils/menuCombine";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import IconButton from "components/IconButton";
import { useSession } from "next-auth/react";
import PageWithHeader from "components/PageWithHeader";

function LunchOrder() {
    const [weekOffset, setWeekOffset] = useState(1);

    const [orderEditing, setOrderEditing] = useState(false);

    const [year, week] = useMemo(() => {
        const date = new Date();
        date.setDate(date.getDate() + weekOffset * 7);
        setOrderEditing(false);

        return [getWeekYear(date), getWeek(date)];
    }, [weekOffset]);

    const { data: menu, isLoading } = trpc.menu.get.useQuery({ year, week });

    const { data: order, refetch: refetchOrder } = trpc.order.get.useQuery({
        year,
        week,
    });

    const orderExists = order && order.length > 0;

    const [selectedOptions, setSelectedOptions] = useState<string[]>(
        orderExists
            ? order.map((day) => day.chosen)
            : Array(5).fill("i_am_not_want_food"),
    );

    useEffect(() => {
        if (orderExists) {
            setSelectedOptions(order.map((day) => day.chosen));
        } else {
            setSelectedOptions(Array(5).fill("i_am_not_want_food"));
        }
    }, [orderExists, weekOffset, order]);

    const { mutateAsync: createOrder } = trpc.order.create.useMutation();

    const { mutateAsync: editOrder } = trpc.order.edit.useMutation();

    const { mutateAsync: sendDiscordWebhook } =
        trpc.webhook.sendDiscordWebhook.useMutation();

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
        <PageWithHeader title="Ebédrendelés">
            <div className="flex w-full justify-center text-white">
                <div className="m-auto">
                    {showText && (
                        <Card>
                            <div className="flex flex-col gap-4">
                                <div className="flex w-full items-center">
                                    <IconButton
                                        icon={
                                            <FontAwesomeIcon
                                                icon={faArrowLeft}
                                            />
                                        }
                                        onClick={() =>
                                            setWeekOffset(
                                                (offset) => offset - 1,
                                            )
                                        }
                                    />
                                    <h1 className="mx-2 text-center text-base font-bold md:text-lg">
                                        {isLoading && "Menü betöltése..."}
                                        {noMenu &&
                                            "Nincs még feltöltve a menü."}
                                        {menuClosed &&
                                            "A rendelés már le lett zárva."}
                                        {` (${year}. ${week}. hét)`}
                                    </h1>
                                    <IconButton
                                        icon={
                                            <FontAwesomeIcon
                                                icon={faArrowRight}
                                            />
                                        }
                                        onClick={() =>
                                            setWeekOffset(
                                                (offset) => offset + 1,
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </Card>
                    )}
                    {showMenu && (
                        <Card>
                            {orderExists && menu.isOpenForOrders && (
                                <div className="mb-5">
                                    <div className="absolute -right-[0.9rem] -top-[0.9rem]">
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileFocus={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 500,
                                                damping: 20,
                                            }}
                                            onClick={() => {
                                                setOrderEditing(!orderEditing);

                                                const newSelectedOptions =
                                                    order.map(
                                                        (day) => day.chosen,
                                                    );

                                                setSelectedOptions(
                                                    newSelectedOptions,
                                                );
                                            }}
                                        >
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-600 drop-shadow-2xl">
                                                <FontAwesomeIcon
                                                    icon={faEdit}
                                                />
                                            </div>
                                        </motion.button>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col items-center justify-center gap-4">
                                <motion.div
                                    className="flex w-full items-center justify-between"
                                    initial={{
                                        opacity: 1,
                                        height: "auto",
                                    }}
                                    animate={{
                                        opacity: orderEditing ? 0 : 1,
                                        height: orderEditing ? 0 : "auto",
                                    }}
                                    transition={{
                                        height: {
                                            delay: orderEditing ? 0.2 : 0,
                                        },
                                    }}
                                >
                                    <IconButton
                                        icon={
                                            <FontAwesomeIcon
                                                icon={faArrowLeft}
                                            />
                                        }
                                        onClick={() =>
                                            setWeekOffset(
                                                (offset) => offset - 1,
                                            )
                                        }
                                        disabled={orderEditing}
                                    />
                                    <h1 className="mx-1 inline-block text-center text-base font-bold text-white md:text-lg">
                                        {orderExists
                                            ? `Leadott rendelés (${year}. ${week}. hét)`
                                            : `Rendelés (${year}. ${week}. hét)`}
                                    </h1>
                                    <IconButton
                                        icon={
                                            <FontAwesomeIcon
                                                icon={faArrowRight}
                                            />
                                        }
                                        onClick={() =>
                                            setWeekOffset(
                                                (offset) => offset + 1,
                                            )
                                        }
                                        disabled={orderEditing}
                                    />
                                </motion.div>

                                <>
                                    <OrderForm
                                        options={menu.options.map((menuDay) => {
                                            if (
                                                !menuDay["a-menu"] &&
                                                !menuDay["b-menu"]
                                            ) {
                                                const newMenuDay = menuCombine(
                                                    menuDay,
                                                    false,
                                                );

                                                Object.keys(newMenuDay).forEach(
                                                    (key) =>
                                                        (newMenuDay[key] = ""),
                                                );

                                                return newMenuDay;
                                            }

                                            return menuCombine(menuDay, false);
                                        })}
                                        selectedOptions={selectedOptions}
                                        onChange={(chosenOptions) => {
                                            if (orderEditing || !orderExists) {
                                                setSelectedOptions(
                                                    chosenOptions,
                                                );
                                            }
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
                                                                },
                                                            );

                                                            sleep(1700).then(
                                                                () => {
                                                                    refetchOrder();
                                                                },
                                                            );

                                                            return true;
                                                        } catch (err) {
                                                            await sendDiscordWebhook(
                                                                {
                                                                    type: "Error",
                                                                    message:
                                                                        String(
                                                                            err,
                                                                        ),
                                                                },
                                                            );
                                                            return false;
                                                        }
                                                    }}
                                                />
                                            </motion.div>
                                        )}

                                        {orderEditing && (
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
                                                            icon={faEdit}
                                                        />
                                                    }
                                                    onClick={async () => {
                                                        try {
                                                            await sleep(500);

                                                            await editOrder({
                                                                week,
                                                                year,
                                                                chosenOptions:
                                                                    selectedOptions,
                                                            });

                                                            await setOrderEditing(
                                                                false,
                                                            );

                                                            await sendDiscordWebhook(
                                                                {
                                                                    type: "Lunch",
                                                                    message:
                                                                        userEmail +
                                                                        " szerkesztette a rendelését. ✍️",
                                                                },
                                                            );

                                                            return true;
                                                        } catch (err) {
                                                            await sendDiscordWebhook(
                                                                {
                                                                    type: "Error",
                                                                    message:
                                                                        String(
                                                                            err,
                                                                        ),
                                                                },
                                                            );
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
        </PageWithHeader>
    );
}

export default LunchOrder;
