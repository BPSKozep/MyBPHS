"use client";

import React from "react";
import GoogleSignIn from "components/GoogleSignIn";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SignInComponent() {
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
            <div className="mt-5 flex flex-row">
                <Image
                    src="https://cdn.bpskozep.hu/bps-logo.svg"
                    alt="bps logo"
                    width={100}
                    height={50}
                />
            </div>
        </div>
    );
}
