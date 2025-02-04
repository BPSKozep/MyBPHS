"use client";

import React, { useMemo, useState, useEffect } from "react";
import Card from "components/Card";
import OrderForm from "components/OrderForm";
import ClosedOrderForm from "components/ClosedOrderForm";
import IconSubmitButton from "components/IconSubmitButton";
import {
    FaEnvelope,
    FaArrowLeft,
    FaArrowRight,
    FaEdit,
    FaChevronDown,
} from "react-icons/fa";
import { trpc } from "utils/trpc";
import sleep from "utils/sleep";
import { getWeek, getWeekYear } from "utils/isoweek";
import menuCombine from "utils/menuCombine";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import IconButton from "components/IconButton";
import { useSession } from "next-auth/react";
import PageWithHeader from "components/PageWithHeader";
import Paywall from "./Paywall";

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

    const [closedMenuShown, setClosedMenuShown] = useState(false);

    return (
        <PageWithHeader title="Ebédrendelés">
            <Paywall>
                <div className="flex w-full justify-center text-white">
                    <div className="m-auto">
                        {showText && (
                            <Card>
                                <div className="flex flex-col gap-4">
                                    <div className="flex w-full items-center justify-center">
                                        <IconButton
                                            icon={<FaArrowLeft />}
                                            onClick={() => {
                                                setWeekOffset(
                                                    (offset) => offset - 1,
                                                );
                                                setClosedMenuShown(false);
                                            }}
                                        />
                                        <div className="text-center">
                                            <p className="mx-2 text-center text-lg font-bold md:text-xl">{`${year}. ${week}. hét`}</p>
                                            <p className="mx-2 text-center text-base font-bold md:text-lg">
                                                {isLoading &&
                                                    "Menü betöltése..."}
                                                {noMenu &&
                                                    "Nincs még feltöltve a menü."}
                                                {menuClosed &&
                                                    "A rendelés már le lett zárva."}
                                            </p>
                                        </div>
                                        <IconButton
                                            icon={<FaArrowRight />}
                                            onClick={() => {
                                                setWeekOffset(
                                                    (offset) => offset + 1,
                                                );
                                                setClosedMenuShown(false);
                                            }}
                                        />
                                    </div>
                                    {menuClosed && (
                                        <motion.div
                                            className="flex cursor-pointer flex-row items-center justify-center gap-2 text-center"
                                            onClick={() =>
                                                setClosedMenuShown(
                                                    !closedMenuShown,
                                                )
                                            }
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <span>Menü megtekintése</span>
                                            <motion.div
                                                animate={{
                                                    rotate: closedMenuShown
                                                        ? 180
                                                        : 0,
                                                }}
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 200,
                                                    damping: 20,
                                                }}
                                            >
                                                <FaChevronDown className="h-4 w-4" />
                                            </motion.div>
                                        </motion.div>
                                    )}

                                    <AnimatePresence mode="sync">
                                        {closedMenuShown && menu && (
                                            <motion.div
                                                variants={{
                                                    opened: {
                                                        opacity: 1,
                                                        height: "auto",
                                                        y: 0,
                                                        transition: {
                                                            height: {
                                                                type: "spring",
                                                                stiffness: 100,
                                                                damping: 20,
                                                            },
                                                            opacity: {
                                                                duration: 0.2,
                                                            },
                                                            y: {
                                                                type: "spring",
                                                                stiffness: 100,
                                                                damping: 20,
                                                            },
                                                        },
                                                    },
                                                    closed: {
                                                        opacity: 0,
                                                        height: 0,
                                                        y: -20,
                                                        transition: {
                                                            height: {
                                                                duration: 0.2,
                                                            },
                                                            opacity: {
                                                                duration: 0.2,
                                                            },
                                                            y: {
                                                                duration: 0.2,
                                                            },
                                                        },
                                                    },
                                                }}
                                                initial="closed"
                                                animate="opened"
                                                exit="closed"
                                                className="overflow-hidden"
                                            >
                                                <ClosedOrderForm
                                                    options={menu.options}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
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
                                                    setOrderEditing(
                                                        !orderEditing,
                                                    );

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
                                                    <FaEdit />
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
                                            icon={<FaArrowLeft />}
                                            onClick={() => {
                                                setWeekOffset(
                                                    (offset) => offset - 1,
                                                );
                                                setClosedMenuShown(false);
                                            }}
                                            disabled={orderEditing}
                                        />
                                        <div className="text-center">
                                            <p className="mx-2 text-center text-lg font-bold md:text-xl">{`${year}. ${week}. hét`}</p>
                                            <p className="mx-1 inline-block text-center text-base font-bold text-white md:text-lg">
                                                {orderExists
                                                    ? `Leadott rendelés`
                                                    : `Rendelés`}
                                            </p>
                                        </div>
                                        <IconButton
                                            icon={<FaArrowRight />}
                                            onClick={() => {
                                                setWeekOffset(
                                                    (offset) => offset + 1,
                                                );
                                                setClosedMenuShown(false);
                                            }}
                                            disabled={orderEditing}
                                        />
                                    </motion.div>

                                    <>
                                        <OrderForm
                                            options={menu.options.map(
                                                (menuDay) => {
                                                    if (
                                                        !menuDay["a-menu"] &&
                                                        !menuDay["b-menu"]
                                                    ) {
                                                        const newMenuDay =
                                                            menuCombine(
                                                                menuDay,
                                                                false,
                                                            );

                                                        Object.keys(
                                                            newMenuDay,
                                                        ).forEach(
                                                            (key) =>
                                                                (newMenuDay[
                                                                    key
                                                                ] = ""),
                                                        );

                                                        return newMenuDay;
                                                    }

                                                    return menuCombine(
                                                        menuDay,
                                                        false,
                                                    );
                                                },
                                            )}
                                            selectedOptions={selectedOptions}
                                            onChange={(chosenOptions) => {
                                                if (
                                                    orderEditing ||
                                                    !orderExists
                                                ) {
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
                                                        icon={<FaEnvelope />}
                                                        onClick={async () => {
                                                            try {
                                                                await sleep(
                                                                    500,
                                                                );

                                                                await createOrder(
                                                                    {
                                                                        week,
                                                                        year,
                                                                        chosenOptions:
                                                                            selectedOptions,
                                                                    },
                                                                );

                                                                await sendDiscordWebhook(
                                                                    {
                                                                        type: "Lunch",
                                                                        message:
                                                                            userEmail +
                                                                            " beküldte a rendelést. 📨",
                                                                    },
                                                                );

                                                                sleep(
                                                                    1700,
                                                                ).then(() => {
                                                                    refetchOrder();
                                                                });

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
                                                        icon={<FaEdit />}
                                                        onClick={async () => {
                                                            try {
                                                                await sleep(
                                                                    500,
                                                                );

                                                                await editOrder(
                                                                    {
                                                                        week,
                                                                        year,
                                                                        chosenOptions:
                                                                            selectedOptions,
                                                                    },
                                                                );

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
            </Paywall>
        </PageWithHeader>
    );
}

export default LunchOrder;
