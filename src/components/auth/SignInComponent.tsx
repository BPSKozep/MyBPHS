"use client";

import React from "react";
import GoogleSignIn from "@/components/auth/GoogleSignIn";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInComponent() {
    const session = useSession();
    const router = useRouter();

    if (session.status === "authenticated") {
        router.push("/");
        return <h1>Már bejelentkezve, átirányítás.</h1>;
    }
    return (
        <div className="flex flex-col items-center">
            <h1 className="mb-10 text-center text-xl font-bold">
                A MyBPHS csak az iskola felhasználói
                <br /> számára elérhető
            </h1>
            <GoogleSignIn />
        </div>
    );
}
