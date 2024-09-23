"use client";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import { trpc } from "utils/trpc";
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
        await saveKiosk(key);
        kioskCountsRefetch();
        setLoadingStates((prevState) => ({ ...prevState, [key]: false }));
    };

    const { mutateAsync: saveKiosk } = trpc.kiosk.save.useMutation();
    const { refetch: kioskCountsRefetch } = trpc.kiosk.get.useQuery();
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
                        <td className="whitespace-nowrap border-2 border-gray-500 bg-gray-700 px-6 py-3 text-left text-xl font-medium text-gray-100">
                            {dataRow[0]}
                        </td>
                        <td className="whitespace-nowrap border-2 border-gray-500 bg-gray-700 px-6 py-3 text-center text-xl font-medium text-gray-100">
                            {dataRow[1]}
                            <button
                                onClick={() => handleButtonClick(dataRow[0])}
                                className="ml-5 h-12 w-12 items-center rounded-xl bg-[#111827] p-2 transition-all hover:scale-110 active:scale-90"
                            >
                                {loadingStates[dataRow[0]] ? (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <SmallLoading />
                                    </div>
                                ) : (
                                    <FontAwesomeIcon icon={faPlus} />
                                )}
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
