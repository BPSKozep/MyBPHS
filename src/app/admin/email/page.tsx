import SendEmail from "@/components/admin/email/SendEmail";
import OnlyRoles from "@/components/auth/OnlyRoles";
import PageWithHeader from "@/components/PageWithHeader";
import React from "react";

export const metadata = {
    title: "Admin / Email",
};

export default function Email() {
    return (
        <OnlyRoles roles={["administrator"]}>
            <PageWithHeader title="Admin / Email" homeLocation="/admin">
                <SendEmail />
            </PageWithHeader>
        </OnlyRoles>
    );
}
