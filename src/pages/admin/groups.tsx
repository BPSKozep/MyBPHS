import OnlyRoles from "components/OnlyRoles";
import PageWithHeader from "components/PageWithHeader";
import SaveButton from "components/SaveButton";
import React, { useState } from "react";
import { trpc } from "utils/trpc";

function Groups() {
    const { mutate } = trpc.user.batchUpdateGroups.useMutation();
    const [updateMode, setUpdateMode] = useState<"add" | "remove" | "replace">(
        "replace"
    );
    const [groups, setGroups] = useState("student\nsysadmin_kvk");
    const [students, setStudents] = useState(
        "martin.reicher@budapest.school\nmark.gyoni@budapest.school"
    );

    return (
        <OnlyRoles roles={["administrator", "teacher"]}>
            <PageWithHeader title="Admin / Csoportok">
                <div className="flex h-full items-center justify-center">
                    <select
                        className="m-3 rounded-lg p-3"
                        value={updateMode}
                        onChange={(e) =>
                            setUpdateMode(
                                e.target.value as "add" | "remove" | "replace"
                            )
                        }
                    >
                        <option value="add">Hozzáadás</option>
                        <option value="remove">Eltávolítás</option>
                        <option value="replace">Csere</option>
                    </select>
                    <textarea
                        className="m-3 w-80 rounded-lg p-3"
                        value={students}
                        placeholder="Diákok (minden soron egy)"
                        onChange={(e) => setStudents(e.target.value)}
                    ></textarea>
                    <textarea
                        className="m-3 rounded-lg p-3"
                        value={groups}
                        placeholder="Csoportok (minden soron egy)"
                        onChange={(e) => setGroups(e.target.value)}
                    ></textarea>
                    <SaveButton
                        onClick={() =>
                            mutate({
                                mode: updateMode,
                                update: students.split("\n").map((student) => ({
                                    email: student,
                                    newGroups: groups.split("\n"),
                                })),
                            })
                        }
                    />
                </div>
            </PageWithHeader>
        </OnlyRoles>
    );
}

export default Groups;
