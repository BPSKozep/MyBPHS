import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome } from "@fortawesome/free-solid-svg-icons";

function Credits() {
    return (
        <>
            <div className="flex bg-slate-800 items-center justify-center h-[7vh]">
                <div className="flex items-center gap-2 cursor-default text-white">
                    <FontAwesomeIcon icon={faHome} />
                    <h1 className="text-center text-xl sm:text-2xl font-black text-white">
                        Kreditek
                    </h1>
                </div>
            </div>
        </>
    );
}

export default Credits;
