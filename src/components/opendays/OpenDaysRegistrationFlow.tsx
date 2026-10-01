"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import SmallLoading from "@/components/SmallLoading";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";
import ClassSelector from "./ClassSelector";
import DateSelector from "./DateSelector";
import { isFutureOpenDay } from "./formatters";
import type { RegistrationFormData } from "./types";

export default function OpenDaysRegistrationFlow() {
  const [formData, setFormData] = useState<RegistrationFormData>({
    contactName: "",
    contactEmail: "",
    attendeeName: "",
    attendeeEmail: "",
    selectedDateId: "",
    selectedClassIds: [],
  });

  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch open days directly from MongoDB via tRPC public procedure
  const openDaysQuery = api.opendays.getOpenDays.useQuery();
  const openDays = (openDaysQuery.data || []).filter((d) =>
    isFutureOpenDay(d.date),
  );

  const registerMutation = api.opendays.register.useMutation({
    onSuccess: () => {
      setShowConfirmationDialog(false);
      setTurnstileToken(null);
      setFormData({
        contactName: "",
        contactEmail: "",
        attendeeName: "",
        attendeeEmail: "",
        selectedDateId: "",
        selectedClassIds: [],
      });
      openDaysQuery.refetch();
      setErrorMessage(null);
      setSuccessMessage(
        "A jelentkezés sikeresen beküldve! Elküldtük a megerősítő emailt a megadott címekre.",
      );
    },
    onError: (err) => {
      setErrorMessage(err.message || "Hiba történt a regisztráció során.");
    },
  });

  const isSubmitting = registerMutation.isPending;

  const selectedDate =
    openDays.find((d) => d.id === formData.selectedDateId) ?? null;

  const handleSelectDate = (dateId: string) => {
    setErrorMessage(null);
    setFormData((prev) => {
      // If switching date, reset selected classes
      if (prev.selectedDateId !== dateId) {
        return {
          ...prev,
          selectedDateId: dateId,
          selectedClassIds: [],
        };
      }
      return prev;
    });
  };

  const handleToggleClass = (classId: string) => {
    setErrorMessage(null);
    setFormData((prev) => {
      const exists = prev.selectedClassIds.includes(classId);
      const newClassIds = exists
        ? prev.selectedClassIds.filter((id) => id !== classId)
        : [...prev.selectedClassIds, classId];

      return {
        ...prev,
        selectedClassIds: newClassIds,
      };
    });
  };

  const handleClearClasses = () => {
    setFormData((prev) => ({
      ...prev,
      selectedClassIds: [],
    }));
  };

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    if (!formData.selectedDateId || !selectedDate) {
      setErrorMessage("Kérjük, válassz egy időpontot a nyílt naphoz!");
      return;
    }
    if (formData.selectedClassIds.length === 0) {
      setErrorMessage(
        "Kérjük, válassz legalább egy bemutató órát a jelentkezéshez!",
      );
      return;
    }
    setErrorMessage(null);
    setShowConfirmationDialog(true);
  };

  const handleFinalSubmit = () => {
    if (!turnstileToken) return;
    if (
      !formData.selectedDateId ||
      !selectedDate ||
      formData.selectedClassIds.length === 0
    ) {
      setErrorMessage(
        "A jelentkezéshez kötelező egy időpontot és legalább egy órát kiválasztani.",
      );
      return;
    }
    setSuccessMessage(null);
    setErrorMessage(null);
    registerMutation.mutate({
      openDayId: formData.selectedDateId,
      contactName: formData.contactName,
      contactEmail: formData.contactEmail,
      attendeeName: formData.attendeeName,
      attendeeEmail: formData.attendeeEmail,
      selectedClassIds: formData.selectedClassIds,
      turnstileToken,
    });
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-16">
      {/* 1. Welcome Card */}
      <Card>
        <h1 className="font-bold text-xl text-center">
          Budapest School JPP Nyílt Napok
          <br />
          <br />
          Órajelentkezés
        </h1>
      </Card>

      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
        {/* 2. Personal Information Form */}
        <Card>
          <CardHeader>
            <CardTitle>Adatok</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact Person Details */}
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-blue-400">
                Szülő / Kapcsolattartó
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactName" className="text-gray-200">
                    Név <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="contactName"
                    required
                    autoComplete="off"
                    data-bwignore="true"
                    data-1p-ignore="true"
                    data-lpignore="true"
                    value={formData.contactName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactName: e.target.value,
                      })
                    }
                    className="bg-slate-900/60 border-slate-700 text-white focus-visible:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="text-gray-200">
                    Email cím <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    required
                    autoComplete="off"
                    data-bwignore="true"
                    data-1p-ignore="true"
                    data-lpignore="true"
                    value={formData.contactEmail}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactEmail: e.target.value,
                      })
                    }
                    className="bg-slate-900/60 border-slate-700 text-white focus-visible:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Attendee Student Details */}
            <div className="border-t border-slate-700/60 pt-4">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-blue-400">
                Résztvevő diák
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="attendeeName" className="text-gray-200">
                    Résztvevő diák neve <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="attendeeName"
                    required
                    autoComplete="off"
                    data-bwignore="true"
                    data-1p-ignore="true"
                    data-lpignore="true"
                    value={formData.attendeeName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        attendeeName: e.target.value,
                      })
                    }
                    className="bg-slate-900/60 border-slate-700 text-white focus-visible:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attendeeEmail" className="text-gray-200">
                    Diák email címe <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="attendeeEmail"
                    type="email"
                    required
                    autoComplete="off"
                    data-bwignore="true"
                    data-1p-ignore="true"
                    data-lpignore="true"
                    value={formData.attendeeEmail}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        attendeeEmail: e.target.value,
                      })
                    }
                    className="bg-slate-900/60 border-slate-700 text-white focus-visible:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Date Selector */}
        <Card>
          <CardHeader>
            <CardTitle>
              Időpontok <span className="text-red-400">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {openDaysQuery.isLoading ? (
              <div className="flex items-center justify-center p-8">
                <SmallLoading />
              </div>
            ) : openDays.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-800/30 p-8 text-center text-sm text-gray-400">
                Jelenleg nincsenek meghirdetett nyílt napok.
              </div>
            ) : (
              <DateSelector
                dates={openDays}
                selectedDateId={formData.selectedDateId}
                onSelectDate={handleSelectDate}
              />
            )}
          </CardContent>
        </Card>

        {/* 4. Class Selector */}
        <Card>
          <CardHeader>
            <CardTitle>
              Óralátogatások <span className="text-red-400">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ClassSelector
              selectedDate={selectedDate}
              selectedClassIds={formData.selectedClassIds}
              onToggleClass={handleToggleClass}
              onClearClasses={handleClearClasses}
            />
          </CardContent>
        </Card>

        {/* 5. Submit Button and Feedback Messages */}
        <div className="flex flex-col items-end gap-3 pt-2">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || formData.selectedClassIds.length === 0}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 font-semibold px-8 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Beküldés..." : "Regisztráció beküldése"}
          </Button>

          {/* Green success banner */}
          {successMessage && (
            <div className="w-full flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-emerald-400">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
              <p className="text-sm sm:text-base font-semibold">
                {successMessage}
              </p>
            </div>
          )}

          {/* Error banner */}
          {errorMessage && (
            <div className="w-full rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-rose-400">
              <p className="text-sm font-semibold">{errorMessage}</p>
            </div>
          )}
        </div>
      </form>

      {/* Confirmation Alert Dialog */}
      <AlertDialog
        open={showConfirmationDialog}
        onOpenChange={(open) => {
          if (!isSubmitting) {
            setShowConfirmationDialog(open);
            if (!open) {
              setTurnstileToken(null);
            }
          }
        }}
      >
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Biztosan be szeretnéd küldeni a jelentkezést?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Kérjük, végezd el a biztonsági ellenőrzést a beküldés
              megerősítéséhez.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex justify-center py-2">
            <Turnstile
              siteKey={
                process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
                "1x00000000000000000000AA"
              }
              options={{
                theme: "dark",
              }}
              onSuccess={(token) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken(null)}
              onError={() => setTurnstileToken(null)}
            />
          </div>

          <AlertDialogFooter className="gap-3 sm:gap-3">
            <AlertDialogCancel
              disabled={isSubmitting}
              className="border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white cursor-pointer disabled:opacity-50"
            >
              Mégse
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting || !turnstileToken}
              onClick={(e) => {
                e.preventDefault();
                handleFinalSubmit();
              }}
              className="border-blue-600 bg-blue-700 text-white hover:bg-blue-600 hover:text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Beküldés..." : "Beküldés"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
