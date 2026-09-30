"use client";

import { useEffect, useState } from "react";
import {
  combineDateAndTime,
  toTimeInputValue,
} from "@/components/opendays/formatters";
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

interface ClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baseDate: Date;
  initialData?: {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    capacity: number;
    description: string;
  } | null;
  onSave: (data: {
    title: string;
    startTime: Date;
    endTime: Date;
    capacity: number;
    description: string;
  }) => Promise<void>;
}

export default function ClassDialog({
  open,
  onOpenChange,
  baseDate,
  initialData,
  onSave,
}: ClassDialogProps) {
  const [title, setTitle] = useState("");
  const [startTimeStr, setStartTimeStr] = useState("09:00");
  const [endTimeStr, setEndTimeStr] = useState("09:45");
  const [capacity, setCapacity] = useState(15);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title);
        setStartTimeStr(toTimeInputValue(initialData.startTime));
        setEndTimeStr(toTimeInputValue(initialData.endTime));
        setCapacity(initialData.capacity);
        setDescription(initialData.description || "");
      } else {
        setTitle("");
        setStartTimeStr("09:00");
        setEndTimeStr("09:45");
        setCapacity(15);
        setDescription("");
      }
      setError(null);
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Az óra címének megadása kötelező!");
      return;
    }

    if (!startTimeStr || !endTimeStr) {
      setError("A kezdési és befejezési idő megadása kötelező!");
      return;
    }

    const startTime = combineDateAndTime(baseDate, startTimeStr);
    const endTime = combineDateAndTime(baseDate, endTimeStr);

    if (startTime >= endTime) {
      setError("A befejezési időnek a kezdési idő után kell lennie!");
      return;
    }

    if (!capacity || capacity < 1) {
      setError("A férőhelynek legalább 1-nek kell lennie!");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        title: title.trim(),
        startTime,
        endTime,
        capacity,
        description: description.trim(),
      });
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
      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-700 text-white">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {initialData ? "Óra szerkesztése" : "Új óra hozzáadása"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {initialData
                ? "Módosítsd az óra adatait és időpontját."
                : "Add meg az új óra adatait, időkeretét és maximális kapacitását."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-red-950/60 border border-red-800 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="class-title" className="text-gray-200">
                Óra címe / megnevezése <span className="text-red-400">*</span>
              </Label>
              <Input
                id="class-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white focus-visible:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class-starttime" className="text-gray-200">
                  Kezdés időpontja <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="class-starttime"
                  type="time"
                  required
                  value={startTimeStr}
                  onChange={(e) => setStartTimeStr(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="class-endtime" className="text-gray-200">
                  Befejezés időpontja <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="class-endtime"
                  type="time"
                  required
                  value={endTimeStr}
                  onChange={(e) => setEndTimeStr(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-capacity" className="text-gray-200">
                Férőhely (kapacitás) <span className="text-red-400">*</span>
              </Label>
              <Input
                id="class-capacity"
                type="number"
                min={1}
                required
                value={capacity}
                onChange={(e) =>
                  setCapacity(Number.parseInt(e.target.value, 10) || 1)
                }
                className="bg-slate-800 border-slate-700 text-white focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-description" className="text-gray-200">
                Rövid leírás
              </Label>
              <textarea
                id="class-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md bg-slate-800 border border-slate-700 p-2.5 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
