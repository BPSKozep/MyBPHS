"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import WelcomeStep from "./steps/1_Welcome";
import EmailVerificationStep from "./steps/2_EmailVerification";
import NFCStep from "./steps/3_NFC";
import PasswordStep from "./steps/4_Password";
import LoadingStep from "./steps/5_Create";
import { InfoBox } from "@/components/InfoBox";
import { FaExclamationTriangle } from "react-icons/fa";

interface OnboardingFlowProps {
    name?: string;
    email?: string;
}

export type OnboardingStep =
    | "welcome"
    | "verification"
    | "nfc"
    | "password"
    | "loading"
    | "complete";

export default function OnboardingFlow({ name, email }: OnboardingFlowProps) {
    const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
    const [password, setPassword] = useState("");
    const [nfcId, setNfcId] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const router = useRouter();

    // Check if required data is missing
    if (!name || !email) {
        return (
            <div className="flex h-full w-full items-center justify-center p-6">
                <InfoBox variant="error" icon={FaExclamationTriangle}>
                    Hiányzó felhasználói adatok. Kérjük, jelentkezzen be újra.
                </InfoBox>
            </div>
        );
    }

    const nextStep = () => {
        if (currentStep === "welcome") {
            setCurrentStep("verification");
        } else if (currentStep === "verification") {
            // Only proceed if email is verified
            if (isEmailVerified) {
                setCurrentStep("nfc");
            }
        } else if (currentStep === "nfc") {
            setCurrentStep("password");
        } else if (currentStep === "password") {
            // Additional check before creating account
            if (isEmailVerified) {
                setCurrentStep("loading");
            }
        }
    };

    const handleAccountCreated = () => {
        // Redirect to login after successful account creation
        setTimeout(() => {
            router.push("/auth/signin");
        }, 1500);
    };

    const slideVariants = {
        enter: { x: 300, opacity: 0 },
        center: { x: 0, opacity: 1 },
        exit: { x: -300, opacity: 0 },
    };

    return (
        <div className="flex h-full w-full items-center justify-center p-4">
            <div className="w-full max-w-md">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={currentStep}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 },
                        }}
                    >
                        <Card>
                            {currentStep === "welcome" && (
                                <WelcomeStep
                                    name={name}
                                    email={email}
                                    onNext={nextStep}
                                    onUserExists={() =>
                                        router.push("/auth/signin")
                                    }
                                />
                            )}
                            {currentStep === "verification" && (
                                <EmailVerificationStep
                                    name={name}
                                    email={email}
                                    verificationCode={verificationCode}
                                    setVerificationCode={setVerificationCode}
                                    isEmailVerified={isEmailVerified}
                                    setIsEmailVerified={setIsEmailVerified}
                                    onNext={nextStep}
                                    onBack={() => {
                                        setCurrentStep("welcome");
                                        setIsEmailVerified(false);
                                        setVerificationCode("");
                                    }}
                                />
                            )}
                            {currentStep === "nfc" && (
                                <NFCStep
                                    nfcId={nfcId}
                                    setNfcId={setNfcId}
                                    onNext={nextStep}
                                />
                            )}

                            {currentStep === "password" && (
                                <PasswordStep
                                    password={password}
                                    setPassword={setPassword}
                                    onNext={nextStep}
                                    onBack={() => setCurrentStep("nfc")}
                                />
                            )}
                            {currentStep === "loading" && (
                                <LoadingStep
                                    name={name}
                                    email={email}
                                    password={password}
                                    nfcId={nfcId}
                                    verificationCode={verificationCode}
                                    onComplete={handleAccountCreated}
                                />
                            )}
                        </Card>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
