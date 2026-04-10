"use client";

import { Fragment, useEffect, useState } from "react";
import { FaPencil } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@/trpc/react";

const DAYS = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"];
const DAY_COUNT = DAYS.length;

type DayOptions = {
  soup: string;
  "a-menu": string;
  "b-menu": string;
};

function emptyDays(): DayOptions[] {
  return Array.from({ length: DAY_COUNT }, () => ({
    soup: "",
    "a-menu": "",
    "b-menu": "",
  }));
}

function optionsFromMenu(options: Record<string, string>[]): DayOptions[] {
  return Array.from({ length: DAY_COUNT }, (_, i) => {
    const day = options[i] ?? {};
    return {
      soup: day.soup ?? "",
      "a-menu": day["a-menu"] ?? "",
      "b-menu": day["b-menu"] ?? "",
    };
  });
}

function dayOptionsToRecord(day: DayOptions): Record<string, string> {
  const record: Record<string, string> = {
    "a-menu": day["a-menu"].trim(),
    "b-menu": day["b-menu"].trim(),
  };
  const soup = day.soup.trim();
  if (soup) record.soup = soup;
  return record;
}

type Props = {
  year: number;
  week: number;
};

export default function EditMenuDialog({ year, week }: Props) {
  const utils = api.useUtils();

  const [open, setOpen] = useState(false);

  const { data: menu, isLoading: menuLoading } = api.menu.get.useQuery(
    { year, week },
    { enabled: open },
  );

  const [days, setDays] = useState<DayOptions[]>(emptyDays);
  const [isOpenForOrders, setIsOpenForOrders] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (menu) {
      setDays(optionsFromMenu(menu.options));
      setIsOpenForOrders(menu.isOpenForOrders);
    }
  }, [menu]);

  const updateMenu = api.menu.update.useMutation();
  const setIsopen = api.menu.setIsopen.useMutation();

  const isPending = updateMenu.isPending || setIsopen.isPending;

  const handleOpen = () => {
    setSaveError(null);
    setOpen(true);
  };

  const handleSave = async () => {
    setSaveError(null);
    try {
      const originalIsOpen = menu?.isOpenForOrders ?? true;

      await updateMenu.mutateAsync({
        year,
        week,
        options: days.map(dayOptionsToRecord),
      });

      if (isOpenForOrders !== originalIsOpen) {
        await setIsopen.mutateAsync({ year, week, isOpen: isOpenForOrders });
      }

      await utils.menu.get.invalidate({ year, week });
      await utils.menu.getIsOpen.invalidate({ year, week });

      setOpen(false);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Ismeretlen hiba történt.",
      );
    }
  };

  const updateDay = <K extends keyof DayOptions>(
    dayIndex: number,
    field: K,
    value: string,
  ) => {
    setDays((prev) => {
      const next = [...prev];
      const current = next[dayIndex];
      if (!current) return prev;
      next[dayIndex] = { ...current, [field]: value };
      return next;
    });
  };

  return (
    <>
      <Button
        type="button"
        onClick={handleOpen}
        className="bg-blue-600 text-white hover:bg-blue-700"
      >
        <FaPencil className="mr-2 h-4 w-4" />
        Menü szerkesztése
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-5xl overflow-y-auto border-gray-600 bg-[#2e2e2e]">
          <DialogHeader>
            <DialogTitle className="text-white">Menü szerkesztése</DialogTitle>
            <DialogDescription className="text-gray-300">
              {year}. év {week}. hét
            </DialogDescription>
          </DialogHeader>

          {menuLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-600 border-t-blue-400" />
            </div>
          ) : (
            <div className="flex flex-col gap-4 pt-2">
              {DAYS.map((dayName, dayIndex) => (
                <Fragment key={dayName}>
                  <div className="rounded-lg bg-gray-800/60 p-4">
                    <h3 className="mb-3 text-base font-semibold text-white">
                      {dayName}
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="flex flex-col gap-1">
                        <Label
                          htmlFor={`soup-${dayIndex}`}
                          className="text-sm text-gray-300"
                        >
                          Leves
                        </Label>
                        <input
                          id={`soup-${dayIndex}`}
                          type="text"
                          value={days[dayIndex]?.soup ?? ""}
                          onChange={(e) =>
                            updateDay(dayIndex, "soup", e.target.value)
                          }
                          className="w-full rounded-md border-none bg-[#565656] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label
                          htmlFor={`a-menu-${dayIndex}`}
                          className="text-sm text-gray-300"
                        >
                          A Menü
                        </Label>
                        <textarea
                          id={`a-menu-${dayIndex}`}
                          value={days[dayIndex]?.["a-menu"] ?? ""}
                          onChange={(e) =>
                            updateDay(dayIndex, "a-menu", e.target.value)
                          }
                          rows={2}
                          className="w-full resize-none rounded-md border-none bg-[#565656] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label
                          htmlFor={`b-menu-${dayIndex}`}
                          className="text-sm text-gray-300"
                        >
                          B Menü
                        </Label>
                        <textarea
                          id={`b-menu-${dayIndex}`}
                          value={days[dayIndex]?.["b-menu"] ?? ""}
                          onChange={(e) =>
                            updateDay(dayIndex, "b-menu", e.target.value)
                          }
                          rows={2}
                          className="w-full resize-none rounded-md border-none bg-[#565656] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </Fragment>
              ))}

              <div className="flex items-center justify-between rounded-lg bg-gray-800/60 px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <Label
                    htmlFor="isOpenForOrders"
                    className="text-sm font-medium text-white"
                  >
                    Rendelés nyitva
                  </Label>
                </div>
                <Switch
                  id="isOpenForOrders"
                  checked={isOpenForOrders}
                  onCheckedChange={setIsOpenForOrders}
                  className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-600"
                />
              </div>

              {saveError && (
                <div className="rounded-lg bg-red-900/50 px-4 py-3 text-sm text-red-200">
                  <strong className="font-medium">Hiba: </strong>
                  {saveError}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white"
            >
              Mégse
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending || menuLoading}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isPending ? "Mentés..." : "Mentés"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
