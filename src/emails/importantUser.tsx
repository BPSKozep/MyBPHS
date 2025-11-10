import {
  Body,
  Container,
  Hr,
  Html,
  Img,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface ImportantProps {
  html: string;
  user: string;
}

export default function Important({ html, user }: ImportantProps) {
  return (
    <Html>
      <Tailwind>
        <Body className="bg-gray-900 font-sans">
          <Container className="mt-16 bg-slate-800 p-8">
            <Section>
              <Img
                src="https://cdn.bphs.hu/mybphs-logo.png"
                width="156"
                height="42"
              ></Img>
              <Hr />
              <Text className="text-lg leading-6 font-bold text-white">
                Kedves {user}!
              </Text>
              <div
                className="text-lg leading-6 text-white"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: todo review
                dangerouslySetInnerHTML={{ __html: html }}
              />

              <Hr />
              <Text className="text-xs leading-4 text-slate-400">
                Budapest School Általános Iskola és Gimnázium, Budapest, II.
                János Pál pápa tér 25.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
