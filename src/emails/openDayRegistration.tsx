import {
  Body,
  Container,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "react-email";

export interface OpenDayEmailClass {
  id: string;
  title: string;
  startTime: Date | string;
  endTime: Date | string;
  description?: string;
}

export interface OpenDayRegistrationEmailProps {
  contactName?: string;
  contactEmail?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  openDayDate?: Date | string;
  classes?: OpenDayEmailClass[];
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("hu-HU", {
    timeZone: "Europe/Budapest",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString("hu-HU", {
    timeZone: "Europe/Budapest",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function OpenDayRegistrationEmail({
  contactName = "",
  attendeeName = "",
  openDayDate = new Date(),
  classes = [],
}: OpenDayRegistrationEmailProps) {
  const formattedDate = formatDate(openDayDate);

  return (
    <Html>
      <Preview>
        Sikeres regisztráció a Budapest School JPP Nyílt Napjára (
        {formattedDate})
      </Preview>
      <Tailwind>
        <Body className="bg-gray-900 font-sans">
          <Container className="my-12 max-w-150 rounded-xl bg-slate-800 p-8 shadow-xl border border-slate-700">
            <Section className="text-center">
              <Text className="my-0 text-center text-2xl font-black text-white">
                Budapest School JPP
              </Text>
            </Section>

            <Hr className="border-slate-700 my-6" />

            <Text className="text-2xl font-bold text-white mb-2">
              Sikeres regisztráció!
            </Text>

            <Text className="text-base text-gray-200 leading-relaxed">
              Kedves <strong className="text-white">{contactName}</strong> és{" "}
              <strong className="text-white">{attendeeName}</strong>!
            </Text>

            {/* Selected Classes */}
            <Section className="my-6">
              <Text className="text-base font-bold text-white mb-3">
                Kiválasztott óralátogatások:
              </Text>

              {classes.length === 0 ? (
                <Text className="text-sm text-gray-400 italic">
                  Nincsenek kiválasztott órák.
                </Text>
              ) : (
                classes.map((cls) => (
                  <Section
                    key={cls.id}
                    className="mb-3 rounded-lg bg-slate-900/70 p-4 border border-slate-700"
                  >
                    <Text className="text-xs font-semibold text-blue-400 my-0">
                      {formatTime(cls.startTime)} – {formatTime(cls.endTime)}
                    </Text>
                    <Text className="text-base font-bold text-white mt-1 mb-1">
                      {cls.title}
                    </Text>
                    {cls.description ? (
                      <Text className="text-xs text-gray-400 my-0 leading-relaxed">
                        {cls.description}
                      </Text>
                    ) : null}
                  </Section>
                ))
              )}
            </Section>

            <Text className="text-base leading-6 text-white">
              — A Budapest School JPP csapata
            </Text>

            <Hr className="border-slate-700 my-6" />

            <Text className="text-xs leading-4 text-slate-400 text-center">
              Budapest School Általános Iskola és Gimnázium
              <br />
              1081 Budapest, II. János Pál pápa tér 25.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
