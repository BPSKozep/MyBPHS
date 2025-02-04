import React from "react";
import PageWithHeader from "components/PageWithHeader";
import Card from "components/Card";
import OnlyRoles from "components/OnlyRoles";
import SyncTimeline from "components/admin/SyncTimeline";
import SyncControl from "components/admin/SyncControl";

export const metadata = {
    title: "Admin / Szinkronizálás",
};

export default function Sync() {
    return (
        <OnlyRoles roles={["administrator"]}>
            <PageWithHeader
                title="Admin / Szinkronizálás"
                homeLocation="/admin"
            >
                <div className="flex flex-col justify-center xl:flex-row">
                    <Card>
                        <SyncControl />
                    </Card>
                    <Card>
                        <SyncTimeline />
                    </Card>
                </div>
            </PageWithHeader>
        </OnlyRoles>
    );
}
