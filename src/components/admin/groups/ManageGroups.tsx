"use client";

import { useState } from "react";
import { FaFloppyDisk } from "react-icons/fa6";
import Card from "@/components/Card";
import IconSubmitButton from "@/components/IconSubmitButton";
import { api } from "@/trpc/react";

export default function ManageGroups() {
  const batchUpdateGroups = api.user.batchUpdateGroups.useMutation();
  const [updateMode, setUpdateMode] = useState<"add" | "remove" | "replace">(
    "replace",
  );
  const [groups, setGroups] = useState("");
  const [students, setStudents] = useState("");

  return (
    <div className="flex flex-col justify-center lg:flex-row">
      <Card>
        <div className="flex h-full flex-col items-center justify-center">
          <textarea
            className="m-3 w-60 rounded-lg bg-white p-3 sm:w-80"
            value={students}
            placeholder="Emailek (soronként)"
            onChange={(e) => setStudents(e.target.value)}
          ></textarea>
          <div className="mb-5 flex flex-row items-center gap-2">
            <textarea
              className="my-3 h-16 w-36 rounded-lg bg-white p-3 sm:w-52"
              value={groups}
              placeholder="Csoportok (soronként)"
              onChange={(e) => setGroups(e.target.value)}
            ></textarea>
            <select
              className="my-3 h-16 rounded-lg bg-white p-3"
              value={updateMode}
              onChange={(e) =>
                setUpdateMode(e.target.value as "add" | "remove" | "replace")
              }
            >
              <option value="add">Hozzáadás</option>
              <option value="remove">Eltávolítás</option>
              <option value="replace">Csere</option>
            </select>
          </div>
          <IconSubmitButton
            icon={<FaFloppyDisk />}
            onClick={() => {
              batchUpdateGroups
                .mutateAsync({
                  mode: updateMode,
                  update: students.split("\n").map((student) => ({
                    email: student,
                    newGroups: groups.split("\n"),
                  })),
                })
                .catch((error) => {
                  console.error(error);
                });

              return true;
            }}
          />
        </div>
      </Card>
    </div>
  );
}
