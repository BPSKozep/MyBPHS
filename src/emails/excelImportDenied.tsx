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
} from "@react-email/components";

export default function ExcelImportDenied() {
  return (
    <Html>
      <Preview>
        Az Excel import nem engedélyezett erről a feladói címről.
      </Preview>
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

              <Text className="text-base font-semibold leading-6 text-white">
                Az Excel import nem érhető el erről a feladói címről.
              </Text>
              <Text className="text-sm leading-5 text-slate-400">
                Ha úgy gondolod, hogy ez tévedés, kérjük vedd fel a kapcsolatot
                az ügyfélszolgálattal:{" "}
                <a
                  href="mailto:support@bphs.hu"
                  style={{ color: "#94a3b8", textDecoration: "underline" }}
                >
                  support@bphs.hu
                </a>
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
