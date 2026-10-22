export const API_SCOPES = {
  scim: {
    label: "SCIM provisioning",
    description: "Microsoft Entra ID felhasználó szinkronizáció",
    endpoints: ["/api/scim/v2/*"],
  },
  "laptop:login": {
    label: "Laptop bejelentkezés",
    description: "Laptop bejelentkezések rögzítése",
    endpoints: ["POST /api/laptop/login"],
  },
  ping: {
    label: "Ping",
    description: "Szolgáltatások állapotának ellenőrzése",
    endpoints: ["/api/laptop/ping", "/api/chat/ping"],
  },
  "kiosk:login": {
    label: "Kiosk bejelentkezés",
    description: "Kiosk eszközök automatikus bejelentkezése",
    endpoints: ["/auth/kiosk?token=…"],
  },
} as const;

export type ApiScope = keyof typeof API_SCOPES;

export const API_SCOPE_IDS = Object.keys(API_SCOPES) as [
  ApiScope,
  ...ApiScope[],
];
