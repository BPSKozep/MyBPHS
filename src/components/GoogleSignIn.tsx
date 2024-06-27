"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import React from "react";

function GoogleSignIn() {
    return (
        <div
            onClick={() => {
                signIn("google", { callbackUrl: "/" });
            }}
            className="flex h-12 cursor-pointer select-none rounded-full border-2 border-gray-300 px-6 align-middle transition-all duration-300 hover:border-blue-400"
        >
            <div className="relative flex items-center justify-center space-x-4 px-2 align-middle">
                <Image
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    className="absolute left-0 w-5"
                    alt="google logo"
                />
                <span className="w-max font-semibold tracking-wide text-white transition duration-300">
                    Bejelentkezés Google-lel
                </span>
            </div>
        </div>
    );
}

export default GoogleSignIn;
