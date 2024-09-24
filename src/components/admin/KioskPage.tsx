"use client";

import OnlyRoles from "components/OnlyRoles";
import PageWithHeader from "components/PageWithHeader";
import React, { useState } from "react";
import KioskComponent from "components/admin/KioskComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faUser, faWrench } from "@fortawesome/free-solid-svg-icons";
import IconButton from "components/IconButton";

function KioskPage() {
    const [primarySocketFailed, setPrimarySocketFailed] = useState(false);
    const [nfcId, setNfcId] = useState("");

    const devTags = ["8b2a1345", "4bf41145", "00000000"];
    return (
        <PageWithHeader
            title="Kiosk"
            rightContent={
                primarySocketFailed ? (
                    <>
                        <div className="inline pr-3">
                            <IconButton
                                icon={<FontAwesomeIcon icon={faUser} />}
                                onClick={() => {
                                    setNfcId((prevId) => {
                                        const currentIndex =
                                            devTags.indexOf(prevId);
                                        const nextIndex =
                                            (currentIndex + 1) % devTags.length;
                                        return devTags[nextIndex];
                                    });
                                }}
                            />
                        </div>

                        <div className="inline-flex items-center">
                            <div className="has-tooltip relative">
                                <span className="tooltip absolute -left-48 -top-1 transform rounded bg-slate-800 p-1 text-center text-white shadow-lg transition-all">
                                    Dev mode is activated
                                </span>
                                <FontAwesomeIcon icon={faWrench} />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="inline-flex items-center">
                        <div className="has-tooltip relative">
                            <span className="tooltip absolute -left-48 -top-1 transform rounded bg-slate-800 p-1 text-center text-white shadow-lg transition-all">
                                Connected to local socket
                            </span>
                            <FontAwesomeIcon icon={faCheck} />
                        </div>
                    </div>
                )
            }
        >
            <OnlyRoles roles={["administrator", "lunch-system"]}>
                <KioskComponent
                    primarySocketFailed={primarySocketFailed}
                    setPrimarySocketFailed={setPrimarySocketFailed}
                    nfcId={nfcId}
                    setNfcId={setNfcId}
                />
            </OnlyRoles>
        </PageWithHeader>
    );
}

export default KioskPage;
