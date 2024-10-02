import React, { PropsWithChildren, ReactNode } from "react";
import PageHeader from "components/PageHeader";

function PageWithHeader({
    title,
    homeLocation = "/",
    children,
    rightContent,
}: {
    title: string | ReactNode;
    homeLocation?: string;
    rightContent?: ReactNode;
} & PropsWithChildren) {
    return (
        <>
            <div className="flex h-full flex-col">
                <PageHeader
                    title={title}
                    homeLocation={homeLocation}
                    rightContent={rightContent}
                />
                <div className="flex-1 overflow-y-auto">{children}</div>
            </div>
        </>
    );
}

export default PageWithHeader;
