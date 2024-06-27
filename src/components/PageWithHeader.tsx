import React, { PropsWithChildren } from "react";
import PageHeader from "./PageHeader";

function PageWithHeader({
    title,
    homeLocation = "/",
    children,
}: { title: string; homeLocation?: string } & PropsWithChildren) {
    return (
        <>
            <div className="flex h-full w-full flex-col items-center">
                <PageHeader title={title} homeLocation={homeLocation} />
                <div className="h-full w-full">{children}</div>
            </div>
        </>
    );
}

export default PageWithHeader;
