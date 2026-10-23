"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export type TokenReminderAnswer = "HAS_TOKEN" | "REQUEST_NEW";

interface TokenReminderDialogProps {
  open: boolean;
  price: number;
  disabled?: boolean;
  onAnswer: (answer: TokenReminderAnswer) => void;
}

export default function TokenReminderDialog({
  open,
  price,
  disabled,
  onAnswer,
}: TokenReminderDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="border-gray-600 bg-[#2e2e2e] text-white">
        <AlertDialogHeader className="text-center sm:text-center">
          <AlertDialogTitle className="text-white">
            Megvan még a tokened?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300">
            Úgy látjuk, nem használod gyakran a tokenedet az ebédlőben. A token
            használata kötelező. Ha elvesztetted, most kérhetsz újat.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          <Button
            disabled={disabled}
            onClick={() => onAnswer("HAS_TOKEN")}
            className="cursor-pointer border border-green-500/60 bg-green-500/15 text-green-300 hover:bg-green-500/25 hover:text-green-200"
          >
            Megvan a tokenem
          </Button>
          <Button
            disabled={disabled}
            variant="outline"
            onClick={() => onAnswer("REQUEST_NEW")}
            className="cursor-pointer border-sky-500/60 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 hover:text-sky-200"
          >
            Új tokent kérek ({price} Ft)
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
