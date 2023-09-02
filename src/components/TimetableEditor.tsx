import React, { useEffect, useState } from "react";

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

const DAYS = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"];

function TimetableEditor({
    timetable,
    onChange,
}: {
    timetable: (string | null)[][];
    onChange?: (timetable: (string | null)[][]) => void;
}) {
    const [currentTimetable, setCurrentTimetable] = useState(timetable);

    useEffect(() => {
        setCurrentTimetable(timetable);
    }, [timetable]);

    useEffect(() => {
        onChange?.(currentTimetable);
    }, [currentTimetable, onChange]);

    return (
        <div className="overflow-hidden rounded-md">
            <table className="text-white">
                <thead>
                    <tr className="bg-[#565e85]">
                        <th className="p-3">Óra</th>
                        {DAYS.map((day, i) => (
                            <th className="p-3" key={i}>
                                {day}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {TIMESLOTS.map((timeslot, i) => (
                        <tr className="bg-[#242424] even:bg-[#2e2e2e]" key={i}>
                            <th className="p-3">{timeslot}</th>
                            {DAYS.map((_, j) => (
                                <td className="p-2 text-center" key={j}>
                                    <input
                                        className="inline-block w-52 rounded-xl bg-[#3A445D] px-3 py-1 text-center font-bold placeholder:font-normal"
                                        placeholder="Lyukasóra"
                                        value={currentTimetable[j]?.[i] || ""}
                                        onChange={(e) =>
                                            setCurrentTimetable((oldValue) => {
                                                const copy = JSON.parse(
                                                    JSON.stringify(oldValue)
                                                );

                                                copy[j][i] =
                                                    e.target.value || null;

                                                return copy;
                                            })
                                        }
                                        tabIndex={j + 1}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default TimetableEditor;
