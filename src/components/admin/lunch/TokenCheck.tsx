"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { FaEdit, FaSave } from "react-icons/fa";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import NFCInput from "@/components/admin/lunch/NFCInput";
import IconButton from "@/components/IconButton";
import IconSubmitButton from "@/components/IconSubmitButton";
import Loading from "@/components/Loading";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import UserInput from "@/components/ui/UserInput";
import { api } from "@/trpc/react";
import { getWeek, getWeekYear } from "@/utils/isoweek";
import menuCombine from "@/utils/menuCombine";
import sleep from "@/utils/sleep";

const days = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"];

export default function TokenCheck() {
  const [nfcId, setNfcId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [checkMode, setCheckMode] = useState<"user" | "token">("user");
  const [isEditing, setIsEditing] = useState(false);
  const [createOrderError, setCreateOrderError] = useState<string | null>(null);

  const [weekOffset, setWeekOffset] = useState(1);
  const [year, week] = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + weekOffset * 7);
    setIsEditing(false);

    return [getWeekYear(date), getWeek(date)];
  }, [weekOffset]);

  const {
    data: NFCUser,
    isFetched: isNFCUserFetched,
    isLoading: isNFCUserLoading,
  } = api.user.getUserByNfcId.useQuery(nfcId, {
    enabled: checkMode === "token",
  });
  const {
    data: emailUser,
    isFetched: isEmailUserFetched,
    isLoading: isEmailUserLoading,
    refetch: refetchEmailUser,
  } = api.user.get.useQuery(email, {
    enabled: checkMode === "user" && !!email,
  });

  const user = checkMode === "user" ? emailUser : NFCUser;
  const isUserLoading =
    checkMode === "user" ? isEmailUserLoading : isNFCUserLoading;
  const isUserFetched =
    checkMode === "user" ? isEmailUserFetched : isNFCUserFetched;

  const orderQuery = api.order.get.useQuery(
    {
      email: user?.email,
      year,
      week,
    },
    {
      enabled: !!user,
      retry: false,
    },
  );

  const order = orderQuery.data;
  const orderLoading = orderQuery.isLoading;

  const { data: menu, isLoading: menuLoading } = api.menu.get.useQuery(
    {
      year,
      week,
    },
    {
      enabled: !!user,
      retry: false,
    },
  );

  const orderExists = order && order.length > 0;

  const [editedOrder, setEditedOrder] = useState<
    { chosen: string; completed: boolean }[]
  >([]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: sync edited order with fetched order
  useEffect(() => {
    if (order && order.length > 0) {
      setEditedOrder(order);
    }
  }, [order, weekOffset]);

  // Clear error when user or week changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: clear error when user or week changes
  useEffect(() => {
    setCreateOrderError(null);
  }, [user, weekOffset]);

  const toggleBlocked = api.user.toggleBlocked.useMutation();
  const adminEditOrder = api.order.adminEdit.useMutation();
  const adminCreateDefaultOrder =
    api.order.adminCreateDefaultOrder.useMutation();

  return (
    <>
      <h2 className="font-bold text-white">Ellenőrzés</h2>
      <div className="my-3 text-center text-white">
        <button
          className={`h-12 w-20 rounded-l-xl p-3 transition-all hover:bg-[#3a445d] ${
            checkMode === "user" ? "bg-[#3a445d]" : "bg-[#565e85]"
          }`}
          type="button"
          onClick={() => setCheckMode("user")}
        >
          Név
        </button>
        <button
          className={`h-12 w-20 rounded-r-xl p-3 transition-all hover:bg-[#3a445d] ${
            checkMode === "token" ? "bg-[#3a445d]" : "bg-[#565e85]"
          }`}
          type="button"
          onClick={() => setCheckMode("token")}
        >
          Token
        </button>
      </div>

      {checkMode === "token" && (
        <div className="m-3">
          <NFCInput nfc={true} onChange={setNfcId} />
        </div>
      )}
      {checkMode === "user" && (
        <div className="my-3">
          <UserInput onSelect={(user) => setEmail(user.email)} />
        </div>
      )}

      {user && checkMode === "user" && (
        <div className="my-3 flex items-center space-x-3">
          <span className="text-white font-medium">Fiók letiltása</span>
          <Switch
            checked={user.blocked}
            onCheckedChange={async () => {
              await toggleBlocked.mutateAsync(user.email);
              await refetchEmailUser();
            }}
            className="data-[state=checked]:bg-red-600"
          />
        </div>
      )}

      <h3 className="mt-5 mb-2 text-white font-semibold">Rendelések:</h3>

      <div className="my-3 flex items-center text-white">
        <IconButton
          icon={<FaArrowLeft />}
          onClick={() => {
            setWeekOffset((offset) => offset - 1);
          }}
        />
        <div className="text-center">
          <p className="mx-2 text-center font-bold md:text-lg">{`${year}. ${week}. hét`}</p>
        </div>
        <IconButton
          icon={<FaArrowRight />}
          onClick={() => {
            setWeekOffset((offset) => offset + 1);
          }}
        />
      </div>

      {nfcId && !user && isUserFetched && (
        <h2 className="text-white">Nem érvényes NFC token</h2>
      )}
      {nfcId && isUserLoading && <Loading />}

      {user && orderExists && menu && !menuLoading && (
        <div className="relative">
          {checkMode === "user" && (
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
                    setIsEditing(!isEditing);
                    if (!isEditing) {
                      setEditedOrder(order);
                    }
                  }}
                >
                  <div className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-slate-600 drop-shadow-2xl text-white">
                    <FaEdit />
                  </div>
                </motion.button>
              </div>
            </div>
          )}

          {checkMode === "token" && (
            <h2 className="mb-4 text-white font-semibold text-lg">
              {user.name}
            </h2>
          )}
          <div className="overflow-auto rounded-lg">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="bg-gray-900 px-6 py-3 text-left text-md font-medium tracking-wider text-white">
                    Nap
                  </th>
                  <th className="bg-gray-900 px-6 py-3 text-left text-md font-medium tracking-wider text-white">
                    Rendelt
                  </th>
                  <th className="bg-gray-900 px-6 py-3 text-center text-md font-medium tracking-wider text-white">
                    Érintve
                  </th>
                </tr>
              </thead>
              <tbody>
                {(isEditing ? editedOrder : order).map((dayOrder, index) => {
                  const combinedOptions = menuCombine(
                    menu.options[index] ?? {},
                  );
                  const menuOption = combinedOptions[dayOrder.chosen];
                  return (
                    <tr key={days[index]} className="border-b border-gray-800">
                      <td className="bg-gray-900 px-6 py-3 text-left text-sm font-medium text-gray-100">
                        {days[index]}
                      </td>
                      <td className="bg-gray-900 px-6 py-3 text-left text-sm font-medium text-gray-100">
                        {isEditing ? (
                          <select
                            value={dayOrder.chosen}
                            onChange={(e) => {
                              const newOrder = [...editedOrder];
                              if (newOrder[index]) {
                                newOrder[index] = {
                                  chosen: e.target.value,
                                  completed: newOrder[index].completed,
                                };
                              }
                              setEditedOrder(newOrder);
                            }}
                            className="w-full rounded-md bg-gray-800 px-3 py-2 text-sm text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
                          >
                            {Object.entries(combinedOptions).map(
                              ([key, value]) => (
                                <option key={key} value={key}>
                                  {value}
                                </option>
                              ),
                            )}
                          </select>
                        ) : (
                          <span className="wrap-break-word whitespace-normal">
                            {menuOption ?? dayOrder.chosen}
                          </span>
                        )}
                      </td>
                      <td className="bg-gray-900 px-6 py-3 text-center text-sm font-medium text-gray-100">
                        <div className="flex justify-center">
                          {isEditing ? (
                            <Checkbox
                              checked={dayOrder.completed}
                              onCheckedChange={(checked) => {
                                const newOrder = [...editedOrder];
                                if (newOrder[index]) {
                                  newOrder[index] = {
                                    chosen: newOrder[index].chosen,
                                    completed: checked as boolean,
                                  };
                                }
                                setEditedOrder(newOrder);
                              }}
                              className="scale-150"
                            />
                          ) : (
                            dayOrder.completed && (
                              <Checkbox
                                checked={true}
                                disabled
                                className="scale-150"
                              />
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {isEditing && (
            <div className="mt-6 flex justify-center">
              <IconSubmitButton
                icon={<FaSave />}
                onClick={async () => {
                  try {
                    await sleep(500);

                    await adminEditOrder.mutateAsync({
                      email: user.email,
                      year,
                      week,
                      order: editedOrder,
                    });

                    await sleep(500);
                    await orderQuery.refetch();

                    setIsEditing(false);

                    return true;
                  } catch (err) {
                    console.error("Error saving order:", err);
                    return false;
                  }
                }}
              />
            </div>
          )}
        </div>
      )}

      {user && (orderLoading || menuLoading) && <Loading />}

      {user && !orderExists && !orderLoading && (
        <>
          <h1 className="mt-5 text-xl text-white">
            Nincs rendelés erre a hétre
          </h1>
          {NFCUser && <h2 className="text-white">{user.name}</h2>}
          <div className="mt-6 flex justify-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileFocus={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 20,
              }}
              className="inline-block cursor-pointer rounded-lg bg-slate-600 p-3 text-white disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-gray-300"
              disabled={adminCreateDefaultOrder.isPending}
              onClick={async () => {
                setCreateOrderError(null);
                try {
                  await sleep(500);
                  await adminCreateDefaultOrder.mutateAsync({
                    email: user.email,
                    year,
                    week,
                  });
                  await sleep(500);
                  await orderQuery.refetch();
                  setCreateOrderError(null);
                } catch (err) {
                  console.error("Error creating order:", err);
                  const errorMessage =
                    err && typeof err === "object" && "message" in err
                      ? String(err.message)
                      : err instanceof Error
                        ? err.message
                        : "Ismeretlen hiba történt";
                  setCreateOrderError(errorMessage);
                }
              }}
            >
              {adminCreateDefaultOrder.isPending
                ? "Létrehozás..."
                : "Rendelés létrehozása"}
            </motion.button>
          </div>
          {createOrderError && (
            <div className="mt-3 text-center text-red-400">
              {createOrderError}
            </div>
          )}
        </>
      )}
    </>
  );
}
