"use client";

import React, { useState } from "react";
import Button from "@/components/Button";
import { Input } from "@/components/ui/input";
import {
    FaLock,
    FaArrowRight,
    FaArrowLeft,
    FaEye,
    FaEyeSlash,
} from "react-icons/fa";
import { InfoBox } from "@/components/InfoBox";

interface PasswordStepProps {
    password: string;
    setPassword: (password: string) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function PasswordStep({
    password,
    setPassword,
    onNext,
    onBack,
}: PasswordStepProps) {
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        setError("");
    };

    const handleNext = () => {
        if (password.length < 8) {
            setError("A jelszónak legalább 8 karakter hosszúnak kell lennie.");
            return;
        }
        onNext();
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const isValid = password.length >= 8;

    return (
        <div className="flex flex-col items-center justify-center p-3 text-center">
            <div className="mb-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
                    <FaLock className="h-8 w-8 text-white" />
                </div>
                <h1 className="mb-4 text-2xl font-bold text-white">
                    Jelszó megadása
                </h1>
                <p className="mb-6 text-gray-300">
                    Kérjük, válassz egy biztonságos jelszót a fiókodhoz.
                </p>
            </div>

            <div className="mb-6 w-full space-y-4">
                <div>
                    <label
                        htmlFor="password"
                        className="mb-2 block text-left text-sm text-gray-400"
                    >
                        Jelszó
                    </label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={handleInputChange}
                            placeholder="Legalább 8 karakter"
                            className="bg-gray-700 pr-12 text-white placeholder-gray-500"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                            {showPassword ? (
                                <FaEyeSlash className="h-4 w-4" />
                            ) : (
                                <FaEye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>

                {error && <InfoBox variant="error">{error}</InfoBox>}
            </div>

            <div className="flex w-full gap-3">
                <Button
                    onClick={onBack}
                    className="flex flex-1 items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700"
                >
                    <FaArrowLeft className="h-4 w-4" />
                    Vissza
                </Button>

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
