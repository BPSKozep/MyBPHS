import { FaHome } from "react-icons/fa";
import Link from "next/link";
import React, { ReactNode } from "react";

function PageHeader({
    title,
    homeLocation = "/",
    rightContent,
}: {
    title: string | ReactNode;
    homeLocation: string;
    rightContent?: ReactNode;
}) {
    return (
        <header className="static flex h-16 flex-shrink-0 select-none items-center justify-center">
            <div className="flex cursor-default items-center text-white">
                <Link href={homeLocation} className="absolute left-7">
                    <FaHome className="h-5 w-5" />
                </Link>
                <h1 className="text-center text-xl font-black text-white sm:text-2xl">
                    {title}
                </h1>
                {rightContent && (
                    <div className="absolute right-7">{rightContent}</div>
                )}
            </div>
        </header>
    );
}

export default PageHeader;
