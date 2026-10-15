"use client";

import type React from "react";
import { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaCheck,
  FaIdCard,
  FaTriangleExclamation,
} from "react-icons/fa6";
import Button from "@/components/Button";
import { InfoBox } from "@/components/InfoBox";
import SmallLoading from "@/components/SmallLoading";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";

interface SetNfcIdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SetNfcIdDialog({
  open,
  onOpenChange,
}: SetNfcIdDialogProps) {
  const [nfcId, setNfcId] = useState("");
  const [error, setError] = useState("");

  const utils = api.useUtils();
  const setNfcIdMutation = api.user.setNfcId.useMutation();

  useEffect(() => {
    if (open) {
      setNfcId("");
      setError("");
    }
  }, [open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-F0-9]/g, "");
    if (value.length <= 8) {
      setNfcId(value);
      setError("");
    }
  };

  const isValid = nfcId.length === 8;

  const handleSubmit = async () => {
    if (nfcId.length !== 8) {
      setError("Az NFC azonosító pontosan 8 karakter hosszú kell legyen.");
      return;
    }

    try {
      setError("");
      await setNfcIdMutation.mutateAsync({ nfcId });
      await utils.user.getNfcId.invalidate();
      await utils.user.get.invalidate();
      onOpenChange(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Hiba történt a token azonosító beállítása során.");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isValid && !setNfcIdMutation.isPending) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        onEscapeKeyDown={(e: KeyboardEvent) => e.preventDefault()}
        className="border-gray-700 bg-slate-800 text-white sm:max-w-md"
      >
        <AlertDialogHeader className="flex flex-col items-center text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-purple-600/30 text-purple-300 ring-4 ring-purple-500/20">
            <FaIdCard className="h-7 w-7" />
          </div>
          <AlertDialogTitle className="text-xl font-bold text-white">
            Token azonosító beállítása
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-gray-400">
            Kérjük, add meg a 8 karakteres token azonosítódat.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 pt-2">
          {/* Warning box */}
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-left text-amber-200">
            <div className="flex items-start gap-3">
              <FaTriangleExclamation className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div className="text-xs leading-relaxed sm:text-sm">
                <span className="block font-semibold text-amber-300">
                  Egyszeri megadás
                </span>
                A token azonosító megadására csak egyszer van lehetőség.
                Utólagos módosítást kizárólag a rendszergazda végezhet.
              </div>
            </div>
          </div>

          {/* Input field */}
          <div>
            <label
              htmlFor="setNfcIdInput"
              className="mb-2 block text-left text-sm text-gray-400"
            >
              NFC Azonosító
            </label>
            <Input
              id="setNfcIdInput"
              type="text"
              value={nfcId}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="12345678"
              maxLength={8}
              className="bg-gray-700 text-center font-mono text-lg tracking-widest text-white placeholder-gray-500"
              autoComplete="off"
              autoFocus
              disabled={setNfcIdMutation.isPending}
            />
            <p className="mt-2 text-left text-xs text-gray-500">
              8 karakter (számok és A-F betűk)
            </p>
          </div>

          {/* Error Message */}
          {error && <InfoBox variant="error">{error}</InfoBox>}

          {/* Action buttons */}
          <div className="flex w-full gap-3 pt-2">
            <Button
              onClick={() => onOpenChange(false)}
              disabled={setNfcIdMutation.isPending}
              className="flex flex-1 items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700"
            >
              <FaArrowLeft className="h-4 w-4" />
              Vissza
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || setNfcIdMutation.isPending}
              className="flex flex-1 items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
            >
              {setNfcIdMutation.isPending ? (
                <SmallLoading />
              ) : (
                <>
                  <span>Mentés</span>
                  <FaCheck className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
