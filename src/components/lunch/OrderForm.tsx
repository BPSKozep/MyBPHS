import { useMemo } from "react";
import { useMediaQuery } from "react-responsive";
import createBreakpoint from "@/utils/createBreakpoint";
import transpose2DArray from "@/utils/transpose";
import wrapConditional from "@/utils/wrapConditional";

const days = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"];

/**
 * Format date as MM.DD (Hungarian format)
 */
function formatDateHungarian(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}.${day}`;
}

export default function OrderForm({
  options,
  selectedOptions,
  onChange,
  isEditing,
  weekStartTimestamp,
}: {
  options: Record<string, string>[];
  selectedOptions: string[];
  onChange: (selectedOptions: string[]) => void;
  isEditing: boolean;
  weekStartTimestamp: number;
}) {
  const isBigScreen = useMediaQuery({ query: createBreakpoint("lg") });

  const weekDates = useMemo(() => {
    const monday = new Date(weekStartTimestamp);
    return Array.from({ length: 5 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return formatDateHungarian(date);
    });
  }, [weekStartTimestamp]);

  return (
    <div
      className={`grid max-w-240 grid-flow-row wrap-break-word ${
        isBigScreen ? "grid-cols-5" : "grid-cols-1"
      } gap-3 rounded-lg bg-zinc-700 p-5 shadow-lg`}
    >
      {wrapConditional(
        transpose2DArray,
        options.map((day, dayIndex) => [
          // biome-ignore lint/suspicious/noArrayIndexKey: no index
          <h1 className="text-center font-bold" key={dayIndex}>
            {days[dayIndex]} ({weekDates[dayIndex]})
          </h1>,
          ...Object.entries(day).map(([id, option]) =>
            !option ? (
              <div
                className="hidden lg:block"
                key={`option-${dayIndex + id}`}
              ></div>
            ) : (
              <button
                type="button"
                className={`overflow-auto rounded-lg ${
                  selectedOptions[dayIndex] === id
                    ? "bg-[#5d9a84] font-bold shadow-lg"
                    : "bg-[#565e85] shadow-md"
                } px-3 py-2 shadow-md ${isEditing ? "cursor-pointer" : ""}`}
                onClick={() => {
                  const newOptions = [...selectedOptions];

                  newOptions[dayIndex] = id;

                  onChange(newOptions);
                }}
                key={`option-${dayIndex + id}`}
              >
                {option}
              </button>
            ),
          ),
          <button
            type="button"
            className={`overflow-auto rounded-lg ${
              selectedOptions[dayIndex] === "i_am_not_want_food"
                ? "bg-[#7c4242] font-bold shadow-lg"
                : "bg-[#9a5d5d] shadow-md"
            } px-3 py-2`}
            onClick={() => {
              const newOptions = [...selectedOptions];

              newOptions[dayIndex] = "i_am_not_want_food";

              onChange(newOptions);
            }}
            // biome-ignore lint/suspicious/noArrayIndexKey: no index
            key={`no-order-${dayIndex}`}
          >
            Nem kérek ebédet
          </button>,
        ]),
        isBigScreen,
      )}
    </div>
  );
}
