"use client";

import OnlyRoles from "components/OnlyRoles";
import PageWithHeader from "components/PageWithHeader";
import React, { useState } from "react";
import KioskComponent from "components/admin/KioskComponent";

function KioskPage() {
    const [primarySocketFailed, setPrimarySocketFailed] = useState(false);

    return (
        <PageWithHeader
            title="Kiosk"
            rightContent={primarySocketFailed && <h1>dev-socket</h1>}
        >
            <OnlyRoles roles={["administrator", "lunch-system"]}>
                <KioskComponent
                    primarySocketFailed={primarySocketFailed}
                    setPrimarySocketFailed={setPrimarySocketFailed}
                />
            </OnlyRoles>
        </PageWithHeader>
    );
}

export default KioskPage;
