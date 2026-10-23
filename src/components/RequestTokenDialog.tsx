"use client";

import { useEffect, useState } from "react";
import { FaCheck, FaIdCard } from "react-icons/fa6";
import Button from "@/components/Button";
import SmallLoading from "@/components/SmallLoading";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/trpc/react";

interface RequestTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RequestTokenDialog({
  open,
  onOpenChange,
}: RequestTokenDialogProps) {
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const utils = api.useUtils();
  const status = api.token.myRequestStatus.useQuery(undefined, {
    enabled: open,
  });
  const requestNew = api.token.requestNew.useMutation();

  useEffect(() => {
    if (open) {
      setError("");
      setDone(false);
    }
  }, [open]);

  const hasPending = done || status.data?.hasPending;

  const handleSubmit = async () => {
    try {
      setError("");
      await requestNew.mutateAsync();
      await utils.token.myRequestStatus.invalidate();
      setDone(true);
    } catch {
      setError("Hiba történt az igénylés elküldése során.");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-gray-700 bg-slate-800 text-white sm:max-w-md">
        <AlertDialogHeader className="flex flex-col items-center text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-purple-600/30 text-purple-300 ring-4 ring-purple-500/20">
            <FaIdCard className="h-7 w-7" />
          </div>
          <AlertDialogTitle className="text-xl font-bold text-white">
            Új token igénylése
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-gray-400">
            {hasPending
              ? "Az igénylésedet megkaptuk. Márk hamarosan felkeres a további információkkal."
              : `Ha elvesztetted a tokened, itt kérhetsz újat. Az új token ára ${status.data?.price ?? "..."} Ft.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && <p className="text-center text-sm text-red-400">{error}</p>}

        <div className="flex flex-col justify-center gap-2 pt-2 sm:flex-row">
          <Button
            onClick={() => onOpenChange(false)}
            className="cursor-pointer rounded-lg bg-gray-600 px-4 py-2 font-semibold text-white"
          >
            {hasPending ? "Bezárás" : "Mégsem"}
          </Button>
          {!hasPending && (
            <Button
              onClick={handleSubmit}
              disabled={requestNew.isPending || status.isLoading}
              className="cursor-pointer rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white"
            >
              {requestNew.isPending ? (
                <SmallLoading />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <FaCheck />
                  Új tokent kérek
                </span>
              )}
            </Button>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
