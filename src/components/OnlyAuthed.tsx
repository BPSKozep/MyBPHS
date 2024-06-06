import { PropsWithChildren, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Loading from "./Loading";

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
    else
        return (
            <div className="flex h-screen items-center justify-center text-xl font-bold">
                {/* <h1 className="text-white">Betöltés...</h1> */}
                <Loading />
            </div>
        );
}

export default OnlyAuthed;
