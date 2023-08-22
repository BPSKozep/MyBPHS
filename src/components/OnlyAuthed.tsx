import { PropsWithChildren, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";

function OnlyAuthed({ children }: PropsWithChildren) {
    const { status } = useSession();

    useEffect(() => {
        if (status === "unauthenticated") {
            signIn();
        }
    }, [status]);

    if (status === "authenticated") return children;
}

export default OnlyAuthed;
