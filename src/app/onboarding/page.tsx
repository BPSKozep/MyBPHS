import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

export const metadata = {
  title: "Fiók létrehozás",
};

export default async function Onboarding({
  searchParams,
}: {
  searchParams: Promise<{
    familyName?: string;
    givenName?: string;
    name?: string;
    email?: string;
  }>;
}) {
  const { familyName, givenName, name, email } = await searchParams;

  return (
    <OnboardingFlow
      familyName={familyName}
      givenName={givenName}
      displayName={name}
      email={email}
    />
  );
}
