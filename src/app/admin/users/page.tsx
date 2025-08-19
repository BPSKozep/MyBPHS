import OnlyRoles from "@/components/OnlyRoles";
import PageWithHeader from "@/components/PageWithHeader";
import UsersDataManager from "@/components/admin/UsersDataManager";
import React from "react";

export const metadata = {
    title: "Admin / Felhasználók",
};

export default function Users() {
    return (
        <OnlyRoles roles={["administrator"]}>
            <PageWithHeader title="Admin / Felhasználók" homeLocation="/admin">
                <UsersDataManager />
            </PageWithHeader>
        </OnlyRoles>
    );
}
