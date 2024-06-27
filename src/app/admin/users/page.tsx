import CreateUsers from "components/admin/CreateUsers";
import OnlyRoles from "components/OnlyRoles";
import PageWithHeader from "components/PageWithHeader";
import React from "react";

export const metadata = {
    title: "MyBPHS - Admin / Felhasználók",
};

export default function Users() {
    return (
        <OnlyRoles roles={["administrator"]}>
            <PageWithHeader title="Admin / Felhasználók" homeLocation="/admin">
                <CreateUsers />
            </PageWithHeader>
        </OnlyRoles>
    );
}
