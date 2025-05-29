"use client";

import { type PropsWithChildren, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Loading from "@/components/Loading";
import { usePathname } from "next/navigation";

const AUTH_WHITELIST = ["/auth/signin", "/forbidden"];

export default function OnlyAuthed({ children }: PropsWithChildren) {
    const session = useSession();
    const path = usePathname();

    const enabled = !AUTH_WHITELIST.includes(path);

    useEffect(() => {
        if (session.status === "unauthenticated" && enabled) {
            signIn().catch((error) => {
                console.error(error);
            });
        }
    }, [session.status, path, enabled]);

    if (session.status === "authenticated" || !enabled) return children;
    else {
        return (
            <div className="flex h-screen items-center justify-center text-xl font-bold">
                <Loading />
            </div>
        );
    }
}
