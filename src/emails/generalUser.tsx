import {
    Body,
    Container,
    Hr,
    Html,
    Img,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";

import * as React from "react";

interface GeneralProps {
    text: string;
    user: string;
}

export default function General({ text, user }: GeneralProps) {
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
                            <Text className="text-lg font-bold leading-6 text-white">
                                Kedves {user}!
                            </Text>
                            <Text className="whitespace-pre-wrap text-lg leading-6 text-white">
                                {text}
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
