import LaptopPasswordReset from "@/components/LaptopPasswordReset";
import PageWithHeader from "@/components/PageWithHeader";
import React from "react";

export const metadata = {
    title: "Laptop Jelszó",
};

export default function LaptopPassword() {
    return (
        <PageWithHeader title="Laptop Jelszó">
            <div className="flex h-full w-full items-center justify-center align-middle">
                <LaptopPasswordReset />
            </div>
        </PageWithHeader>
    );
}
