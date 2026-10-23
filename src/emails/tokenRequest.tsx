import {
  Body,
  Container,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "react-email";

interface TokenRequestProps {
  name: string;
}

export default function TokenRequest({ name }: TokenRequestProps) {
  return (
    <Html>
      <Preview>Megkaptuk az új token igénylésedet.</Preview>
      <Tailwind>
        <Body className="bg-gray-900 font-sans">
          <Container className="my-16 rounded-lg bg-slate-800 p-8">
            <Section>
              <Img
                src="https://cdn.bphs.hu/mybphs-logo.png"
                width="156"
                height="42"
              />
              <Hr />
              <Text className="text-lg font-bold leading-6 text-white">
                Kedves {name}!
              </Text>
              <Text className="text-base leading-6 text-white">
                Megkaptuk az új token igénylésedet. Márk hamarosan felkeres a
                további információkkal.
              </Text>
              <Hr />
              <Text className="text-xs leading-4 text-slate-400">
                Budapest School Általános Iskola és Gimnázium
                <br />
                Budapest, II. János Pál pápa tér 25, 1081
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

TokenRequest.PreviewProps = { name: "Anna" } satisfies TokenRequestProps;
