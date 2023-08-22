import { PropsWithChildren, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";

function OnlyAuthed({
    enable,
    children,
}: { enable: boolean } & PropsWithChildren) {
    const { status } = useSession();

    useEffect(() => {
        if (status === "unauthenticated" && enable) {
            signIn();
        }
    }, [status, enable]);

    if (status === "authenticated" || !enable) return children;
}

export default OnlyAuthed;
