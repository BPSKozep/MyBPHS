import React, { PropsWithChildren } from "react";
import PageHeader from "./PageHeader";

function PageWithHeader({
    title,
    children,
}: { title: string } & PropsWithChildren) {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center">
            <PageHeader title={title} />
            <div className="flex h-full w-full items-center justify-center">
                {children}
            </div>
        </div>
    );
}

export default PageWithHeader;
