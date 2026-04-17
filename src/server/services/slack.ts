import { env } from "@/env/server";

interface SlackNotification {
  title: string;
  body: string;
  color?: "good" | "warning" | "danger";
}

export async function sendSlackNotification(
  notification: SlackNotification,
): Promise<void> {
  if (!env.SLACK_WEBHOOK || env.DISABLE_WEBHOOKS === "true") return;

  const isDev = process.env.NODE_ENV !== "production";
  const date = new Date().toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    timeZone: "Europe/Budapest",
  });

  try {
    await fetch(env.SLACK_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attachments: [
          {
            title: (isDev ? "TESZT - " : "") + notification.title,
            text: notification.body,
            color: notification.color ?? "warning",
            footer: date,
            footer_icon:
              "https://platform.slack-edge.com/img/default_application_icon.png",
          },
        ],
      }),
    });
  } catch (error) {
    console.warn(
      "[slack] Failed to send Slack notification (best-effort):",
      error,
    );
  }
}
