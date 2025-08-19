import React from "react";
import PageWithHeader from "@/components/PageWithHeader";
import Card from "@/components/Card";
import LunchOrders from "@/components/admin/lunch/LunchOrders";
import OnlyRoles from "@/components/auth/OnlyRoles";
import TokenCheck from "@/components/admin/lunch/TokenCheck";
import CloseMenuOrders from "@/components/admin/lunch/CloseMenuOrders";
import SetMenuAndSendEmail from "@/components/admin/lunch/SetMenuAndSendEmail";

export const metadata = {
    title: "Admin / Ebédrendelés",
};

export default function LunchAdmin() {
    return (
        <OnlyRoles roles={["administrator"]}>
            <PageWithHeader title="Admin / Ebédrendelés" homeLocation="/admin">
                <div className="flex flex-col justify-center xl:flex-row">
                    <Card>
                        <SetMenuAndSendEmail />
                    </Card>
                    <Card>
                        <LunchOrders />
                    </Card>
                    <Card>
                        <div className="flex flex-col items-center justify-center text-center">
                            <CloseMenuOrders />
                            <hr className="my-5 h-1 w-full border bg-gray-900" />
                            <TokenCheck />
                        </div>
                    </Card>
                </div>
            </PageWithHeader>
        </OnlyRoles>
    );
}
