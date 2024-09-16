"use client";

import { PropsWithChildren, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Loading from "components/Loading";
import { usePathname } from "next/navigation";

const AUTH_WHITELIST = ["/auth/signin", "/forbidden"];

function OnlyAuthed({ children }: PropsWithChildren) {
    const { status } = useSession();
    const path = usePathname();

    const enabled = !AUTH_WHITELIST.includes(path);

    useEffect(() => {
        if (status === "unauthenticated" && enabled) {
            signIn();
        }
    }, [status, path, enabled]);

    if (status === "authenticated" || !enabled) return children;
    else {
        return (
            <div className="flex h-screen items-center justify-center text-xl font-bold">
                <Loading />
            </div>
        );
    }
}

export default OnlyAuthed;
