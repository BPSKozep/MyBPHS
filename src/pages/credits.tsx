import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

function Credits() {
    return (
        <>
            <header className="flex h-[7vh] items-center justify-center">
                <div className="flex cursor-default items-center text-white">
                    <Link href="/" className="absolute left-7">
                        <FontAwesomeIcon icon={faHome} />
                    </Link>
                    <h1 className="text-center text-xl font-black text-white sm:text-2xl">
                        Kreditek
                    </h1>
                </div>
            </header>
        </>
    );
}

export default Credits;
