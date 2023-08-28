import React from "react";

function Timetable({
    timetable,
    timeslots,
}: {
    timetable: (string | null)[][];
    timeslots: string[];
}) {
    return (
        <div className="overflow-hidden rounded-md">
            <table className="text-white">
                <thead>
                    <tr className="bg-[#565e85]">
                        <th className="p-3">Óra</th>
                        <th className="p-3">Hétfő</th>
                        <th className="p-3">Kedd</th>
                        <th className="p-3">Szerda</th>
                        <th className="p-3">Csütörtök</th>
                        <th className="p-3">Péntek</th>
                    </tr>
                </thead>
                <tbody>
                    {timeslots.map((timeslot, i) => (
                        <tr className="bg-[#242424] even:bg-[#2e2e2e]" key={i}>
                            <th className="p-3">{timeslot}</th>
                            {timetable.map((day, j) => (
                                <td className="p-2 text-center" key={j}>
                                    {day[i] && (
                                        <div className="inline-block rounded-xl bg-[#3A445D] px-3 py-1">
                                            {day[i]}
                                        </div>
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Timetable;
