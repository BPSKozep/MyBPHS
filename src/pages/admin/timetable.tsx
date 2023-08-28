import { faCheck, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PageWithHeader from "components/PageWithHeader";
import TimetableEditor from "components/TimetableEditor";
import React, { useCallback, useEffect, useState } from "react";
import { trpc } from "utils/trpc";
import { motion } from "framer-motion";
import { useDebounce } from "use-debounce";

const EMPTY_TIMETABLE = Array(5).fill([]);

function Timetable() {
    const [groupName, setGroupName] = useState("");
    const [debouncedGroupName] = useDebounce(groupName, 500);
    const [priority, setPriority] = useState("");
    const [timetable, setTimetable] =
        useState<(string | null)[][]>(EMPTY_TIMETABLE);
    const [saveAnimation, setSaveAnimation] = useState(false);

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

                            if (value.length === 0 || isNaN(parseInt(value))) {
                                setPriority("");
                                return;
                            }

                            setPriority(String(parseInt(value)));
                        }}
                        placeholder="Prioritás"
                    />
                    <motion.button
                        className="h-12 w-12 rounded-2xl p-3 text-white"
                        initial={{
                            scale: 1,
                            backgroundColor: "#565e85",
                        }}
                        animate={
                            saveAnimation
                                ? {
                                      scale: 1.2,
                                      backgroundColor: "#4abd63",
                                  }
                                : { scale: 1 }
                        }
                        transition={{
                            scale: {
                                type: "spring",
                                damping: 9,
                                stiffness: 200,
                            },
                            backgroundColor: {
                                type: "tween",
                            },
                        }}
                        whileHover={{
                            backgroundColor: saveAnimation
                                ? "#4abd63"
                                : "#3a445d",
                        }}
                        onClick={() => {
                            mutate({
                                name: groupName,
                                newValue: {
                                    name: groupName,
                                    timetable,
                                    priority: Number(priority),
                                },
                            });

                            setSaveAnimation(true);

                            setTimeout(() => setSaveAnimation(false), 800);
                        }}
                    >
                        <div className="relative">
                            <motion.div
                                initial={{ display: "block", opacity: 1 }}
                                animate={{
                                    display: saveAnimation ? "none" : "block",
                                    opacity: saveAnimation ? 0 : 1,
                                }}
                            >
                                <FontAwesomeIcon
                                    icon={faFloppyDisk}
                                    size="xl"
                                />
                            </motion.div>
                            <motion.div
                                initial={{ display: "none", scale: 0 }}
                                animate={{
                                    display: saveAnimation ? "block" : "none",
                                    scale: saveAnimation ? 1 : 0,
                                }}
                            >
                                <FontAwesomeIcon icon={faCheck} size="xl" />
                            </motion.div>
                        </div>
                    </motion.button>
                </div>
                <TimetableEditor
                    timetable={timetable}
                    onChange={timetableOnChange}
                />
            </div>
        </PageWithHeader>
    );
}

export default Timetable;
