import OnlyRoles from "components/OnlyRoles";
import PageWithHeader from "components/PageWithHeader";
import React from "react";
import KioskComponent from "components/admin/KioskComponent";

function Kiosk() {
    return (
        <PageWithHeader title="Kiosk">
            <OnlyRoles roles={["administrator", "lunch-system"]}>
                <KioskComponent />
            </OnlyRoles>
        </PageWithHeader>
    );
}

export default Kiosk;
