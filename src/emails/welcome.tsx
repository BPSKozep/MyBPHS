import {
    Body,
    Container,
    Hr,
    Html,
    Img,
    Preview,
    Section,
    Text,
    Tailwind,
    Button,
} from "@react-email/components";

import * as React from "react";

interface WelcomeProps {
    name: string;
    isOnboarding?: boolean;
}

export default function Welcome({ name, isOnboarding = false }: WelcomeProps) {
    return (
        <Html>
            <Preview>Üdvözlünk a MyBPHS rendszerben!</Preview>
            <Tailwind>
                <Body className="bg-gray-900 font-sans">
                    <Container className="mt-16 bg-slate-800 p-8">
                        <Section className="">
                            <Img
                                src="https://cdn.bphs.hu/mybphs-logo.png"
                                width="156"
                                height="42"
                            ></Img>
                            <Hr />
                            <Text className="text-lg leading-6 font-bold text-white">
                                Kedves {name}!
                            </Text>
                            <Text className="text-center text-lg leading-6 text-white">
                                {isOnboarding
                                    ? "Üdvözlünk a MyBPHS rendszerben! Sikeresen létrehoztad a fiókodat."
                                    : "Üdvözlünk a MyBPHS rendszerben! Az adminisztrátorok létrehozták a fiókodat."}
                            </Text>

                            <Text className="text-lg leading-6 text-white">
                                A MyBPHS a Budapest School JPP digitális
                                rendszere, ahol:
                            </Text>
                            <Section className="ml-4">
                                <Text className="text-base leading-6 text-white">
                                    • Ebédet rendelhetsz
                                </Text>
                                <Text className="text-base leading-6 text-white">
                                    • Iskolai jelszavadat módosíthatod (Laptop
                                    és WiFi bejelentkezés)
                                </Text>
                                <Text className="text-base leading-6 text-white">
                                    • Chatelhetsz a MyBPHS Intelligence ✨
                                    AI-jal
                                </Text>
                            </Section>

                            <Section className="my-8 text-center">
                                <Button
                                    className="rounded-md bg-blue-600 px-6 py-3 text-lg font-semibold text-white no-underline"
                                    href="https://my.bphs.hu"
                                >
                                    Belépés a MyBPHS-be
                                </Button>
                            </Section>

                            <Text className="text-lg leading-6 text-white">
                                Ha bármilyen kérdésed van, fordulj bizalommal a
                                rendszergazda csapathoz.
                            </Text>

                            <Hr />
                            <Text className="text-lg leading-6 text-white">
                                — A MyBPHS csapata
                            </Text>
                            <Hr />
                            <Text className="text-xs leading-4 text-slate-400">
                                Budapest School Általános Iskola és Gimnázium,
                                Budapest, II. János Pál pápa tér 25.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}
