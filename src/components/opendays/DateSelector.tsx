"use client";

import { Calendar, CheckCircle2, Clock, Users } from "lucide-react";
import { formatOpenDayDate, getOpenDayTimeRange } from "./formatters";
import type { OpenDayDate } from "./types";

interface DateSelectorProps {
  dates: OpenDayDate[];
  selectedDateId: string | null;
  onSelectDate: (dateId: string) => void;
}

export default function DateSelector({
  dates,
  selectedDateId,
  onSelectDate,
}: DateSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {dates.map((item) => {
          const isSelected = item.id === selectedDateId;
          const timeRange = getOpenDayTimeRange(item.classes);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectDate(item.id)}
              className={`relative flex flex-col justify-between rounded-xl border p-5 text-left transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "border-blue-500 bg-slate-800 ring-1 ring-blue-500"
                  : "border-slate-700 bg-slate-800/60 hover:border-slate-600 hover:bg-slate-800"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar
                      className={`h-5 w-5 ${
                        isSelected ? "text-blue-400" : "text-gray-400"
                      }`}
                    />
                    <span className="font-bold text-white text-base sm:text-lg">
                      {formatOpenDayDate(item.date)}
                    </span>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-blue-400 shrink-0" />
                  )}
                </div>

                {timeRange && (
                  <div className="mt-2 text-sm">
                    <p className="flex items-center gap-1.5 text-gray-300">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      {timeRange}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-700/60 pt-3">
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Users className="h-3.5 w-3.5" />
                  {item.classes.length} választható óra
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
