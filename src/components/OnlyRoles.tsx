import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { PropsWithChildren, useEffect, useMemo } from "react";
import { trpc } from "utils/trpc";

function OnlyRoles({
    roles,
    children,
}: { roles: string[] } & PropsWithChildren) {
    const router = useRouter();
    const { data } = useSession();
    const { data: user } = trpc.user.get.useQuery(data?.user?.email || "");
    const isAllowed = useMemo(
        () => roles.some((role) => user && user.roles.indexOf(role) !== -1),
        [roles, user]
    );

    useEffect(() => {
        if (user && !isAllowed) router.replace("/forbidden");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isAllowed]);

    if (isAllowed) return children;
}

export default OnlyRoles;
