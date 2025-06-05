import ManageGroups from "@/components/admin/ManageGroups";
import OnlyRoles from "@/components/OnlyRoles";
import PageWithHeader from "@/components/PageWithHeader";
import React from "react";

export const metadata = {
    title: "Admin / Csoportok",
};

export default function Groups() {
    return (
        <OnlyRoles roles={["administrator", "teacher"]}>
            <PageWithHeader title="Admin / Csoportok" homeLocation="/admin">
                <ManageGroups />
            </PageWithHeader>
        </OnlyRoles>
    );
}
