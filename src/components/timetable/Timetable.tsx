import { useMemo, useState } from "react";
import Tabs from "@/components/Tabs";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];

const DAY_TABS = {
  monday: "H",
  tuesday: "K",
  wednesday: "Sz",
  thursday: "Cs",
  friday: "P",
};

export default function Timetable({
  timetable,
  timeslots,
}: {
  timetable: (string | null)[][];
  timeslots: string[];
}) {
  const [selectedDay, setSelectedDay] = useState("monday");

  const dayIndex = useMemo(() => DAYS.indexOf(selectedDay), [selectedDay]);

  return (
    <div className="flex flex-col items-center gap-4">
      <Tabs
        options={DAY_TABS}
        defaultOption={selectedDay}
        onChange={(newDay) => setSelectedDay(newDay)}
      />
      <div className="overflow-auto rounded-md">
        <table className="overflow-scroll text-white">
          <thead></thead>
          <tbody>
            {timeslots.map((timeslot, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: no index
              <tr className="bg-[#242424] even:bg-[#2e2e2e]" key={i}>
                <th className="p-3">{timeslot}</th>

                <td className="p-2 text-center">
                  {timetable[dayIndex]?.[i] && (
                    <div className="inline-block rounded-xl bg-[#3A445D] px-3 py-1">
                      {timetable[dayIndex][i]}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
