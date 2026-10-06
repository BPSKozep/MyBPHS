"use client";

import { AlertTriangle, BookOpen, CalendarCheck2, Clock } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatTime, formatTimeRange } from "./formatters";
import type { OpenDayClass, OpenDayDate } from "./types";

interface ClassSelectorProps {
  selectedDate: OpenDayDate | null;
  selectedClassIds: string[];
  onToggleClass: (classId: string) => void;
  onClearClasses?: () => void;
}

export default function ClassSelector({
  selectedDate,
  selectedClassIds,
  onToggleClass,
  onClearClasses,
}: ClassSelectorProps) {
  const classes = selectedDate?.classes || [];

  // Group classes chronologically by start time
  const groupedClasses = useMemo(() => {
    const groupsMap = new Map<
      string,
      { timeStr: string; startMs: number; classes: OpenDayClass[] }
    >();

    for (const cls of classes) {
      const timeStr = formatTime(cls.startTime);
      const startMs = new Date(cls.startTime).getTime();
      const existing = groupsMap.get(timeStr);
      if (existing) {
        existing.classes.push(cls);
        if (startMs < existing.startMs) {
          existing.startMs = startMs;
        }
      } else {
        groupsMap.set(timeStr, {
          timeStr,
          startMs,
          classes: [cls],
        });
      }
    }

    return Array.from(groupsMap.values()).sort((a, b) => a.startMs - b.startMs);
  }, [classes]);

  // Selected class objects
  const selectedClasses = useMemo(
    () => classes.filter((c) => selectedClassIds.includes(c.id)),
    [classes, selectedClassIds],
  );

  if (!selectedDate) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-800/30 p-8 text-center">
        <CalendarCheck2 className="mb-3 h-10 w-10 text-slate-500" />
        <h4 className="font-semibold text-gray-300">
          Még nincs kiválasztva időpont
        </h4>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-800/30 p-8 text-center">
        <h4 className="font-semibold text-gray-300">
          Ezen a napon nincsenek órák.
        </h4>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedClassIds.length > 0 && (
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <Badge className="bg-emerald-600 font-semibold text-white">
            {selectedClassIds.length} kiválasztva
          </Badge>
          {onClearClasses && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearClasses}
              className="h-7 text-xs text-gray-400 hover:text-white cursor-pointer"
            >
              Kijelölés törlése
            </Button>
          )}
        </div>
      )}

      <div className="space-y-6">
        {groupedClasses.map((group, groupIdx) => (
          <div key={group.timeStr} className="space-y-3">
            {groupIdx > 0 && (
              <div className="border-t border-slate-700/60 pt-3" />
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {group.classes.map((cls: OpenDayClass) => {
                const isSelected = selectedClassIds.includes(cls.id);
                const isFull = !isSelected && cls.capacity <= 0;
                const clsStart = new Date(cls.startTime).getTime();
                const clsEnd = new Date(cls.endTime).getTime();

                const isTimeConflict =
                  !isSelected &&
                  selectedClasses.some((sel) => {
                    const selStart = new Date(sel.startTime).getTime();
                    const selEnd = new Date(sel.endTime).getTime();
                    return clsStart < selEnd && clsEnd > selStart;
                  });

                const isUnavailable = isTimeConflict || isFull;

                return (
                  <label
                    key={cls.id}
                    htmlFor={
                      isUnavailable ? undefined : `class-check-${cls.id}`
                    }
                    className={`group relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-150 select-none ${
                      isSelected
                        ? "border-blue-500 bg-slate-800 ring-1 ring-blue-500 cursor-pointer"
                        : isUnavailable
                          ? "border-slate-700 bg-slate-900/40 cursor-not-allowed"
                          : "border-slate-700 bg-slate-800/60 hover:border-slate-600 hover:bg-slate-800 cursor-pointer"
                    }`}
                  >
                    <div className={isUnavailable ? "opacity-60" : ""}>
                      {/* Header row with time and checkbox */}
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex items-center gap-1 rounded-md bg-slate-700/70 px-2 py-0.5 text-xs font-semibold text-blue-300">
                          <Clock className="h-3 w-3" />
                          {formatTimeRange(cls.startTime, cls.endTime)}
                        </span>

                        <div className="pt-0.5">
                          <Checkbox
                            id={`class-check-${cls.id}`}
                            checked={isSelected}
                            disabled={isUnavailable}
                            onCheckedChange={() => {
                              if (!isUnavailable) {
                                onToggleClass(cls.id);
                              }
                            }}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                        </div>
                      </div>

                      {/* Class Title */}
                      <h4 className="mt-2.5 font-bold text-white text-base leading-snug">
                        {cls.title}
                      </h4>

                      {/* Description */}
                      <p className="mt-2 text-xs leading-relaxed text-gray-400">
                        {cls.description}
                      </p>
                    </div>

                    {/* Bottom footer: capacity and collision notice */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-700/60 pt-2.5 text-xs">
                      {isTimeConflict ? (
                        <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                          <AlertTriangle className="h-3 w-3" />
                          Idősáv már foglalt
                        </span>
                      ) : isFull ? (
                        <span className="flex items-center gap-1 text-xs text-rose-400 font-medium">
                          <AlertTriangle className="h-3 w-3" />
                          Betelt
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400">
                          <BookOpen className="h-3 w-3" />
                          Szabad férőhely: {cls.capacity} fő
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
