import SchoolPasswordReset from "@/components/school-password/SchoolPasswordReset";
import PageWithHeader from "@/components/PageWithHeader";
import React from "react";

export const metadata = {
    title: "Iskolai Jelszó",
};

export default function SchoolPassword() {
    return (
        <PageWithHeader title="Iskolai Jelszó">
            <div className="flex h-full w-full items-center justify-center align-middle">
                <SchoolPasswordReset />
            </div>
        </PageWithHeader>
    );
}
