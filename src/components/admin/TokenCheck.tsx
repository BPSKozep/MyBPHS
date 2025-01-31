"use client";

import React, { useMemo, useState } from "react";
import NFCInput from "components/admin/NFCInput";
import { trpc } from "utils/trpc";
import { getWeek, getWeekYear } from "utils/isoweek";
import Loading from "components/Loading";
import IconButton from "components/IconButton";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import UserInput from "./UserInput";

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
    } = trpc.user.getUserByNfcId.useQuery(nfcId, {
        enabled: checkMode === "token",
    });
    const {
        data: emailUser,
        isFetched: isEmailUserFetched,
        isLoading: isEmailUserLoading,
        refetch: refetchEmailUser,
    } = trpc.user.get.useQuery(email, {
        enabled: checkMode === "user" && !!email,
    });

    const user = checkMode === "user" ? emailUser : NFCUser;
    const isUserLoading =
        checkMode === "user" ? isEmailUserLoading : isNFCUserLoading;
    const isUserFetched =
        checkMode === "user" ? isEmailUserFetched : isNFCUserFetched;

    const { data: order, isLoading: orderLoading } =
        trpc.order.getAllWeek.useQuery(
            {
                email: user?.email,
                year,
                week,
            },
            {
                enabled: !!user,
            },
        );

    const orderExists = order && order.length > 0;

    const { mutateAsync: toggleBlocked } =
        trpc.user.toggleBlocked.useMutation();

    return (
        <>
            <h2 className="font-bold text-white">Ellenőrzés</h2>
            <div className="my-3 text-center text-white">
                <button
                    className={`h-12 w-20 rounded-l-xl p-3 transition-all hover:bg-[#3a445d] ${
                        checkMode === "user" ? "bg-[#3a445d]" : "bg-[#565e85]"
                    }`}
                    onClick={() => setCheckMode("user")}
                >
                    Név
                </button>
                <button
                    className={`h-12 w-20 rounded-r-xl p-3 transition-all hover:bg-[#3a445d] ${
                        checkMode === "token" ? "bg-[#3a445d]" : "bg-[#565e85]"
                    }`}
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
                <>
                    <div className="my-3">
                        <UserInput onSelect={(user) => setEmail(user.email)} />
                    </div>
                </>
            )}

            {user && checkMode === "user" && (
                <button
                    className={`rounded-lg ${user.blocked ? "bg-blue-400" : "bg-red-400"} p-3 font-bold text-white transition-all hover:scale-105`}
                    onClick={async () => {
                        await toggleBlocked(user.email);
                        await refetchEmailUser();
                    }}
                >
                    {user.blocked ? "Tiltás feloldása" : "Fiók letiltása"}
                </button>
            )}
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
            {user && orderExists && (
                <div>
                    {checkMode === "token" && (
                        <h2 className="text-white">{user.name}</h2>
                    )}
                    <table className="mt-8 text-white">
                        <thead>
                            <tr>
                                <th className="pb-5 pl-5 text-left text-xl">
                                    Nap
                                </th>
                                <th className="pb-5 pr-5 text-right text-xl">
                                    Rendelt
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="pb-5 text-left">Hétfő</td>
                                <td className="pb-5 text-right">
                                    {orderExists && order[0]}
                                </td>
                            </tr>
                            <tr>
                                <td className="pb-5 text-left">Kedd</td>
                                <td className="pb-5 text-right">
                                    {orderExists && order[1]}
                                </td>
                            </tr>
                            <tr>
                                <td className="pb-5 text-left">Szerda</td>
                                <td className="pb-5 text-right">
                                    {orderExists && order[2]}
                                </td>
                            </tr>
                            <tr>
                                <td className="pb-5 text-left">Csütörtök</td>
                                <td className="pb-5 text-right">
                                    {orderExists && order[3]}
                                </td>
                            </tr>
                            <tr>
                                <td className="pb-5 text-left">Péntek</td>
                                <td className="pb-5 text-right">
                                    {orderExists && order[4]}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
            {user && orderLoading && <Loading />}
            {user && !orderExists && !orderLoading && (
                <>
                    <h1 className="mt-5 text-xl text-white">
                        Nincs rendelés erre hétre
                    </h1>
                    {NFCUser && <h2 className="text-white">{user.name}</h2>}
                </>
            )}
        </>
    );
}
