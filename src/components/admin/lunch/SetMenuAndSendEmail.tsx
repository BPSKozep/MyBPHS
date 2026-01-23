"use client";

import { useState } from "react";
import { FaEnvelope } from "react-icons/fa6";
import SetMenuForm from "@/components/admin/lunch/SetMenuForm";
import IconSubmitButton from "@/components/IconSubmitButton";
import { env } from "@/env/client";
import { api } from "@/trpc/react";
import { getWeek, getWeekYear } from "@/utils/isoweek";
import sleep from "@/utils/sleep";

export default function SetMenuAndSendEmail() {
  const [menuOptions, setMenuOptions] = useState(
    Array(5)
      .fill(0)
      .map(() => {
        return {
          "a-menu": "",
          "b-menu": "",
        };
      }),
  );

  const createMenu = api.menu.create.useMutation();

  const sendEmail = api.email.sendLunchEmail.useMutation();

  const sendSlackWebhook = api.webhook.sendSlackWebhook.useMutation();

  return (
    <div className="flex flex-col items-center justify-center">
      <SetMenuForm onChange={setMenuOptions} />
      <h2 className="mt-5 mb-3 text-white">Mentés és email kiküldése:</h2>
      <div>
        <IconSubmitButton
          icon={<FaEnvelope />}
          onClick={async () => {
            try {
              await sleep(500);

              const date = new Date();
              date.setDate(date.getDate() + 7);

              await createMenu.mutateAsync({
                options: menuOptions,
                week: getWeek(date),
                year: getWeekYear(date),
              });

              await sendEmail.mutateAsync();

              await sendSlackWebhook.mutateAsync({
                title: "Új menü feltöltve, email kiküldve. 📩",
                body:
                  "**Címzettek**:\n" +
                  env.NEXT_PUBLIC_TO_EMAILS?.split(",")
                    .map((email) => email.trim())
                    .filter(Boolean)
                    .join("\n"),
              });

              return true;
            } catch (err) {
              await sendSlackWebhook.mutateAsync({
                title: "SetMenuAndSendEmail Hiba",
                body: String(err),
                error: true,
              });
              return false;
            }
          }}
        />
      </div>
      <span className="mt-3 font-bold text-white">Címzettek:</span>
      {process.env.NEXT_PUBLIC_TO_EMAILS?.split(",").map((email, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: no index
        <span className="text-white" key={index}>
          {email}
        </span>
      ))}
    </div>
  );
}
