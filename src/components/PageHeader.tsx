import { FaHome } from "react-icons/fa";
import Link from "next/link";
import React, { type ReactNode } from "react";

export default function PageHeader({
    title,
    homeLocation = "/",
    rightContent,
}: {
    title: string | ReactNode;
    homeLocation: string;
    rightContent?: ReactNode;
}) {
    return (
        <header className="static flex h-16 shrink-0 items-center justify-center select-none">
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
