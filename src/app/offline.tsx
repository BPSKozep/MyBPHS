import PageWithHeader from "@/components/PageWithHeader";
import React from "react";

export default function NoInternet() {
    return (
        <PageWithHeader title="">
            <div className="flex h-full items-center justify-center">
                <h1 className="text-xl text-white">Nincs internetkapcsolat.</h1>
            </div>
        </PageWithHeader>
    );
}
