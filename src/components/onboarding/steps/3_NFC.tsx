"use client";

import React, { useState } from "react";
import Button from "@/components/Button";
import { Input } from "@/components/ui/input";
import { FaIdCard, FaArrowRight } from "react-icons/fa";
import { InfoBox } from "@/components/InfoBox";

interface NFCStepProps {
    nfcId: string;
    setNfcId: (nfcId: string) => void;
    onNext: () => void;
}

export default function NFCStep({ nfcId, setNfcId, onNext }: NFCStepProps) {
    const [error, setError] = useState("");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase().replace(/[^A-F0-9]/g, "");
        if (value.length <= 8) {
            setNfcId(value);
            setError("");
        }
    };

    const handleNext = () => {
        if (nfcId.length !== 8) {
            setError(
                "Az NFC azonosító pontosan 8 karakter hosszú kell legyen.",
            );
            return;
        }
        onNext();
    };

    const isValid = nfcId.length === 8;

    return (
        <div className="flex flex-col items-center justify-center p-3 text-center">
            <div className="mb-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-600">
                    <FaIdCard className="h-8 w-8 text-white" />
                </div>
                <h1 className="mb-4 text-2xl font-bold text-white">
                    NFC azonosító
                </h1>
                <p className="mb-6 text-gray-300">
                    Kérjük, add meg a 8 karakteres NFC azonosítót.
                </p>
            </div>

            <div className="mb-6 w-full space-y-4">
                <div>
                    <label
                        htmlFor="nfcId"
                        className="mb-2 block text-left text-sm text-gray-400"
                    >
                        NFC Azonosító
                    </label>
                    <Input
                        id="nfcId"
                        type="text"
                        value={nfcId}
                        onChange={handleInputChange}
                        placeholder="12345678"
                        maxLength={8}
                        className="bg-gray-700 text-center font-mono text-lg tracking-widest text-white placeholder-gray-500"
                        autoComplete="off"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                        8 karakter (számok és A-F betűk)
                    </p>
                </div>

                {error && <InfoBox variant="error">{error}</InfoBox>}
            </div>

            <div className="flex w-full gap-3">
                <Button
                    onClick={handleNext}
                    disabled={!isValid}
                    className="flex flex-1 items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
                >
                    Folytatás
                    <FaArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
