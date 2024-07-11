"use client";

import { PropsWithChildren, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Loading from "components/Loading";
import { usePathname } from "next/navigation";

function OnlyAuthed({
    enable,
    children,
}: { enable?: boolean } & PropsWithChildren) {
    const { status } = useSession();
    const path = usePathname();
    useEffect(() => {
        if (status === "unauthenticated" && enable && path !== "/forbidden") {
            signIn();
        }
    }, [status, enable, path]);

    if (status === "authenticated" || !enable) return children;
    else
        return (
            <div className="flex h-screen items-center justify-center text-xl font-bold">
                <Loading />
            </div>
        );
}

export default OnlyAuthed;
