"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import WelcomeStep from "./steps/Welcome";
import NFCStep from "./steps/NFC";
import LoadingStep from "./steps/Loading";
import { InfoBox } from "@/components/InfoBox";
import { FaExclamationTriangle } from "react-icons/fa";

interface OnboardingFlowProps {
    name?: string;
    email?: string;
}

export type OnboardingStep = "welcome" | "nfc" | "loading" | "complete";

export default function OnboardingFlow({ name, email }: OnboardingFlowProps) {
    const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
    const [nfcId, setNfcId] = useState("");
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
            setCurrentStep("nfc");
        } else if (currentStep === "nfc") {
            setCurrentStep("loading");
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
                            {currentStep === "nfc" && (
                                <NFCStep
                                    nfcId={nfcId}
                                    setNfcId={setNfcId}
                                    onNext={nextStep}
                                    onBack={() => setCurrentStep("welcome")}
                                />
                            )}
                            {currentStep === "loading" && (
                                <LoadingStep
                                    name={name}
                                    email={email}
                                    nfcId={nfcId}
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
