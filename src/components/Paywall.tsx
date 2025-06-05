"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { api } from "@/trpc/react";
import Loading from "./Loading";

export default function Paywall({ children }: PropsWithChildren) {
    const router = useRouter();
    const session = useSession();
    const user = api.user.get.useQuery(session.data?.user?.email ?? "");

    useEffect(() => {
        if (user.data?.blocked) router.replace("/pay");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.data]);

    if (!user.data?.blocked) return children;

    return (
        <div className="flex h-full w-full items-center justify-center align-middle">
            <Loading />
        </div>
    );
}
