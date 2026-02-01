"use client";

import { Fragment, useMemo, useState } from "react";
import Loading from "@/components/Loading";
import { api } from "@/trpc/react";
import { getWeek, getWeekYear } from "@/utils/isoweek";
import menuCombine from "@/utils/menuCombine";

const days = [
  "Hétfő",
  "Kedd",
  "Szerda",
  "Csütörtök",
  "Péntek",
  "Szombat",
  "Vasárnap",
];

export default function Orders() {
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
  } = api.order.getOrderCounts.useQuery(
    {
      year,
      week,
    },
    {
      refetchInterval: 3000,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
      staleTime: 0,
    },
  );

  const {
    data: menu,
    isLoading: isMenuLoading,
    isError: isMenuError,
  } = api.menu.get.useQuery(
    {
      year,
      week,
    },
    {
      refetchInterval: 3000,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
      staleTime: 0,
    },
  );

  const isLoading = isOrderCountsLoading || isMenuLoading;
  const isError = isOrderCountsError ?? isMenuError;

  const displayTable = !isLoading && !isError && (orderCounts?.length ?? 0) > 0;

  return (
    <>
      <div className="mb-5 flex flex-col items-center justify-center gap-4 md:flex-row">
        <h1 className="text-center font-bold text-white">Leadott rendelések</h1>
        <div className="flex flex-col items-center gap-2">
          <input
            type="number"
            value={year}
            className="w-44 rounded-md border-none bg-white p-2 text-center font-bold text-black"
            min={2020}
            onChange={(e) => {
              setYear(Number(e.target.value));
            }}
          />

          <input
            type="number"
            value={week}
            className="w-44 rounded-md border-none bg-white p-2 text-center font-bold text-black"
            min={1}
            max={56}
            onChange={(e) => {
              setWeek(Number(e.target.value));
            }}
          />
        </div>
      </div>
      <div className="">
        {isLoading && (
          <div className="flex justify-center">
            <Loading />
          </div>
        )}

        {isError && !isLoading && (
          <h2 className="text-center font-bold text-white">Hiba történt.</h2>
        )}

        {!isLoading && !isError && menu?.options.length === 0 && (
          <h2 className="text-center font-bold text-white">Nincs menü.</h2>
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
                    // biome-ignore lint/suspicious/noArrayIndexKey: no index
                    <Fragment key={dayIndex}>
                      <tr className="bg-gray-800">
                        <th
                          className="rounded-lg px-6 py-3 text-left text-sm font-semibold text-white"
                          colSpan={2}
                        >
                          {days[dayIndex]}
                        </th>
                      </tr>
                      {Object.entries(day).map(
                        ([option, count], optionIndex) => (
                          // biome-ignore lint/suspicious/noArrayIndexKey: no index
                          <tr className="mt-2" key={optionIndex}>
                            <td className="bg-gray-900 px-6 py-3 text-left text-sm font-medium wrap-break-word whitespace-normal text-gray-100">
                              {
                                menuCombine(menu.options[dayIndex] ?? {})[
                                  option
                                ]
                              }
                            </td>
                            <td className="bg-gray-900 px-6 py-3 text-center text-sm font-medium whitespace-nowrap text-gray-100">
                              {count}
                            </td>
                          </tr>
                        ),
                      )}
                    </Fragment>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
