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
import type { ParsedWeekMenu } from "@/utils/parseExcelMenu";

const DAY_NAMES = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"];

const thStyle: React.CSSProperties = {
  backgroundColor: "#334155",
  color: "#94a3b8",
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  padding: "10px 14px",
  textAlign: "left",
  borderBottom: "1px solid #475569",
};

const tdStyle: React.CSSProperties = {
  color: "#f1f5f9",
  fontSize: "13px",
  padding: "10px 14px",
  borderBottom: "1px solid #334155",
  verticalAlign: "top",
};

const tdDayStyle: React.CSSProperties = {
  ...tdStyle,
  color: "#94a3b8",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

interface ExcelImportProps {
  menu?: ParsedWeekMenu;
  error?: string;
}

export default function ExcelImport({ menu, error }: ExcelImportProps) {
  const isError = !!error;

  return (
    <Html>
      <Preview>
        {isError
          ? "Az Excel importálás sikertelen volt."
          : "Az Excel fájl sikeresen importálva lett!"}
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

              {isError ? (
                <>
                  <Text className="text-base font-semibold leading-6 text-red-400">
                    Az Excel importálás sikertelen volt.
                  </Text>
                  <div
                    style={{
                      backgroundColor: "#450a0a",
                      border: "1px solid #991b1b",
                      borderRadius: "6px",
                      padding: "12px 16px",
                      marginBottom: "16px",
                    }}
                  >
                    <Text
                      style={{
                        color: "#fca5a5",
                        fontSize: "13px",
                        margin: 0,
                      }}
                    >
                      {error}
                    </Text>
                  </div>
                  <Text className="text-sm leading-5 text-slate-400">
                    Kérjük ellenőrizd a feltöltött Excel fájlt és próbáld meg
                    újra.
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-base leading-6 text-white">
                    Az Excel fájl sikeresen importálva lett!
                  </Text>

                  {menu && menu.days.length > 0 && (
                    <>
                      {menu.dateRange && (
                        <Text className="text-sm leading-5 text-slate-400">
                          Időszak: {menu.dateRange}
                        </Text>
                      )}
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          marginTop: "8px",
                          marginBottom: "24px",
                        }}
                      >
                        <thead>
                          <tr>
                            <th style={thStyle}>Nap</th>
                            <th style={thStyle}>Leves</th>
                            <th style={thStyle}>A Menü</th>
                            <th style={thStyle}>B Menü</th>
                          </tr>
                        </thead>
                        <tbody>
                          {menu.days.map((day, i) => (
                            <tr
                              key={DAY_NAMES[i]}
                              style={{
                                backgroundColor:
                                  i % 2 === 0 ? "#1e293b" : "#0f172a",
                              }}
                            >
                              <td style={tdDayStyle}>{DAY_NAMES[i]}</td>
                              <td style={tdStyle}>{day.soup}</td>
                              <td style={tdStyle}>{day.aMenu}</td>
                              <td style={tdStyle}>{day.bMenu}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </>
              )}

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
