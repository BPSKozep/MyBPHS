"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/Button";
import Loading from "@/components/Loading";
import { api } from "@/trpc/react";
import { FaArrowRight } from "react-icons/fa";

interface WelcomeStepProps {
    name: string;
    email: string;
    onNext: () => void;
    onUserExists: () => void;
}

export default function WelcomeStep({
    name,
    email,
    onNext,
    onUserExists,
}: WelcomeStepProps) {
    const [checking, setChecking] = useState(true);

    const checkUser = api.user.checkExists.useQuery(
        { email },
        {
            enabled: !!email,
            retry: false,
        },
    );

    useEffect(() => {
        if (checkUser.data !== undefined) {
            if (checkUser.data) {
                onUserExists();
            } else {
                setChecking(false);
            }
        }
        if (checkUser.error) {
            setChecking(false);
        }
    }, [checkUser.data, checkUser.error, onUserExists]);

    if (checking) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <Loading />
                <p className="mt-4 text-white">Kérés ellenőrzése...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-3 text-center">
            <div className="mb-8">
                <h1 className="mb-4 text-3xl font-bold text-white">Helló!</h1>
                <p className="mb-6 text-lg text-gray-300">
                    Úgy tűnik, még nincs fiókod. Hozzuk létre most!
                </p>
            </div>

            <div className="mb-8 w-full space-y-4">
                <div className="flex items-center gap-3 rounded-lg bg-gray-700 p-4">
                    <div className="text-left">
                        <p className="text-sm text-gray-400">Név</p>
                        <p className="font-medium break-words text-white">
                            {name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-gray-700 p-4">
                    <div className="text-left">
                        <p className="text-sm text-gray-400">Email cím</p>
                        <p className="font-medium break-all text-white">
                            {email}
                        </p>
                    </div>
                </div>
            </div>

            <Button
                onClick={onNext}
                className="flex w-full items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
                Kezdjük
                <FaArrowRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
