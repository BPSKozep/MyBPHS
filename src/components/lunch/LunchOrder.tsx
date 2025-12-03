"use client";

import { AnimatePresence, motion } from "motion/react";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaChevronDown,
  FaEdit,
  FaEnvelope,
} from "react-icons/fa";
import Card from "@/components/Card";
import IconButton from "@/components/IconButton";
import IconSubmitButton from "@/components/IconSubmitButton";
import ClosedOrderForm from "@/components/lunch/ClosedOrderForm";
import OrderForm from "@/components/lunch/OrderForm";
import PageWithHeader from "@/components/PageWithHeader";
import Paywall from "@/components/Paywall";
import { api } from "@/trpc/react";
import { getWeek, getWeekYear } from "@/utils/isoweek";
import menuCombine from "@/utils/menuCombine";
import sleep from "@/utils/sleep";

function LunchOrder() {
  const [weekOffset, setWeekOffset] = useState(1);

  const [orderEditing, setOrderEditing] = useState(false);

  const [year, week, weekStartTimestamp] = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + weekOffset * 7);
    setOrderEditing(false);

    // Calculate Monday of this week
    const dayOfWeek = date.getDay() || 7; // Sunday = 7
    const monday = new Date(date);
    monday.setDate(date.getDate() - dayOfWeek + 1);
    monday.setHours(0, 0, 0, 0);

    return [getWeekYear(date), getWeek(date), monday.getTime()];
  }, [weekOffset]);

  const menu = api.menu.get.useQuery({ year, week });

  const order = api.order.get.useQuery({
    year,
    week,
  });

  const orderExists = order.data && order.data.length > 0;

  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    orderExists
      ? (order.data?.map((day) => day.chosen) ?? [])
      : Array(5).fill("i_am_not_want_food"),
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: todo review deps
  useEffect(() => {
    if (orderExists) {
      setSelectedOptions(order.data?.map((day) => day.chosen) ?? []);
    } else {
      setSelectedOptions(Array(5).fill("i_am_not_want_food"));
    }
  }, [orderExists, weekOffset, order.data]);

  const createOrder = api.order.create.useMutation();

  const editOrder = api.order.edit.useMutation();

  const sendDiscordWebhook = api.webhook.sendDiscordWebhook.useMutation();

  const showMenu =
    menu.data &&
    menu.data.options.length > 0 &&
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    (orderExists || menu.data.isOpenForOrders);

  const noMenu =
    !menu.isLoading && (!menu.data || menu.data.options.length === 0);

  const menuClosed =
    !menu.isLoading && !noMenu && !orderExists && !menu.data?.isOpenForOrders;

  const showText = menu.isLoading || order.isLoading || noMenu || menuClosed;

  const [closedMenuShown, setClosedMenuShown] = useState(false);

  const session = useSession();

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
                        setWeekOffset((offset) => offset - 1);
                        setClosedMenuShown(false);
                      }}
                      className="cursor-pointer"
                    />
                    <div className="text-center">
                      <p className="mx-2 text-center text-lg font-bold md:text-xl">{`${year}. ${week}. hét`}</p>
                      <p className="mx-2 text-center text-base font-bold md:text-lg">
                        {menu.isLoading && "Menü betöltése..."}
                        {noMenu && "Nincs még feltöltve a menü."}
                        {menuClosed && "A rendelés már le lett zárva."}
                      </p>
                    </div>
                    <IconButton
                      icon={<FaArrowRight />}
                      onClick={() => {
                        setWeekOffset((offset) => offset + 1);
                        setClosedMenuShown(false);
                      }}
                      className="cursor-pointer"
                    />
                  </div>
                  {menuClosed && (
                    <motion.div
                      className="flex cursor-pointer flex-row items-center justify-center gap-2 text-center"
                      onClick={() => setClosedMenuShown(!closedMenuShown)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span>Menü megtekintése</span>
                      <motion.div
                        animate={{
                          rotate: closedMenuShown ? 180 : 0,
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
                        <ClosedOrderForm options={menu.data?.options ?? []} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            )}
            {showMenu && (
              <Card>
                {orderExists && menu.data.isOpenForOrders && (
                  <div className="mb-5">
                    <div className="absolute -top-[0.9rem] -right-[0.9rem]">
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

                          const newSelectedOptions = order.data?.map(
                            (day) => day.chosen,
                          );

                          setSelectedOptions(newSelectedOptions);
                        }}
                      >
                        <div className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-slate-600 drop-shadow-2xl">
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
                        setWeekOffset((offset) => offset - 1);
                        setClosedMenuShown(false);
                      }}
                      disabled={orderEditing}
                      className="cursor-pointer"
                    />
                    <div className="text-center">
                      <p className="mx-2 text-center text-lg font-bold md:text-xl">{`${year}. ${week}. hét`}</p>
                      <p className="mx-1 inline-block text-center text-base font-bold text-white md:text-lg">
                        {orderExists ? `Leadott rendelés` : `Rendelés`}
                      </p>
                    </div>
                    <IconButton
                      icon={<FaArrowRight />}
                      onClick={() => {
                        setWeekOffset((offset) => offset + 1);
                        setClosedMenuShown(false);
                      }}
                      disabled={orderEditing}
                      className="cursor-pointer"
                    />
                  </motion.div>

                  <OrderForm
                    options={menu.data?.options?.map((menuDay) => {
                      if (!menuDay["a-menu"] && !menuDay["b-menu"]) {
                        const newMenuDay = menuCombine(menuDay, false);

                        // biome-ignore lint/suspicious/useIterableCallbackReturn: todo review
                        Object.keys(newMenuDay).forEach(
                          // biome-ignore lint/suspicious/noAssignInExpressions: todo review
                          (key) => (newMenuDay[key] = ""),
                        );

                        return newMenuDay;
                      }

                      return menuCombine(menuDay, false);
                    })}
                    isEditing={orderEditing}
                    selectedOptions={selectedOptions}
                    onChange={(chosenOptions) => {
                      if (orderEditing || !orderExists) {
                        setSelectedOptions(chosenOptions);
                      }
                    }}
                    weekStartTimestamp={weekStartTimestamp}
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
                              await sleep(500);

                              await createOrder.mutateAsync({
                                week,
                                year,
                                chosenOptions: selectedOptions,
                              });

                              await sleep(1700)
                                .then(() => {
                                  order.refetch().catch((error) => {
                                    console.error(error);
                                  });
                                })
                                .catch((error) => {
                                  console.error(error);
                                });

                              return true;
                            } catch (err) {
                              await sendDiscordWebhook.mutateAsync({
                                title: "LunchOrder Hiba",
                                body:
                                  session.data?.user?.email +
                                  "\n\n" +
                                  String(err),
                                error: true,
                              });
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
                              await sleep(500);

                              await editOrder.mutateAsync({
                                week,
                                year,
                                chosenOptions: selectedOptions,
                              });

                              setOrderEditing(false);

                              return true;
                            } catch (err) {
                              await sendDiscordWebhook.mutateAsync({
                                title: "LunchOrder-Edit Hiba",
                                body: String(err),
                                error: true,
                              });
                              return false;
                            }
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
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
