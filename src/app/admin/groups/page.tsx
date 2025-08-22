import ManageGroups from "@/components/admin/groups/ManageGroups";
import OnlyRoles from "@/components/auth/OnlyRoles";
import PageWithHeader from "@/components/PageWithHeader";
import React from "react";

export const metadata = {
    title: "Admin / Csoportok",
};

export default function Groups() {
    return (
        <OnlyRoles roles={["administrator", "staff"]}>
            <PageWithHeader title="Admin / Csoportok" homeLocation="/admin">
                <ManageGroups />
            </PageWithHeader>
        </OnlyRoles>
    );
}
