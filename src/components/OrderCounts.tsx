"use client";

import { FaPlus } from "react-icons/fa";
import React, { useState } from "react";
import { api } from "@/trpc/react";
import SmallLoading from "./SmallLoading";

export default function OrderCounts({
    data,
}: {
    data: Record<string, number>;
}) {
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
        {},
    );

    const handleButtonClick = async (key: string) => {
        setLoadingStates((prevState) => ({ ...prevState, [key]: true }));
        await saveKiosk.mutateAsync(key);
        await kioskCounts.refetch();
        setLoadingStates((prevState) => ({ ...prevState, [key]: false }));
    };

    const saveKiosk = api.kiosk.save.useMutation();
    const kioskCounts = api.kiosk.get.useQuery();
    return (
        <table>
            <thead>
                <tr>
                    <th className="border-2 border-gray-500 bg-gray-700 px-6 py-3 text-left text-2xl font-bold tracking-wider text-white">
                        Opció
                    </th>
                    <th className="border-2 border-gray-500 bg-gray-700 px-6 py-3 text-left text-2xl font-bold tracking-wider text-white">
                        Mennyiség
                    </th>
                </tr>
            </thead>
            <tbody>
                {Object.entries(data).map((dataRow, index) => (
                    <tr key={index}>
                        <td className="border-2 border-gray-500 bg-gray-700 px-6 py-3 text-left text-xl font-medium whitespace-nowrap text-gray-100">
                            {dataRow[0]}
                        </td>
                        <td className="flex items-center justify-center border-2 border-gray-500 bg-gray-700 px-6 py-3 text-xl font-medium whitespace-nowrap text-gray-100">
                            <span className="mr-5">{dataRow[1]}</span>
                            <button
                                onClick={() => handleButtonClick(dataRow[0])}
                                className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#111827] p-2 transition-all hover:scale-110 active:scale-90"
                            >
                                {loadingStates[dataRow[0]] ? (
                                    <SmallLoading />
                                ) : (
                                    <FaPlus />
                                )}
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
