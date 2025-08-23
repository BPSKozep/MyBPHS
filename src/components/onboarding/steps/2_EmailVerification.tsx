"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Button from "@/components/Button";
import Loading from "@/components/Loading";
import { api } from "@/trpc/react";
import { FaArrowRight, FaArrowLeft, FaEnvelope } from "react-icons/fa";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { InfoBox } from "@/components/InfoBox";
import { FaExclamationTriangle } from "react-icons/fa";
import { REGEXP_ONLY_DIGITS } from "input-otp";

interface EmailVerificationStepProps {
    name: string;
    email: string;
    onNext: () => void;
    onBack: () => void;
    verificationCode: string;
    setVerificationCode: (code: string) => void;
    isEmailVerified: boolean;
    setIsEmailVerified: (verified: boolean) => void;
}

export default function EmailVerificationStep({
    name,
    email,
    onNext,
    onBack,
    verificationCode,
    setVerificationCode,
    isEmailVerified,
    setIsEmailVerified,
}: EmailVerificationStepProps) {
    const [emailSent, setEmailSent] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState<string>("");
    const [resendTimer, setResendTimer] = useState(0);
    const hasInitiatedSend = useRef(false);
    const hasMounted = useRef(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const lastAttemptedCode = useRef<string>("");

    const sendVerificationCode = api.email.sendVerificationCode.useMutation({
        onSuccess: () => {
            setEmailSent(true);
            setError("");
            // Start 15 second timer
            setResendTimer(15);
        },
        onError: (error) => {
            setError(error.message);
        },
        onSettled: () => {
            setIsResending(false);
        },
    });

    const verifyCode = api.email.verifyCode.useMutation({
        onSuccess: () => {
            setError("");
            setIsEmailVerified(true);
            // Show success message first, then proceed
            setTimeout(() => {
                // Double-check that we're still on the verification step
                onNext();
            }, 800);
        },
        onError: (error) => {
            setError(error.message);
            setIsEmailVerified(false);
        },
        onSettled: () => {
            setVerifying(false);
        },
    });

    const handleSendCode = () => {
        // Prevent double sending
        if (hasInitiatedSend.current) {
            return;
        }

        hasInitiatedSend.current = true;
        setIsResending(true);
        setError("");
        sendVerificationCode.mutate({
            email,
            name,
        });
    };

    const handleVerifyCode = useCallback(() => {
        if (verificationCode.length !== 6) {
            setError("Kérjük, add meg a teljes 6 számjegyű kódot.");
            return;
        }

        // Record the attempted code to prevent auto-retry of the same code
        lastAttemptedCode.current = verificationCode;

        setVerifying(true);
        setError("");
        verifyCode.mutate({
            email,
            code: verificationCode,
        });
    }, [verificationCode, email, verifyCode]);

    const handleResendCode = () => {
        // Reset the ref to allow resending
        hasInitiatedSend.current = false;
        lastAttemptedCode.current = ""; // Clear attempted code to allow new attempts
        setEmailSent(false);
        setVerificationCode("");
        setResendTimer(15); // Reset timer for resend
        handleSendCode();
    };

    // Timer countdown effect
    useEffect(() => {
        if (resendTimer > 0) {
            timerRef.current = setTimeout(() => {
                setResendTimer(resendTimer - 1);
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [resendTimer]);

    // Clear last attempted code when user modifies the code
    useEffect(() => {
        if (verificationCode.length < 6) {
            lastAttemptedCode.current = "";
        }
    }, [verificationCode]);

    // Auto-verify when 6 digits are entered (only if code changed since last attempt)
    useEffect(() => {
        if (
            verificationCode.length === 6 &&
            !verifying &&
            !isEmailVerified &&
            verificationCode !== lastAttemptedCode.current
        ) {
            handleVerifyCode();
        }
    }, [verificationCode, verifying, isEmailVerified, handleVerifyCode]);

    React.useEffect(() => {
        // Only run once on mount
        if (!hasMounted.current && !hasInitiatedSend.current) {
            hasMounted.current = true;
            hasInitiatedSend.current = true;
            setIsResending(true);
            setError("");
            sendVerificationCode.mutate({
                email,
                name,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array - only run on mount

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    if (!emailSent && isResending) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <Loading />
                <p className="mt-4 text-white">Email küldése...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-3 text-center">
            <div className="mb-8">
                <FaEnvelope className="mx-auto mb-4 h-12 w-12 text-blue-500" />
                <h1 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
                    Email Megerősítés
                </h1>
                <p className="text-md mb-2 text-gray-300 sm:text-lg">
                    Küldtünk egy 6 számjegyű kódot az email címedre:
                </p>
                <p className="mb-6 text-lg font-medium break-all text-blue-500">
                    {email}
                </p>
                <p className="text-sm text-gray-400">
                    Add meg a kódot a folytatáshoz. A kód 10 percig érvényes.
                </p>
            </div>

            {error && (
                <div className="mb-6 w-full">
                    <InfoBox variant="error" icon={FaExclamationTriangle}>
                        {error}
                    </InfoBox>
                </div>
            )}

            <div className="mb-8 w-full space-y-6">
                <div className="flex flex-col items-center gap-4">
                    <InputOTP
                        maxLength={6}
                        value={verificationCode}
                        onChange={setVerificationCode}
                        disabled={verifying || isEmailVerified}
                        pattern={REGEXP_ONLY_DIGITS}
                    >
                        <InputOTPGroup className="gap-1 sm:gap-2">
                            <InputOTPSlot
                                index={0}
                                className="h-11 w-11 border-gray-600 bg-gray-700 text-xl font-bold text-white md:h-12 md:w-12"
                            />
                            <InputOTPSlot
                                index={1}
                                className="h-11 w-11 border-gray-600 bg-gray-700 text-xl font-bold text-white md:h-12 md:w-12"
                            />
                            <InputOTPSlot
                                index={2}
                                className="h-11 w-11 border-gray-600 bg-gray-700 text-xl font-bold text-white md:h-12 md:w-12"
                            />
                            <InputOTPSlot
                                index={3}
                                className="h-11 w-11 border-gray-600 bg-gray-700 text-xl font-bold text-white md:h-12 md:w-12"
                            />
                            <InputOTPSlot
                                index={4}
                                className="h-11 w-11 border-gray-600 bg-gray-700 text-xl font-bold text-white md:h-12 md:w-12"
                            />
                            <InputOTPSlot
                                index={5}
                                className="h-11 w-11 border-gray-600 bg-gray-700 text-xl font-bold text-white md:h-12 md:w-12"
                            />
                        </InputOTPGroup>
                    </InputOTP>
                </div>

                <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isResending || isEmailVerified || resendTimer > 0}
                    className="text-sm text-blue-500 hover:text-blue-300 disabled:text-gray-500"
                >
                    {isResending
                        ? "Küldés..."
                        : isEmailVerified
                          ? "Email megerősítve!"
                          : resendTimer > 0
                            ? `Újraküldés ${resendTimer} másodperc múlva`
                            : "Kód újraküldése"}
                </button>
            </div>

            <div className="flex w-full gap-3">
                <Button
                    onClick={onBack}
                    className="flex flex-1 items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700"
                    disabled={verifying}
                >
                    <FaArrowLeft className="h-4 w-4" />
                    Vissza
                </Button>
                <Button
                    onClick={isEmailVerified ? onNext : handleVerifyCode}
                    className={`flex flex-1 items-center justify-center gap-2 ${
                        isEmailVerified
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500"
                    }`}
                    disabled={
                        !isEmailVerified &&
                        (verificationCode.length !== 6 || verifying)
                    }
                >
                    {verifying ? (
                        <>Ellenőrzés...</>
                    ) : isEmailVerified ? (
                        <>
                            Tovább
                            <FaArrowRight className="h-4 w-4" />
                        </>
                    ) : (
                        <>
                            Kód ellenőrzése
                            <FaArrowRight className="h-4 w-4" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
