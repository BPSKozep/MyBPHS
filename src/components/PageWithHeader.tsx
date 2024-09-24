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
            <div className="flex h-full w-full flex-col items-center">
                <PageHeader
                    title={title}
                    homeLocation={homeLocation}
                    rightContent={rightContent}
                />
                <div className="h-full w-full">{children}</div>
            </div>
        </>
    );
}

export default PageWithHeader;
