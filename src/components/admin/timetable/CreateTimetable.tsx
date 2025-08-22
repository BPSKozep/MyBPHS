"use client";

import React from "react";
import { FaFloppyDisk } from "react-icons/fa6";
import IconSubmitButton from "@/components/IconSubmitButton";
import Card from "@/components/Card";
import { api } from "@/trpc/react";
import { useDebounce } from "use-debounce";
import TimetableEditor from "@/components/admin/timetable/TimetableEditor";
import { useCallback, useEffect, useState } from "react";

const EMPTY_TIMETABLE = Array(5).fill([]);

export default function CreateTimetable() {
    const [groupName, setGroupName] = useState("");
    const [debouncedGroupName] = useDebounce(groupName, 500);
    const [priority, setPriority] = useState("");
    const [timetable, setTimetable] =
        useState<(string | null)[][]>(EMPTY_TIMETABLE);

    const group = api.group.get.useQuery(debouncedGroupName);
    const updateGroup = api.group.update.useMutation();

    const timetableOnChange = useCallback(
        (newTimetable: (string | null)[][]) => setTimetable(newTimetable),
        [],
    );

    useEffect(() => {
        setTimetable(group.data?.timetable ?? EMPTY_TIMETABLE);
        setPriority(String(group.data?.priority ?? ""));
    }, [group.data]);

    return (
        <div className="flex flex-col justify-center text-white md:flex-row">
            <Card>
                <div className="flex h-full w-full flex-col items-center justify-center">
                    <div className="flex flex-col items-center sm:flex-row">
                        <input
                            className="mr-3 mb-3 rounded-xl bg-white px-3 py-2 font-bold text-black placeholder:font-normal"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Csoport neve"
                        />
                        <div className="mb-3 flex flex-row items-center">
                            <input
                                className="my-3 mr-3 w-32 rounded-xl bg-white px-3 py-2 font-bold text-black placeholder:font-normal"
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
                                icon={<FaFloppyDisk />}
                                onClick={() => {
                                    updateGroup.mutate({
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
