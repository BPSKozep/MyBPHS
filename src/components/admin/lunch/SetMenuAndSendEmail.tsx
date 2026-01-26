"use client";

import { useState } from "react";
import { FaEnvelope, FaPaperPlane } from "react-icons/fa6";
import SetMenuForm from "@/components/admin/lunch/SetMenuForm";
import IconSubmitButton from "@/components/IconSubmitButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [showResendConfirmDialog, setShowResendConfirmDialog] = useState(false);

  const createMenu = api.menu.create.useMutation();

  const sendEmail = api.email.sendLunchEmail.useMutation();

  const sendSlackWebhook = api.webhook.sendSlackWebhook.useMutation();

  const handleSaveAndSendEmail = async () => {
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
  };

  const handleForceSendEmail = async () => {
    try {
      setShowResendConfirmDialog(false);
      await sleep(500);

      await sendEmail.mutateAsync();

      await sendSlackWebhook.mutateAsync({
        title: "Email újraküldve (menü mentése nélkül) 📧",
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
        title: "ForceSendEmail Hiba",
        body: String(err),
        error: true,
      });
      return false;
    }
  };

  // Extract username from email (part before @)
  const getEmailUsername = (email: string) => {
    return email.trim().split("@")[0];
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <SetMenuForm onChange={setMenuOptions} />

      {/* Actions Section */}
      <div className="mt-6 flex flex-col gap-4">
        <h2 className="text-center text-lg font-bold text-white">Műveletek</h2>

        <div className="flex flex-wrap items-center justify-center gap-6">
          {/* Save Menu and Send Email */}
          <div className="flex flex-col items-center gap-2">
            <IconSubmitButton
              icon={<FaEnvelope />}
              onClick={handleSaveAndSendEmail}
            />
            <span className="text-center text-sm text-gray-300">
              Menü mentése
              <br />& Email küldés
            </span>
          </div>

          {/* Force Send Email */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setShowResendConfirmDialog(true)}
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl bg-[#565e85] p-3 text-white transition-colors hover:bg-[#3a445d]"
            >
              <FaPaperPlane />
            </button>
            <span className="text-center text-sm text-gray-300">
              Email újraküldés
              <br />
              (menü mentése nélkül)
            </span>
          </div>
        </div>

        {/* Recipients Section */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className="w-full text-center font-bold text-white">
            Címzettek:
          </span>
          {process.env.NEXT_PUBLIC_TO_EMAILS?.split(",").map((email, index) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: no index
              key={index}
              className="rounded-lg bg-slate-700 px-3 py-1 text-sm text-gray-200"
            >
              {getEmailUsername(email)}
            </span>
          ))}
        </div>
      </div>

      {/* Resend Email Confirmation Dialog */}
      <AlertDialog
        open={showResendConfirmDialog}
        onOpenChange={setShowResendConfirmDialog}
      >
        <AlertDialogContent className="border-gray-600 bg-[#2e2e2e]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Email újraküldés megerősítése
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Biztosan szeretnéd újraküldeni az emailt a menü mentése nélkül? Az
              email az alábbi címzetteknek lesz elküldve:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-wrap gap-2 px-6 pb-2">
            {process.env.NEXT_PUBLIC_TO_EMAILS?.split(",").map(
              (email, index) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: no index
                  key={index}
                  className="rounded-lg bg-slate-700 px-2 py-1 text-xs text-gray-200"
                >
                  {email.trim()}
                </span>
              ),
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white">
              Mégse
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceSendEmail}
              className="border-blue-600 bg-blue-700 text-white hover:bg-blue-600 hover:text-white"
            >
              <FaPaperPlane className="mr-2" />
              Email küldés
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
