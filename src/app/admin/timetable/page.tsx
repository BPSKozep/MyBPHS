import PageWithHeader from "components/PageWithHeader";
import React from "react";
import OnlyRoles from "components/OnlyRoles";
import CreateTimetable from "components/CreateTimetable";

export const metadata = {
    title: "MyBPHS - Admin / Órarend",
};

function Timetable() {
    return (
        <OnlyRoles roles={["administrator", "teacher"]}>
            <PageWithHeader title="Admin / Órarend" homeLocation="/admin">
                <CreateTimetable />
            </PageWithHeader>
        </OnlyRoles>
    );
}

export default Timetable;
