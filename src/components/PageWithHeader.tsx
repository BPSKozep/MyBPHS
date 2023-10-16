import React, { PropsWithChildren } from "react";
import PageHeader from "./PageHeader";
import Head from "next/head";

function PageWithHeader({
    title,
    children,
}: { title: string } & PropsWithChildren) {
    return (
        <>
            <Head>
                <title>MyBPHS - {title}</title>
            </Head>
            <div className="flex h-full w-full flex-col items-center justify-center overflow-hidden">
                <PageHeader title={title} />
                <div className="h-full w-full">{children}</div>
            </div>
        </>
    );
}

export default PageWithHeader;
