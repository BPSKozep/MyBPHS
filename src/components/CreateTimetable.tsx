"use client";

import React from "react";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import IconSubmitButton from "components/IconSubmitButton";
import Card from "components/Card";
import { trpc } from "utils/trpc";
import { useDebounce } from "use-debounce";
import TimetableEditor from "components/TimetableEditor";
import { useCallback, useEffect, useState } from "react";

const EMPTY_TIMETABLE = Array(5).fill([]);

function CreateTimetable() {
    const [groupName, setGroupName] = useState("");
    const [debouncedGroupName] = useDebounce(groupName, 500);
    const [priority, setPriority] = useState("");
    const [timetable, setTimetable] =
        useState<(string | null)[][]>(EMPTY_TIMETABLE);

    const { data } = trpc.group.get.useQuery(debouncedGroupName);
    const { mutate } = trpc.group.update.useMutation();

    const timetableOnChange = useCallback(
        (newTimetable: (string | null)[][]) => setTimetable(newTimetable),
        []
    );

    useEffect(() => {
        setTimetable(data?.timetable || EMPTY_TIMETABLE);
        setPriority(String(data?.priority ?? ""));
    }, [data]);

    return (
        <div className="flex flex-col justify-center text-white md:flex-row">
            <Card>
                <div className="flex h-full w-full flex-col items-center justify-center">
                    <div className="flex flex-col items-center sm:flex-row">
                        <input
                            className="mb-3 mr-3 rounded-xl px-3 py-2 font-bold text-black placeholder:font-normal"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Csoport neve"
                        />
                        <div className="mb-3 flex flex-row items-center">
                            <input
                                className="my-3 mr-3 w-32 rounded-xl px-3 py-2 font-bold text-black placeholder:font-normal"
                                value={priority}
                                onChange={(e) => {
                                    const value = e.target.value;

                                    if (
                                        value.length === 0 ||
                                        isNaN(parseInt(value))
                                    ) {
                                        setPriority("");
                                        return;
                                    }

                                    setPriority(String(parseInt(value)));
                                }}
                                placeholder="Prioritás"
                            />
                            <IconSubmitButton
                                icon={<FontAwesomeIcon icon={faFloppyDisk} />}
                                onClick={() => {
                                    mutate({
                                        name: groupName,
                                        newValue: {
                                            name: groupName,
                                            timetable,
                                            priority: Number(priority),
                                            override: false,
                                        },
                                    });

                                    return true;
                                }}
                            />
                        </div>
                    </div>
                    <TimetableEditor
                        timetable={timetable}
                        onChange={timetableOnChange}
                    />
                </div>
            </Card>
        </div>
    );
}

export default CreateTimetable;
