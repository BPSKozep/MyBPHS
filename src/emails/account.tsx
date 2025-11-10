import {
  Body,
  CodeInline,
  Container,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export default function Account({
  name,
  password,
}: {
  name: string;
  password: string;
}) {
  return (
    <Html>
      <Preview>Elkészült a laptop fiókod.</Preview>
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
                Elkészült az iskolai laptopokhoz a fiókod. Felhasználónévként az
                email címedet tudod használni.
              </Text>

              <Text className="text-lg leading-6 text-white">
                Ideiglenes jelszavad:{" "}
                <CodeInline className="rounded-md bg-gray-600 p-1 font-bold">
                  {password}
                </CodeInline>
                <br />
                Ezt első bejelentkezéskor meg kell változtatni.
              </Text>

              <Hr />
              <Text className="text-lg leading-6 text-white">
                — A BPHS Rendszergazda csapata
              </Text>
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
