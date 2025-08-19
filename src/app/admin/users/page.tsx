import OnlyRoles from "@/components/auth/OnlyRoles";
import PageWithHeader from "@/components/PageWithHeader";
import UsersDataManager from "@/components/admin/users/UsersDataManager";
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
