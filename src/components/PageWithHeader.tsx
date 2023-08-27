import React, { PropsWithChildren } from "react";
import PageHeader from "./PageHeader";

function PageWithHeader({
    title,
    children,
}: { title: string } & PropsWithChildren) {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center">
            <PageHeader title={title} />
            <div className="h-full w-full">{children}</div>
        </div>
    );
}

export default PageWithHeader;
