"use client";

import React, { useEffect, useState, useRef } from "react";
import Loading from "@/components/Loading";
import { api } from "@/trpc/react";
import { FaCheck, FaExclamationTriangle } from "react-icons/fa";
import { InfoBox } from "@/components/InfoBox";

interface LoadingStepProps {
    name: string;
    email: string;
    password: string;
    nfcId: string;
    verificationCode: string;
    onComplete: () => void;
}

export default function LoadingStep({
    name,
    email,
    password,
    nfcId,
    verificationCode,
    onComplete,
}: LoadingStepProps) {
    const [step, setStep] = useState<"creating" | "success" | "error">(
        "creating",
    );
    const [errorMessage, setErrorMessage] = useState("");
    const hasStarted = useRef(false);

    const createUser = api.user.onboard.useMutation({
        onSuccess: () => {
            setTimeout(() => {
                setStep("success");
                setTimeout(() => {
                    onComplete();
                }, 3000);
            }, 2000); // Artificial delay for better UX
        },
        onError: (error) => {
            setTimeout(() => {
                setStep("error");
                setErrorMessage(error.message);
            }, 1000);
        },
    });

    useEffect(() => {
        if (!hasStarted.current) {
            hasStarted.current = true;
            setTimeout(() => {
                createUser.mutate({
                    name,
                    email,
                    password,
                    nfcId,
                    verificationCode,
                });
            }, 500);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [name, email, password, nfcId, verificationCode]);

    if (step === "creating") {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="mb-8">
                    <Loading />
                </div>
                <h1 className="mb-4 text-xl font-bold text-white">
                    Fiók létrehozása...
                </h1>
                <p className="text-gray-300">
                    Kérjük, várj, amíg létrehozzuk a fiókodat.
                </p>
            </div>
        );
    }

    if (step === "success") {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-600">
                    <FaCheck className="h-8 w-8 text-white" />
                </div>
                <h1 className="mb-4 text-xl font-bold text-white">
                    Sikeres regisztráció!
                </h1>
                <p className="text-gray-300">
                    Átirányítás a bejelentkezési oldalra...
                </p>
            </div>
        );
    }

    if (step === "error") {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-600">
                    <FaExclamationTriangle className="h-8 w-8 text-white" />
                </div>
                <h1 className="mb-4 text-xl font-bold text-white">
                    Hiba történt
                </h1>
                <p className="mb-6 text-gray-300">
                    A fiók létrehozása során hiba lépett fel.
                </p>

                <InfoBox variant="error" className="mb-6">
                    {errorMessage}
                </InfoBox>

                <p className="text-sm text-gray-400">
                    Kérjük, fordulj a rendszergazdákhoz segítségért.
                </p>
            </div>
        );
    }

    return null;
}
