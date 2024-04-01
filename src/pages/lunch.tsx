import React, { useMemo, useState } from "react";
import PageWithHeader from "components/PageWithHeader";
import Card from "components/Card";
import OrderForm from "components/OrderForm";
import IconSubmitButton from "components/IconSubmitButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { trpc } from "utils/trpc";
import sleep from "utils/sleep";
import { getWeek, getWeekYear } from "utils/isoweek";
import menuCombine from "utils/menuCombine";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";

function Order() {
    const [selectedOptions, setSelectedOptions] = useState<string[]>(
        Array(5).fill("i_am_not_want_food")
    );

    const [year, week] = useMemo(() => {
        const date = new Date();
        date.setDate(date.getDate() + 7);

        return [getWeekYear(date), getWeek(date)];
    }, []);

    const { data: menu } = trpc.menu.get.useQuery({ year, week });

    const { data: order, refetch: refetchOrder } = trpc.order.get.useQuery({
        year,
        week,
    });

    const { mutateAsync: createOrder } = trpc.order.create.useMutation();

    const orderExists = order && order.length > 0;

    return (
        <>
            <PageWithHeader title="Ebédrendelés">
                <div className="flex h-full w-full text-white">
                    <div className="m-auto">
                        {(!menu || menu.length === 0) && (
                            <h1 className="text-lg font-bold">
                                Nincs még feltöltve a menü.
                            </h1>
                        )}
                        {menu && menu.length > 0 && (
                            <Card>
                                <div className="flex flex-col items-center justify-center gap-4">
                                    <h1 className="text-center font-bold text-white">
                                        {orderExists
                                            ? "Leadott rendelés"
                                            : "Rendelés"}
                                    </h1>

                                    <>
                                        <OrderForm
                                            options={menu.map((menuDay) => {
                                                if (
                                                    !menuDay["a-menu"] &&
                                                    !menuDay["b-menu"]
                                                ) {
                                                    const newMenuDay =
                                                        menuCombine(
                                                            menuDay,
                                                            false
                                                        );

                                                    Object.keys(
                                                        newMenuDay
                                                    ).forEach(
                                                        (key) =>
                                                            (newMenuDay[key] =
                                                                "")
                                                    );

                                                    return newMenuDay;
                                                }

                                                return menuCombine(
                                                    menuDay,
                                                    false
                                                );
                                            })}
                                            selectedOptions={
                                                orderExists
                                                    ? order.map(
                                                          (day) => day.chosen
                                                      )
                                                    : selectedOptions
                                            }
                                            onChange={(chosenOptions) => {
                                                if (orderExists) return;

                                                setSelectedOptions(
                                                    chosenOptions
                                                );
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
                                                                icon={
                                                                    faEnvelope
                                                                }
                                                            />
                                                        }
                                                        onClick={async () => {
                                                            try {
                                                                await sleep(
                                                                    500
                                                                );

                                                                await createOrder(
                                                                    {
                                                                        week,
                                                                        year,
                                                                        chosenOptions:
                                                                            selectedOptions,
                                                                    }
                                                                );

                                                                sleep(
                                                                    1700
                                                                ).then(() => {
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
            </PageWithHeader>
        </>
    );
}

export default Order;
