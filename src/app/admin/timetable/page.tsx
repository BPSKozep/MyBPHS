import PageWithHeader from "@/components/PageWithHeader";
import React from "react";
import OnlyRoles from "@/components/OnlyRoles";
import CreateTimetable from "@/components/admin/CreateTimetable";

export const metadata = {
    title: "Admin / Órarend",
};

export default function Timetable() {
    return (
        <OnlyRoles roles={["administrator", "teacher"]}>
            <PageWithHeader title="Admin / Órarend" homeLocation="/admin">
                <CreateTimetable />
            </PageWithHeader>
        </OnlyRoles>
    );
}
