"use client";

import { useEffect, useState } from "react";
import { toDateInputValue } from "@/components/opendays/formatters";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface OpenDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    id: string;
    date: Date;
    isPublished: boolean;
  } | null;
  onSave: (data: { date: Date; isPublished: boolean }) => Promise<void>;
}

export default function OpenDayDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
}: OpenDayDialogProps) {
  const [dateStr, setDateStr] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setDateStr(toDateInputValue(initialData.date));
        setIsPublished(initialData.isPublished);
      } else {
        setDateStr("");
        setIsPublished(true);
      }
      setError(null);
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateStr) {
      setError("Kérjük, válassz egy dátumot!");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(
        Date.UTC(year ?? 2026, (month ?? 1) - 1, day ?? 1, 0, 0, 0),
      );
      await onSave({ date, isPublished });
      onOpenChange(false);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Hiba történt a mentés során.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {initialData
                ? "Nyílt nap szerkesztése"
                : "Új nyílt nap hozzáadása"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {initialData
                ? "Módosítsd a nyílt nap dátumát vagy láthatóságát."
                : "Add meg az új nyílt nap dátumát és beállításait."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-red-950/60 border border-red-800 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="openday-date" className="text-gray-200">
                Dátum <span className="text-red-400">*</span>
              </Label>
              <Input
                id="openday-date"
                type="date"
                required
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white focus-visible:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/40 p-3">
              <div className="space-y-0.5">
                <Label
                  htmlFor="openday-published"
                  className="text-sm font-medium text-gray-200"
                >
                  Publikus a jelentkezési oldalon
                </Label>
                <p className="text-xs text-gray-400">
                  Ha be van kapcsolva, a látogatók láthatják és jelentkezhetnek.
                </p>
              </div>
              <Switch
                id="openday-published"
                checked={isPublished}
                onCheckedChange={setIsPublished}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-3">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white"
            >
              Mégse
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="border-blue-600 bg-blue-700 text-white hover:bg-blue-600 hover:text-white"
            >
              {isSubmitting ? "Mentés..." : "Mentés"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
