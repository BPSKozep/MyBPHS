import AutoOrderComponent from "components/AutoOrderComponent";
import Card from "components/Card";
import PageWithHeader from "components/PageWithHeader";
import React from "react";

export const metadata = {
    title: "Automatikus Rendelés",
};

function AutoOrder() {
    return (
        <PageWithHeader title="Automatikus Rendelés">
            <div className="flex h-full w-full items-center justify-center align-middle">
                <Card>
                    <AutoOrderComponent />
                </Card>
            </div>
        </PageWithHeader>
    );
}

export default AutoOrder;
