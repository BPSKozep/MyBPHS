import React from "react";
import PageWithHeader from "components/PageWithHeader";

import LunchOrder from "components/LunchOrder";

function Order() {
    return (
        <>
            <PageWithHeader title="Ebédrendelés">
                <LunchOrder />
            </PageWithHeader>
        </>
    );
}

export default Order;
