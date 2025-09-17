"use client";

import React, { useState } from "react";
import Image from "next/image";
import Loading from "../Loading";
import { signIn } from "next-auth/react";

export default function GoogleSignIn() {
    const [clicked, setClicked] = useState(false);

    return (
        <div
            onClick={() => {
                setClicked(true);
                signIn("google", { callbackUrl: "/" }).catch((error) => {
                    console.error(error);
                });
            }}
            className="flex h-14 w-full max-w-sm cursor-pointer rounded-2xl border-4 bg-gray-300 align-middle transition-all duration-300 select-none hover:border-blue-400"
        >
            <div className="relative flex w-full items-center justify-center align-middle">
                {!clicked ? (
                    <div className="flex items-center space-x-4">
                        <Image
                            src="https://cdn.bphs.hu/google.svg"
                            alt="google logo"
                            width={24}
                            height={24}
                        />

                        <span className="text-center font-bold tracking-wide text-black">
                            Továbblépés Google-lel
                        </span>
                    </div>
                ) : (
                    <div className="scale-90">
                        <Loading />
                    </div>
                )}
            </div>
        </div>
    );
}
