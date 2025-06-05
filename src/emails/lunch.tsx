import {
    Body,
    Button,
    Container,
    Hr,
    Html,
    Img,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";

import * as React from "react";

import { env } from "@/env/client";

function Lunch() {
    return (
        <Html>
            <Preview>Az ebédrendelés már elérhető a következő hétre!</Preview>
            <Tailwind>
                <Body className="bg-gray-900 font-sans">
                    <Container className="mt-16 bg-slate-800 p-8">
                        <Section className="">
                            <Img
                                src="https://cdn.bpskozep.hu/mybphs-logo.png"
                                width="156"
                                height="42"
                            ></Img>
                            <Hr />
                            <Text className="text-lg leading-6 font-bold text-white">
                                Kedves diákok és tanárok!
                            </Text>
                            <Text className="text-lg leading-6 text-white">
                                Elérhető az ebédrendelés a következő hétre.
                                Kérjük jelöljétek azt is, ha mentes ételt kértek
                                vagy ha egyáltalán nem kértek ebédet.
                            </Text>
                            <Section className="text-center">
                                <Button
                                    className="w-96 cursor-pointer justify-center rounded-lg bg-slate-700 p-5 text-xl font-bold text-white"
                                    href={`https://${env.NEXT_PUBLIC_EMAIL_DOMAIN}/lunch`}
                                >
                                    Megrendelem
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

export default Lunch;
