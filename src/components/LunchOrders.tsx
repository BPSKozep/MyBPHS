import React, { useMemo, useState } from "react";
import { trpc } from "utils/trpc";
import { getWeek, getWeekYear } from "utils/isoweek";
import menuCombine from "utils/menuCombine";
import Loading from "components/Loading";

const days = [
    "Hétfő",
    "Kedd",
    "Szerda",
    "Csütörtök",
    "Péntek",
    "Szombat",
    "Vasárnap",
];

function Orders() {
    const nextWeek = useMemo(() => {
        const date = new Date();

        date.setDate(date.getDate() + 7);

        return date;
    }, []);

    const [year, setYear] = useState<number>(getWeekYear(nextWeek));
    const [week, setWeek] = useState<number>(getWeek(nextWeek));
    const {
        data: orderCounts,
        isLoading: isOrderCountsLoading,
        error: isOrderCountsError,
    } = trpc.order.getOrderCounts.useQuery({
        year,
        week,
    });

    const {
        data: menu,
        isLoading: isMenuLoading,
        isError: isMenuError,
    } = trpc.menu.get.useQuery({
        year,
        week,
    });

    const isLoading = isOrderCountsLoading || isMenuLoading;
    const isError = isOrderCountsError || isMenuError;

    const displayTable =
        !isLoading && !isError && (orderCounts?.length || 0) > 0;

    return (
        <>
            <div className="mb-5 flex flex-row items-center justify-center">
                <h1 className="mr-5 text-center font-bold text-white">
                    Leadott rendelések
                </h1>
                <div className="flex flex-col items-center">
                    <input
                        type="number"
                        value={year}
                        className="m-2 w-44 rounded-md border-none p-2 text-center font-bold text-black"
                        min={2020}
                        onChange={(e) => {
                            setYear(Number(e.target.value));
                        }}
                    />

                    <input
                        type="number"
                        value={week}
                        className="m-2 w-44 rounded-md border-none p-2 text-center font-bold text-black"
                        min={1}
                        max={56}
                        onChange={(e) => {
                            setWeek(Number(e.target.value));
                        }}
                    />
                </div>
            </div>
            <div className="">
                {isLoading && <Loading />}

                {isError && !isLoading && (
                    <h2 className="text-center font-bold text-white">
                        Hiba történt.
                    </h2>
                )}

                {!isLoading && !isError && menu?.options.length === 0 && (
                    <h2 className="text-center font-bold text-white">
                        Nincs menü.
                    </h2>
                )}

                {orderCounts &&
                    menu &&
                    menu.options.length > 0 &&
                    orderCounts.length === 0 && (
                        <h2 className="text-center font-bold text-white">
                            Még nincs rendelés.
                        </h2>
                    )}

                {displayTable && (
                    <div className="overflow-auto rounded-lg">
                        <table className="min-w-full">
                            <thead>
                                <tr>
                                    <th className="text-md bg-gray-900 px-6 py-3 text-left font-medium tracking-wider text-white">
                                        Opció
                                    </th>
                                    <th className="text-md bg-gray-900 px-6 py-3 text-left font-medium tracking-wider text-white">
                                        Mennyiség
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {orderCounts &&
                                    menu &&
                                    orderCounts.map((day, dayIndex) => (
                                        <React.Fragment key={dayIndex}>
                                            <tr className="bg-gray-800">
                                                <th
                                                    className="rounded-lg px-6 py-3 text-left text-sm font-semibold text-white"
                                                    colSpan={2}
                                                >
                                                    {days[dayIndex]}
                                                </th>
                                            </tr>
                                            {Object.entries(day).map(
                                                (
                                                    [option, count],
                                                    optionIndex
                                                ) => (
                                                    <tr
                                                        className="mt-2"
                                                        key={optionIndex}
                                                    >
                                                        <td className="whitespace-nowrap bg-gray-900 px-6 py-3 text-left text-sm font-medium text-gray-100">
                                                            {
                                                                menuCombine(
                                                                    menu
                                                                        .options[
                                                                        dayIndex
                                                                    ]
                                                                )[option]
                                                            }
                                                        </td>
                                                        <td className="whitespace-nowrap bg-gray-900 px-6 py-3 text-center text-sm font-medium text-gray-100">
                                                            {count}
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </React.Fragment>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

export default Orders;
