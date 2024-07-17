import React, { useEffect, useMemo, useState } from "react";
import Tabs from "components/Tabs";

const TIMESLOTS = [
    "9:00-9:45",
    "9:55-10:40",
    "10:55-11:40",
    "11:50-12:35",
    "12:35-13:30",
    "13:30-14:15",
    "14:25-15:10",
    "15:15-16:00",
];

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];

const DAY_TABS = {
    monday: "H",
    tuesday: "K",
    wednesday: "Sz",
    thursday: "Cs",
    friday: "P",
};

function TimetableEditor({
    timetable,
    onChange,
}: {
    timetable: (string | null)[][];
    onChange?: (timetable: (string | null)[][]) => void;
}) {
    const [currentTimetable, setCurrentTimetable] = useState(timetable);

    const [selectedDay, setSelectedDay] = useState("monday");

    const dayIndex = useMemo(() => DAYS.indexOf(selectedDay), [selectedDay]);

    useEffect(() => {
        setCurrentTimetable(timetable);
    }, [timetable]);

    useEffect(() => {
        onChange?.(currentTimetable);
    }, [currentTimetable, onChange]);

    return (
        <div className="flex flex-col items-center gap-4">
            <Tabs
                options={DAY_TABS}
                defaultOption={selectedDay}
                onChange={(newDay) => setSelectedDay(newDay)}
            />
            <div className="overflow-hidden rounded-md">
                <table className="text-white">
                    <tbody>
                        {TIMESLOTS.map((timeslot, i) => (
                            <tr
                                className="bg-[#242424] even:bg-[#2e2e2e]"
                                key={i}
                            >
                                <th className="p-3">
                                    <input
                                        className="w-28 rounded-xl bg-[#565656] px-3 py-1 text-center"
                                        value={timeslot}
                                    />
                                </th>

                                <td className="p-2 text-center">
                                    <input
                                        className="inline-block w-52 rounded-xl bg-[#3A445D] px-3 py-1 text-center font-bold placeholder:font-normal"
                                        placeholder="Lyukasóra"
                                        value={
                                            currentTimetable[dayIndex]?.[i] ||
                                            ""
                                        }
                                        onChange={(e) =>
                                            setCurrentTimetable((oldValue) => {
                                                const copy = JSON.parse(
                                                    JSON.stringify(oldValue)
                                                );

                                                copy[dayIndex][i] =
                                                    e.target.value || null;

                                                return copy;
                                            })
                                        }
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default TimetableEditor;
