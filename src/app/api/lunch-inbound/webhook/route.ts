import { NextResponse } from "next/server";
import { Resend } from "resend";
import * as XLSX from "xlsx";
import mongooseConnect from "@/clients/mongoose";
import ExcelImport from "@/emails/excelImport";
import ExcelImportDenied from "@/emails/excelImportDenied";
import Lunch from "@/emails/lunch";
import { env } from "@/env/server";
import { Menu } from "@/models";
import type { IMenu } from "@/models/Menu.model";
import { getWeek, getWeekYear } from "@/utils/isoweek";
import { parseExcelMenu } from "@/utils/parseExcelMenu";

const resend = new Resend(env.RESEND_API_KEY);

const EXCEL_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

const RESEND_INCOMING_SENDERS = (env.RESEND_INCOMING_SENDERS ?? "")
  .split(",")
  .map((email: string) => email.trim().toLowerCase())
  .filter(Boolean);

interface ResendAttachment {
  id: string;
  filename: string;
  content_type: string;
  content_disposition?: string;
  content_id?: string;
}

interface ResendEmailReceivedData {
  email_id: string;
  created_at: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  message_id?: string;
  attachments?: ResendAttachment[];
}

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: ResendEmailReceivedData;
}

function isExcelAttachment(attachment: ResendAttachment): boolean {
  const isExcelMime = EXCEL_MIME_TYPES.includes(attachment.content_type);
  const isExcelExt = /\.(xlsx|xls)$/i.test(attachment.filename);
  return isExcelMime || isExcelExt;
}

async function sendSlack(title: string, body: string, error = false) {
  if (!env.SLACK_WEBHOOK || env.DISABLE_WEBHOOKS === "true") return;

  const isDev = process.env.NODE_ENV !== "production";
  const date = new Date().toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZone: "Europe/Budapest",
  });

  await fetch(env.SLACK_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      attachments: [
        {
          title: (isDev ? "TESZT - " : "") + title,
          text: body,
          color: error ? "danger" : "warning",
          footer: date,
          footer_icon:
            "https://platform.slack-edge.com/img/default_application_icon.png",
        },
      ],
    }),
  });
}

async function replyToSender(
  to: string,
  menu?: Parameters<typeof ExcelImport>[0]["menu"],
  error?: string,
) {
  await resend.emails.send({
    from: "MyBPHS <my@bphs.hu>",
    to,
    subject: error
      ? "MyBPHS | Excel importálás sikertelen"
      : "MyBPHS | Excel importálás sikeres",
    cc: ["edit.braun@budapestschool.org", "jpp-tech@budapestschool.org"],
    react: ExcelImport({ menu, error }),
  });
}

export async function POST(req: Request) {
  if (!env.RESEND_WEBHOOK_SECRET) {
    return NextResponse.json(
      { ok: false, error: "Webhook secret is not configured" },
      { status: 500 },
    );
  }

  const payload = await req.text();
  const svixId = req.headers.get("svix-id") ?? "";
  const svixTimestamp = req.headers.get("svix-timestamp") ?? "";
  const svixSignature = req.headers.get("svix-signature") ?? "";

  try {
    const event = resend.webhooks.verify({
      payload,
      headers: {
        id: svixId,
        timestamp: svixTimestamp,
        signature: svixSignature,
      },
      webhookSecret: env.RESEND_WEBHOOK_SECRET,
    }) as ResendWebhookEvent;

    if (event.type === "email.received") {
      const sender = event.data.from;

      if (!RESEND_INCOMING_SENDERS.includes(sender)) {
        await resend.emails.send({
          from: "MyBPHS <my@bphs.hu>",
          to: [sender, "jpp-tech@budapestschool.org"],
          subject: "MyBPHS | Excel import nem engedélyezett",
          react: ExcelImportDenied({ sender }),
        });
        return NextResponse.json({ ok: true });
      }

      const hasExcel = (event.data.attachments ?? []).some(isExcelAttachment);

      if (!hasExcel) {
        return NextResponse.json({ ok: true });
      }

      const { data: listResponse } =
        await resend.emails.receiving.attachments.list({
          emailId: event.data.email_id,
        });

      let parsedMenu: ReturnType<typeof parseExcelMenu> = null;

      for (const meta of listResponse?.data ?? []) {
        const filename = meta.filename ?? "";
        if (!isExcelAttachment({ ...meta, filename })) continue;

        const response = await fetch(meta.download_url);
        if (!response.ok) continue;

        const buffer = Buffer.from(await response.arrayBuffer());
        const workbook = XLSX.read(buffer, { type: "buffer" });
        parsedMenu = parseExcelMenu(workbook);

        if (parsedMenu) break;
      }

      if (!parsedMenu) {
        await replyToSender(
          sender,
          undefined,
          "Nem sikerült feldolgozni az Excel fájlt. Ellenőrizd, hogy a fájl tartalmaz-e HÉTFŐ–PÉNTEK fejléceket és megfelelő menü adatokat.",
        );
        await sendSlack(
          "Excel import sikertelen ❌",
          `Feladó: ${sender}\nHiba: Nem sikerült feldolgozni a fájlt.`,
          true,
        );
        return NextResponse.json({ ok: true });
      }

      const menuOptions = parsedMenu.days.map((day) => ({
        soup: day.soup,
        "a-menu": day.aMenu ? `A | ${day.aMenu}` : "",
        "b-menu": day.bMenu ? `B | ${day.bMenu}` : "",
      }));

      await mongooseConnect();

      const nextWeekDate = new Date();
      nextWeekDate.setDate(nextWeekDate.getDate() + 7);
      const week = getWeek(nextWeekDate);
      const year = getWeekYear(nextWeekDate);

      const existingMenu = await Menu.exists({ week, year });

      if (existingMenu) {
        await replyToSender(
          sender,
          undefined,
          `A ${year}. év ${week}. hetére már létezik menü.`,
        );
        await sendSlack(
          "Excel import sikertelen ❌",
          `Feladó: ${sender}\nHiba: A ${year}/${week}. hétre már létezik menü.`,
          true,
        );
        return NextResponse.json({ ok: true });
      }

      await new Menu<IMenu>({
        week,
        year,
        options: menuOptions,
        isOpenForOrders: true,
      }).save();

      const recipients = (process.env.NEXT_PUBLIC_TO_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);

      await resend.emails.send({
        from: "MyBPHS Ebéd <ebed@bphs.hu>",
        to: recipients,
        subject: "Elérhető a jövő heti menü!",
        react: Lunch(),
      });

      await sendSlack(
        "Új menü feltöltve, email kiküldve. 📩",
        `Hét: ${year}/${week}\nCímzettek:\n${recipients.join("\n")}`,
      );

      await replyToSender(sender, parsedMenu);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: `Invalid webhook: ${error}` },
      { status: 400 },
    );
  }
}
