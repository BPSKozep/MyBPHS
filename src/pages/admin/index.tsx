import OnlyRoles from "components/OnlyRoles";
import PageWithHeader from "components/PageWithHeader";
import React from "react";
import BigLinkButton from "components/BigLinkButton";

function Users() {
    return (
        <OnlyRoles roles={["administrator"]}>
            <PageWithHeader title="Admin">
                <div className="flex flex-row justify-center text-white lg:flex-row">
                    <div className="m-3 inline-grid grid-cols-1 grid-rows-4 gap-4 text-white sm:grid-cols-2 sm:grid-rows-2">
                        <BigLinkButton
                            title="Ebédrendelés"
                            url="/admin/lunch"
                        />
                        <BigLinkButton
                            title="Felhasználók"
                            url="/admin/users"
                        />
                        <BigLinkButton title="Órarend" url="/admin/timetable" />
                        <BigLinkButton title="Csoportok" url="/admin/groups" />
                    </div>
                </div>
            </PageWithHeader>
        </OnlyRoles>
    );
}

export default Users;
