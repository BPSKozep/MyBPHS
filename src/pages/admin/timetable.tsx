import PageWithHeader from "components/PageWithHeader";
import TimetableEditor from "components/TimetableEditor";
import React, { useCallback, useEffect, useState } from "react";
import { trpc } from "utils/trpc";
import { useDebounce } from "use-debounce";
import OnlyRoles from "components/OnlyRoles";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import IconSubmitButton from "components/IconSubmitButton";

const EMPTY_TIMETABLE = Array(5).fill([]);

function Timetable() {
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
        <OnlyRoles roles={["administrator", "teacher"]}>
            <PageWithHeader title="Admin / Órarend">
                <div className="flex h-full w-full flex-col items-center justify-center">
                    <div>
                        <input
                            className="my-3 mr-3 rounded-xl px-3 py-2"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Csoport neve"
                        />
                        <input
                            className="my-3 mr-3 w-32 rounded-xl px-3 py-2"
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
                    <TimetableEditor
                        timetable={timetable}
                        onChange={timetableOnChange}
                    />
                </div>
            </PageWithHeader>
        </OnlyRoles>
    );
}

export default Timetable;
