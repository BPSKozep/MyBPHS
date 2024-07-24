"use client";

import React, { useState } from "react";
import { trpc } from "utils/trpc";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Card from "components/Card";
import IconSubmitButton from "components/IconSubmitButton";
import GroupListDropdown from "components/admin/GroupListDropdown";

export default function ManageGroups() {
    const { mutate } = trpc.user.batchUpdateGroups.useMutation();
    const [updateMode, setUpdateMode] = useState<"add" | "remove" | "replace">(
        "replace"
    );

    const [groups, setGroups] = useState("");
    const [students, setStudents] = useState("");
    const [selectedGroupForListing, setSelectedGroupForListing] = useState("");

    const { data: selectedGroupMembers } = trpc.group.getMembers.useQuery(selectedGroupForListing);

    return (
        <div className="flex flex-col justify-center lg:flex-row">
            <Card>
                <h1 className="text-center text-white font-bold">Egyéni szerkesztés</h1>
                <div className="flex h-full flex-col items-center justify-center">
                    <textarea
                        className="m-3 w-60 rounded-lg p-3 sm:w-80"
                        value={students}
                        placeholder="Emailek (soronként)"
                        onChange={(e) => setStudents(e.target.value)}
                    ></textarea>
                    <div className="mb-5 flex flex-row items-center gap-2">
                        <textarea
                            className="my-3 h-16 w-36 rounded-lg p-3 sm:w-52"
                            value={groups}
                            placeholder="Csoportok (soronként)"
                            onChange={(e) => setGroups(e.target.value)}
                        ></textarea>
                        <select
                            className="my-3 h-16 rounded-lg p-3"
                            value={updateMode}
                            onChange={(e) =>
                                setUpdateMode(
                                    e.target.value as
                                        | "add"
                                        | "remove"
                                        | "replace"
                                )
                            }
                        >
                            <option value="add">Hozzáadás</option>
                            <option value="remove">Eltávolítás</option>
                            <option value="replace">Csere</option>
                        </select>
                    </div>
                    <IconSubmitButton
                        icon={<FontAwesomeIcon icon={faFloppyDisk} />}
                        onClick={() => {
                            mutate({
                                mode: updateMode,
                                update: students.split("\n").map((student) => ({
                                    email: student,
                                    newGroups: groups.split("\n"),
                                })),
                            });

                            return true;
                        }}
                    />
                </div>
            </Card>
            <Card>
                <h1 className="text-center text-white font-bold">Csoporttagok listázása</h1>
                <div className="flex h-full flex-col items-center justify-center">
                    <GroupListDropdown onChange={setSelectedGroupForListing} />
                    <p>
                        {selectedGroupMembers?.map((member) => (
                            <span key={member.email}>{member.name}</span>
                        ))}
                    </p>
                </div>
            </Card>
        </div>
    );
}
