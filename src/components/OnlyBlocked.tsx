"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PropsWithChildren, useEffect } from "react";
import { trpc } from "utils/trpc";
import Loading from "./Loading";

function OnlyBlocked({ children }: PropsWithChildren) {
    const router = useRouter();
    const { data } = useSession();
    const { data: user } = trpc.user.get.useQuery(data?.user?.email || "");

    useEffect(() => {
        if (user && !user.blocked) router.replace("/lunch");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    if (user && user.blocked) return children;

    return (
        <div className="flex h-full w-full items-center justify-center align-middle">
            <Loading />
        </div>
    );
}

export default OnlyBlocked;
