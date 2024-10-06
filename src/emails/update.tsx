import {
    Body,
    Button,
    Container,
    Hr,
    Html,
    Img,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";

import * as React from "react";

interface UpdateProps {
    text: string;
    link?: string;
    buttonText?: string;
}
function Update({ text, link, buttonText }: UpdateProps) {
    return (
        <Html>
            <Tailwind>
                <Body className="bg-gray-900 font-sans">
                    <Container className="mt-16 bg-slate-800 p-8">
                        <Section>
                            <Img
                                src="https://cdn.bpskozep.hu/mybphs-logo.png"
                                width="156"
                                height="42"
                            ></Img>
                            <Hr />
                            <Text className="text-center text-lg font-bold leading-6 text-white">
                                Elérhető az új MyBPHS verzió!
                            </Text>
                            <Text className="text-md leading-6 text-white">
                                {text}
                            </Text>
                            <Section className="text-center">
                                <Button
                                    className="w-96 cursor-pointer justify-center rounded-lg bg-slate-700 p-5 text-xl font-bold text-white"
                                    href={link}
                                >
                                    {buttonText}
                                </Button>
                            </Section>
                            <Hr />
                            <Text className="text-lg leading-6 text-white">
                                — A BPHS Rendszergazda csapata
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

export default Update;
