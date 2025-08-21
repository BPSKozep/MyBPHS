import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import React from "react";

export const metadata = {
    title: "Fiók létrehozás",
};

export default async function Onboarding({
    searchParams,
}: {
    searchParams: Promise<{
        name?: string;
        email?: string;
    }>;
}) {
    const { name, email } = await searchParams;

    return <OnboardingFlow name={name} email={email} />;
}
