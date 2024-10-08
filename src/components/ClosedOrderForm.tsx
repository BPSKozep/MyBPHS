import React from "react";
import transpose2DArray from "utils/transpose";
import { useMediaQuery } from "react-responsive";
import createBreakpoint from "utils/createBreakpoint";
import wrapConditional from "utils/wrapConditional";

const days = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"];

function ClosedOrderForm({ options }: { options: Record<string, string>[] }) {
    const isBigScreen = useMediaQuery({ query: createBreakpoint("lg") });

    return (
        <div
            className={`grid max-w-[60rem] grid-flow-row break-words ${
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
                    ...Object.entries(day).map(([id, option]) =>
                        !option ? (
                            <div
                                className="hidden lg:block"
                                key={`option-${dayIndex + id}`}
                            ></div>
                        ) : (
                            <button
                                className={`overflow-auto rounded-lg bg-[#565e85] px-3 py-2 shadow-md`}
                                key={`option-${dayIndex + id}`}
                            >
                                {option}
                            </button>
                        ),
                    ),
                ]),
                isBigScreen,
            )}
        </div>
    );
}

export default ClosedOrderForm;
