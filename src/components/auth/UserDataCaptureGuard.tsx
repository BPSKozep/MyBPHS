"use client";

import { useSession } from "next-auth/react";
import type { PropsWithChildren } from "react";
import { useEffect, useRef, useState } from "react";
import { FaCheck, FaEye, FaEyeSlash, FaIdCard, FaLock } from "react-icons/fa";
import { InfoBox } from "@/components/InfoBox";
import Loading from "@/components/Loading";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";

type DialogStep = "nfc" | "password" | "loading" | "done";

export default function UserDataCaptureGuard({ children }: PropsWithChildren) {
  const { data: session, status } = useSession();
  const email = session?.user?.email;

  const { data: user, refetch } = api.user.get.useQuery(email ?? "", {
    enabled: !!email && status === "authenticated",
  });

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<DialogStep>("nfc");
  const [nfcId, setNfcId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  /** Defer real password input until after paint — avoids React 19 + password-manager DOM hitting permission errors on first focus. */
  const [passwordFieldReady, setPasswordFieldReady] = useState(false);
  const [error, setError] = useState("");
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const needNfc = Boolean(user && !user.nfcId);
  const needPassword = Boolean(user && !user.laptopPasswordChanged);
  const incomplete = Boolean(user && (needNfc || needPassword));
  const wasIncompleteRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    if (!incomplete) {
      setOpen(false);
      wasIncompleteRef.current = false;
      return;
    }

    setOpen(true);
    // Only set initial step when the dialog first becomes required (avoid resetting mid-flow)
    if (!wasIncompleteRef.current) {
      setStep(needNfc ? "nfc" : "password");
      wasIncompleteRef.current = true;
    }
  }, [user, incomplete, needNfc]);

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (step !== "password") {
      setPasswordFieldReady(false);
      return;
    }
    setPasswordFieldReady(false);
    const id = requestAnimationFrame(() => {
      setPasswordFieldReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, [step]);

  const setNfcIdMutation = api.user.setNfcId.useMutation();
  const setNewPasswordMutation = api.ad.setNewPassword.useMutation();

  const resetFormState = () => {
    setNfcId("");
    setPassword("");
    setShowPassword(false);
    setPasswordFieldReady(false);
    setError("");
  };

  const handleClose = () => {
    setOpen(false);
    setStep("nfc");
    resetFormState();
  };

  const handleNfcNext = () => {
    if (nfcId.length !== 8) {
      setError("Az NFC azonosító pontosan 8 karakter hosszú kell legyen.");
      return;
    }
    setError("");
    if (needPassword) {
      setStep("password");
    } else {
      void runSaveFlow();
    }
  };

  const handlePasswordNext = () => {
    if (password.length < 8) {
      setError("A jelszónak legalább 8 karakter hosszúnak kell lennie.");
      return;
    }
    setError("");
    void runSaveFlow();
  };

  const runSaveFlow = async () => {
    setStep("loading");
    setError("");

    try {
      if (needNfc) {
        await setNfcIdMutation.mutateAsync({ nfcId });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Ismeretlen hiba történt.";
      setError(message);
      setStep("nfc");
      return;
    }

    try {
      if (needPassword) {
        await setNewPasswordMutation.mutateAsync(password);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Ismeretlen hiba történt.";
      setError(message);
      setStep("password");
      return;
    }

    await refetch();
    loadingTimerRef.current = setTimeout(() => {
      setStep("done");
    }, 2000);
  };

  const handleNfcInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-F0-9]/g, "");
    if (value.length <= 8) {
      setNfcId(value);
      setError("");
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError("");
  };

  return (
    <>
      {children}
      <AlertDialog open={open} onOpenChange={() => {}}>
        <AlertDialogContent
          className="border-gray-600 bg-[#2e2e2e]"
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          {step === "nfc" && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-white">
                  <FaIdCard className="size-5" />
                  NFC azonosító megadása
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-300">
                  <strong>Üdvözlünk a MyBPHS rendszerben!</strong> <br /> A
                  használathoz meg kell adnod az NFC azonosítódat és a
                  választott jelszavadat.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-4 py-2">
                <div>
                  <label
                    htmlFor="user-capture-nfc"
                    className="mb-2 block text-left text-sm text-gray-400"
                  >
                    NFC Azonosító
                  </label>
                  <Input
                    id="user-capture-nfc"
                    type="text"
                    value={nfcId}
                    onChange={handleNfcInputChange}
                    placeholder="12345678"
                    maxLength={8}
                    className="bg-gray-700 text-center font-mono text-lg tracking-widest text-white placeholder-gray-500"
                    autoComplete="off"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleNfcNext();
                    }}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Az azonsítódat a tokenedre kötve találod. Ezt kérd a
                    rendszergazdától vagy a tanároktól.
                  </p>
                </div>

                {error && <InfoBox variant="error">{error}</InfoBox>}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleNfcNext}
                  disabled={nfcId.length !== 8}
                  className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600"
                >
                  {needPassword ? "Tovább" : "Mentés"}
                </Button>
              </div>
            </>
          )}

          {step === "password" && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-white">
                  <FaLock className="size-5" />
                  Iskolai jelszó megadása
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-300">
                  Válassz egy jelszót az iskolai fiókodhoz. Ezt a laptop
                  bejelentkezésnél kell használnod.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-4 py-2">
                <div>
                  <label
                    htmlFor="user-capture-password"
                    className="mb-2 block text-left text-sm text-gray-400"
                  >
                    Jelszó
                  </label>
                  <div className="relative isolate">
                    <Input
                      id="user-capture-password"
                      name="school-password-setup"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={handlePasswordChange}
                      placeholder="Legalább 8 karakter"
                      className="bg-gray-700 pr-12 text-white placeholder-gray-500"
                      readOnly={!passwordFieldReady}
                      onFocus={() => setPasswordFieldReady(true)}
                      autoComplete={passwordFieldReady ? "new-password" : "off"}
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-1p-ignore
                      data-bwignore
                      data-form-type="other"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handlePasswordNext();
                      }}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={
                        showPassword
                          ? "Jelszó elrejtése"
                          : "Jelszó megjelenítése"
                      }
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? (
                        <FaEyeSlash className="h-4 w-4" />
                      ) : (
                        <FaEye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && <InfoBox variant="error">{error}</InfoBox>}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {needNfc && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep("nfc");
                      setError("");
                    }}
                    className="border-gray-600 bg-[#565656] text-white hover:bg-[#454545]"
                  >
                    Vissza
                  </Button>
                )}
                <Button
                  onClick={handlePasswordNext}
                  disabled={password.length < 8}
                  className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600"
                >
                  Mentés
                </Button>
              </div>
            </>
          )}

          {step === "loading" && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="sr-only">
                  Adatok mentése
                </AlertDialogTitle>
                <AlertDialogDescription className="sr-only">
                  Kérjük, várj.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-6">
                  <Loading />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Adatok mentése...
                </h2>
                <p className="text-sm text-gray-300">
                  NFC és jelszó beállítása folyamatban.
                </p>
              </div>
            </>
          )}

          {step === "done" && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="sr-only">Kész</AlertDialogTitle>
                <AlertDialogDescription className="sr-only">
                  Sikeres mentés.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-600">
                  <FaCheck className="h-8 w-8 text-white" />
                </div>
                <h2 className="mb-2 text-lg font-semibold text-white">Kész!</h2>
                <p className="mb-6 text-sm text-gray-300">
                  Az adataid mentve lettek. Most már használhatod a rendszert.
                </p>
                <Button
                  onClick={handleClose}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  Bezárás
                </Button>
              </div>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
