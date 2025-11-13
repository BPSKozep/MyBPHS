import { useMediaQuery } from "react-responsive";
import createBreakpoint from "@/utils/createBreakpoint";
import transpose2DArray from "@/utils/transpose";
import wrapConditional from "@/utils/wrapConditional";

const days = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"];

export default function ClosedOrderForm({
  options,
}: {
  options: Record<string, string>[];
}) {
  const isBigScreen = useMediaQuery({ query: createBreakpoint("lg") });

  return (
    <div
      className={`grid max-w-240 grid-flow-row break-words ${
        isBigScreen ? "grid-cols-5" : "grid-cols-1"
      } gap-3 rounded-lg bg-zinc-700 p-5 shadow-lg`}
    >
      {wrapConditional(
        transpose2DArray,
        options.map((day, dayIndex) => [
          // biome-ignore lint/suspicious/noArrayIndexKey: no index
          <h1 className="text-center font-bold" key={dayIndex}>
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
                type="button"
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
