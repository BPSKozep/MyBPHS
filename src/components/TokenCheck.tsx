import React, { useState } from "react";
import NFCInput from "components/NFCInput";
import { trpc } from "utils/trpc";
import { getWeek, getWeekYear } from "utils/isoweek";
import UserInput from "./UserInput";
import Loading from "./Loading";

function TokenCheck() {
    const [nfcId, setNfcId] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [checkMode, setCheckMode] = useState<"user" | "token">("user");

    const date = new Date();
    const year = getWeekYear(date);
    const week = getWeek(date);

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
    } = trpc.user.get.useQuery(email, { enabled: checkMode === "user" });

    const user = checkMode === "user" ? emailUser : NFCUser;
    const isUserLoading =
        checkMode === "user" ? isEmailUserLoading : isNFCUserLoading;
    const isUserFetched =
        checkMode === "user" ? isEmailUserFetched : isNFCUserFetched;

    const { data: order } = trpc.order.getAllWeek.useQuery({
        email: user?.email,
        year,
        week,
    });
    console.log(user);
    const orderExists = order && order.length > 0;

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
                <div className="m-3">
                    <UserInput onChange={setEmail} />
                </div>
            )}
            {nfcId && !user && isUserFetched && (
                <h2 className="text-white">Nem érvényes NFC token</h2>
            )}
            {nfcId && isUserLoading && <Loading />}
            {user && orderExists ? (
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
            ) : (
                <h1 className="mt-5 text-xl text-white">
                    Nincs rendelés a jelenlegi hétre
                </h1>
            )}
        </>
    );
}

export default TokenCheck;
