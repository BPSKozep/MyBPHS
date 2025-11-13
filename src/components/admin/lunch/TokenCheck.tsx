"use client";

import { useMemo, useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import NFCInput from "@/components/admin/lunch/NFCInput";
import IconButton from "@/components/IconButton";
import Loading from "@/components/Loading";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import UserInput from "@/components/ui/UserInput";
import { api } from "@/trpc/react";
import { getWeek, getWeekYear } from "@/utils/isoweek";
import menuCombine from "@/utils/menuCombine";

const days = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"];

export default function TokenCheck() {
  const [nfcId, setNfcId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [checkMode, setCheckMode] = useState<"user" | "token">("user");

  const [weekOffset, setWeekOffset] = useState(1);
  const [year, week] = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + weekOffset * 7);

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

  const { data: order, isLoading: orderLoading } = api.order.get.useQuery(
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

  const toggleBlocked = api.user.toggleBlocked.useMutation();

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
        <div>
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
                {order.map((dayOrder, index) => {
                  const menuOption = menuCombine(menu.options[index] ?? {})[
                    dayOrder.chosen
                  ];
                  return (
                    <tr key={days[index]} className="border-b border-gray-800">
                      <td className="bg-gray-900 px-6 py-3 text-left text-sm font-medium text-gray-100">
                        {days[index]}
                      </td>
                      <td className="bg-gray-900 px-6 py-3 text-left text-sm font-medium wrap-break-word whitespace-normal text-gray-100">
                        {menuOption ?? dayOrder.chosen}
                      </td>
                      <td className="bg-gray-900 px-6 py-3 text-center text-sm font-medium text-gray-100">
                        <div className="flex justify-center">
                          {dayOrder.completed && (
                            <Checkbox
                              checked={true}
                              disabled
                              className="scale-150"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {user && (orderLoading || menuLoading) && <Loading />}

      {user && !orderExists && !orderLoading && (
        <>
          <h1 className="mt-5 text-xl text-white">
            Nincs rendelés erre a hétre
          </h1>
          {NFCUser && <h2 className="text-white">{user.name}</h2>}
        </>
      )}
    </>
  );
}
