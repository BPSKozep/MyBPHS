import React, { useEffect, useState } from "react";
import transpose2DArray from "utils/transpose";
import { useMediaQuery } from "react-responsive";
import createBreakpoint from "utils/createBreakpoint";
import wrapConditional from "utils/wrapConditional";

const days = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"];

function OrderForm({
    options,
    onChange,
}: {
    options: Record<string, string>[];
    onChange: (chosenOptions: string[]) => void;
}) {
    const [selectedOptions, setSelectedOptions] = useState<string[]>(
        Array(5).fill("i_am_not_want_food")
    );

    const isBigScreen = useMediaQuery({ query: createBreakpoint("lg") });

    useEffect(() => {
        onChange(selectedOptions);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedOptions]);

    return (
        <div
            className={`grid max-w-[60rem] grid-flow-row ${
                isBigScreen ? "grid-cols-5" : "grid-cols-1"
            } gap-3 rounded-lg bg-zinc-700 p-5 shadow-lg`}
        >
            {wrapConditional(
                transpose2DArray,
                options.map((day, dayIndex) => [
                    <h1
                        className="text-center font-bold"
                        key={`day-${dayIndex}`}
                    >
                        {days[dayIndex]}
                    </h1>,
                    ...Object.entries(day).map(([id, option]) => (
                        <button
                            className={`overflow-auto rounded-lg  ${
                                selectedOptions[dayIndex] === id
                                    ? "bg-[#5d9a84] font-bold shadow-lg"
                                    : "bg-[#565e85] shadow-md"
                            } px-3 py-2 shadow-md`}
                            onClick={() => {
                                setSelectedOptions((oldOptions) => {
                                    const newOptions = [...oldOptions];

                                    newOptions[dayIndex] = id;

                                    return newOptions;
                                });
                            }}
                            key={`option-${dayIndex + option}`}
                        >
                            {option}
                        </button>
                    )),
                    <button
                        className={`overflow-auto rounded-lg ${
                            selectedOptions[dayIndex] === "i_am_not_want_food"
                                ? "bg-[#7c4242] font-bold shadow-lg"
                                : "bg-[#9a5d5d] shadow-md"
                        } px-3 py-2`}
                        onClick={() => {
                            setSelectedOptions((oldOptions) => {
                                const newOptions = [...oldOptions];

                                newOptions[dayIndex] = "i_am_not_want_food";

                                return newOptions;
                            });
                        }}
                        key={`no-order-${dayIndex}`}
                    >
                        Nem kérek ebédet
                    </button>,
                ]),
                isBigScreen
            )}
        </div>
    );
}

export default OrderForm;
