"use client";

import { FaCalendarXmark } from "react-icons/fa6";
import IconSubmitButton from "@/components/IconSubmitButton";
import { api } from "@/trpc/react";
import { getWeek, getWeekYear } from "@/utils/isoweek";
import sleep from "@/utils/sleep";

export default function CloseMenuOrders() {
  const setIsOpen = api.menu.setIsopen.useMutation();

  const date = new Date();
  date.setDate(date.getDate() + 7);

  const week = getWeek(date);
  const year = getWeekYear(date);

  const sendDiscordWebhook = api.webhook.sendDiscordWebhook.useMutation();
  const orderDocCount = api.order.getOrderDocumentCount.useQuery({
    year,
    week,
  });

  return (
    <>
      <h2 className="mt-5 mb-3 font-bold text-white">Beküldések lezárása</h2>
      <div>
        <IconSubmitButton
          icon={<FaCalendarXmark />}
          onClick={async () => {
            try {
              await sleep(500);

              await setIsOpen.mutateAsync({
                week,
                year,
                isOpen: false,
              });

              const totalOrders = orderDocCount.data ?? 0;

              await sendDiscordWebhook.mutateAsync({
                title: `Beküldések lezárva a(z) ${week}. hétre ❌`,
                body: `Összes leadott rendelés: ${String(totalOrders)}`,
              });

              return true;
            } catch (err) {
              await sendDiscordWebhook.mutateAsync({
                title: "CloseMenuOrders Hiba",
                body: String(err),
                error: true,
              });
              return false;
            }
          }}
        />
      </div>
    </>
  );
}
