"use client";

import React from "react";
import GoogleSignIn from "./GoogleSignIn";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

function SignInComponent() {
    const session = useSession();
    const router = useRouter();

    if (session.status === "authenticated") {
        router.push("/");
        return <h1>Már bejelentkezve, átirányítás.</h1>;
    }
    return (
        <div className="flex flex-col items-center">
            <h1 className="mb-20 text-xl font-bold">Bejelentkezés</h1>
            <GoogleSignIn />
        </div>
    );
}

export default SignInComponent;
