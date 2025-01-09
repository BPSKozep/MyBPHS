import LaptopPasswordReset from "components/LaptopPasswordReset";
import PageWithHeader from "components/PageWithHeader";
import React from "react";

export const metadata = {
    title: "Laptop Jelszó",
};

function LaptopPassword() {
    return (
        <PageWithHeader title="Laptop Jelszó">
            <div className="flex h-full w-full items-center justify-center align-middle">
                <LaptopPasswordReset />
            </div>
        </PageWithHeader>
    );
}

export default LaptopPassword;
