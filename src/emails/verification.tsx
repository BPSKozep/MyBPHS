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
    CodeInline,
} from "@react-email/components";

import * as React from "react";

interface VerificationProps {
    name: string;
    code: string;
}

export default function Verification({ name, code }: VerificationProps) {
    return (
        <Html>
            <Preview>Email verifikációs kódod: {code}</Preview>
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
                            <Text className="text-lg leading-6 text-white">
                                Az email címed megerősítéséhez kérjük, add meg
                                az alábbi verifikációs kódot:
                            </Text>

                            <Section className="my-8 text-center">
                                <CodeInline className="rounded-md bg-blue-600 p-3 text-xl font-bold tracking-widest text-white">
                                    {code}
                                </CodeInline>
                            </Section>

                            <Text className="text-lg leading-6 text-white">
                                Ez a kód 10 percig érvényes. Ha nem te kérted
                                ezt a verifikációt, kérjük, hagyd figyelmen
                                kívül ezt az emailt.
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
