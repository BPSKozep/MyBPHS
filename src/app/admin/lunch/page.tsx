import React from "react";
import PageWithHeader from "components/PageWithHeader";
import Card from "components/Card";
import LunchOrders from "components/admin/LunchOrders";
import OnlyRoles from "components/OnlyRoles";
import TokenCheck from "components/admin/TokenCheck";
import CloseMenuOrders from "components/admin/CloseMenuOrders";
import SetMenuAndSendEmail from "components/admin/SetMenuAndSendEmail";

export const metadata = {
    title: "MyBPHS - Admin / Ebédrendelés",
};

export default function LunchAdmin() {
    return (
        <OnlyRoles roles={["administrator"]}>
            <PageWithHeader title="Admin / Ebédrendelés" homeLocation="/admin">
                <div className="flex flex-col justify-center lg:flex-row">
                    <Card>
                        <SetMenuAndSendEmail />
                    </Card>
                    <Card>
                        <LunchOrders />
                    </Card>
                    <Card>
                        <div className="flex flex-col items-center justify-center text-center">
                            <CloseMenuOrders />
                            <hr className="border-1 my-5 h-1 w-full bg-gray-900" />
                            <TokenCheck />
                        </div>
                    </Card>
                </div>
            </PageWithHeader>
        </OnlyRoles>
    );
}
