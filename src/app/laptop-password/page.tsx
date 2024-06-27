import Card from "components/Card";
import LaptopPasswordReset from "components/LaptopPasswordReset";
import PageWithHeader from "components/PageWithHeader";
import React from "react";

export const metadata = {
    title: "MyBPHS - Laptop Jelszó",
};

function LaptopPassword() {
    return (
        <PageWithHeader title="Laptop Jelszó">
            <div className="flex h-full w-full items-center justify-center align-middle">
                <Card>
                    <LaptopPasswordReset />
                </Card>
            </div>
        </PageWithHeader>
    );
}

export default LaptopPassword;
