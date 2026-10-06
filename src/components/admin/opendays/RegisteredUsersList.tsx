"use client";

import {
  Calendar,
  Download,
  Filter,
  GraduationCap,
  Mail,
  Search,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  formatDateTime,
  formatTimeRange,
} from "@/components/opendays/formatters";
import type { OpenDayClass } from "@/components/opendays/types";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/trpc/react";

interface RegisteredUsersListProps {
  openDay: {
    id: string;
    date: Date;
    classes: OpenDayClass[];
  };
}

export default function RegisteredUsersList({
  openDay,
}: RegisteredUsersListProps) {
  const utils = api.useUtils();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const query = api.opendays.getAdminRegistrations.useQuery({
    openDayId: openDay.id,
  });

  const deleteMutation = api.opendays.deleteRegistration.useMutation({
    onSuccess: async () => {
      await utils.opendays.getAdminRegistrations.invalidate({
        openDayId: openDay.id,
      });
      await utils.opendays.getAdminOpenDays.invalidate();
      await utils.opendays.getOpenDays.invalidate();
      setDeleteConfirm(null);
    },
  });

  const sortedClasses = useMemo(() => {
    return [...openDay.classes].sort((a, b) => {
      const startDiff =
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      if (startDiff !== 0) return startDiff;
      const endDiff =
        new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
      if (endDiff !== 0) return endDiff;
      return a.title.localeCompare(b.title);
    });
  }, [openDay.classes]);

  const classMap = useMemo(() => {
    return new Map(sortedClasses.map((cls) => [cls.id, cls]));
  }, [sortedClasses]);

  const getSortedSelectedClassIds = (selectedClassIds: string[] = []) => {
    return [...selectedClassIds].sort((aId, bId) => {
      const clsA = classMap.get(aId);
      const clsB = classMap.get(bId);
      if (!clsA && !clsB) return aId.localeCompare(bId);
      if (!clsA) return 1;
      if (!clsB) return -1;
      const startDiff =
        new Date(clsA.startTime).getTime() - new Date(clsB.startTime).getTime();
      if (startDiff !== 0) return startDiff;
      const endDiff =
        new Date(clsA.endTime).getTime() - new Date(clsB.endTime).getTime();
      if (endDiff !== 0) return endDiff;
      return clsA.title.localeCompare(clsB.title);
    });
  };

  const rawRegistrations = query.data ?? [];

  const filteredRegistrations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return rawRegistrations.filter((reg) => {
      const matchesSearch =
        !q ||
        reg.attendeeName.toLowerCase().includes(q) ||
        reg.attendeeEmail.toLowerCase().includes(q) ||
        reg.contactName.toLowerCase().includes(q) ||
        reg.contactEmail.toLowerCase().includes(q);

      const matchesClass =
        selectedClassFilter === "all" ||
        reg.selectedClassIds.includes(selectedClassFilter);

      return matchesSearch && matchesClass;
    });
  }, [rawRegistrations, searchQuery, selectedClassFilter]);

  const handleExportExcel = () => {
    if (rawRegistrations.length === 0) return;

    const rows = rawRegistrations.map((reg) => {
      const classNames = getSortedSelectedClassIds(reg.selectedClassIds || [])
        .map((id) => {
          const cls = classMap.get(id);
          return cls
            ? `${cls.title} (${formatTimeRange(cls.startTime, cls.endTime)})`
            : id;
        })
        .join("; ");

      return {
        "Regisztráció ideje": reg.createdAt
          ? formatDateTime(new Date(reg.createdAt))
          : "",
        "Diák neve": reg.attendeeName,
        "Diák emailje": reg.attendeeEmail,
        "Kapcsolattartó neve": reg.contactName,
        "Kapcsolattartó emailje": reg.contactEmail,
        "Kiválasztott órák": classNames,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Jelentkezők");

    const dateStr = new Date(openDay.date).toISOString().split("T")[0];
    XLSX.writeFile(workbook, `nyilt_nap_jelentkezok_${dateStr}.xlsx`);
  };

  return (
    <>
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800">
          <div>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              <span>Jelentkezők</span>
            </CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleExportExcel}
              disabled={rawRegistrations.length === 0}
              className="bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Excel exportálás
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-4">
          {query.isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <SmallLoading />
            </div>
          ) : query.isError ? (
            <div className="rounded-xl border border-red-800 bg-red-950/40 p-4 text-center text-red-300">
              <p className="font-semibold text-sm">
                Nem sikerült betölteni a jelentkezéseket.
              </p>
              <p className="text-xs mt-1">{query.error.message}</p>
            </div>
          ) : rawRegistrations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-10 text-center text-gray-400">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-gray-400 mb-3">
                <Users className="h-6 w-6" />
              </div>
              <h4 className="text-base font-semibold text-white">
                Még nincs egyetlen jelentkező sem erre a napra.
              </h4>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filter and search bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Keresés diák vagy szülő neve, emailje alapján..."
                    className="pl-9 bg-slate-800/80 border-slate-700 text-white text-xs placeholder:text-gray-500 h-9"
                  />
                </div>

                {sortedClasses.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400 shrink-0 hidden sm:block" />
                    <select
                      value={selectedClassFilter}
                      onChange={(e) => setSelectedClassFilter(e.target.value)}
                      className="h-9 rounded-md border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">Minden óra</option>
                      {sortedClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.title} (
                          {formatTimeRange(cls.startTime, cls.endTime)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {filteredRegistrations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-sm text-gray-400">
                  Nincs a keresési feltételeknek megfelelő jelentkező.
                </div>
              ) : (
                <div className="rounded-xl border border-slate-800 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-800/60">
                      <TableRow className="border-slate-800 hover:bg-transparent">
                        <TableHead className="text-gray-300 font-semibold text-xs py-3">
                          Diák
                        </TableHead>
                        <TableHead className="text-gray-300 font-semibold text-xs py-3">
                          Kapcsolattartó (Szülő)
                        </TableHead>
                        <TableHead className="text-gray-300 font-semibold text-xs py-3">
                          Választott órák
                        </TableHead>
                        <TableHead className="text-gray-300 font-semibold text-xs py-3 whitespace-nowrap">
                          Regisztráció ideje
                        </TableHead>
                        <TableHead className="text-gray-300 font-semibold text-xs py-3 text-right">
                          Műveletek
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRegistrations.map((reg) => (
                        <TableRow
                          key={reg.id}
                          className="border-slate-800 hover:bg-slate-800/40 transition-colors"
                        >
                          <TableCell className="py-3 align-top">
                            <div className="space-y-0.5">
                              <div className="font-semibold text-white text-sm flex items-center gap-1.5">
                                <GraduationCap className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                                <span>{reg.attendeeName}</span>
                              </div>
                              <div className="text-xs text-gray-400 flex items-center gap-1">
                                <Mail className="h-3 w-3 text-gray-500 shrink-0" />
                                <span>{reg.attendeeEmail}</span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-3 align-top">
                            <div className="space-y-0.5">
                              <div className="font-medium text-white text-sm flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                                <span>{reg.contactName}</span>
                              </div>
                              <div className="text-xs text-gray-400 flex items-center gap-1">
                                <Mail className="h-3 w-3 text-gray-500 shrink-0" />
                                <span>{reg.contactEmail}</span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-3 align-top">
                            <div className="flex flex-wrap gap-1.5 max-w-md">
                              {(reg.selectedClassIds || []).length === 0 ? (
                                <span className="text-xs text-gray-500 italic">
                                  Nincs kiválasztott óra
                                </span>
                              ) : (
                                getSortedSelectedClassIds(
                                  reg.selectedClassIds || [],
                                ).map((clsId) => {
                                  const cls = classMap.get(clsId);
                                  return (
                                    <Badge
                                      key={clsId}
                                      variant="secondary"
                                      className="bg-slate-800/90 text-gray-200 border border-slate-700/80 text-[11px] py-0.5 px-2"
                                    >
                                      {cls ? (
                                        <span>
                                          <span className="text-blue-400 font-mono mr-1">
                                            {formatTimeRange(
                                              cls.startTime,
                                              cls.endTime,
                                            )}
                                          </span>
                                          {cls.title}
                                        </span>
                                      ) : (
                                        <span>Óra ID: {clsId}</span>
                                      )}
                                    </Badge>
                                  );
                                })
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="py-3 align-top whitespace-nowrap text-xs text-gray-400">
                            {reg.createdAt ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-gray-500" />
                                {formatDateTime(new Date(reg.createdAt))}
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>

                          <TableCell className="py-3 align-top text-right">
                            <Button
                              size="sm"
                              type="button"
                              className="h-7 px-2.5 border border-red-600 bg-red-700 text-white hover:bg-red-600 hover:text-white text-xs cursor-pointer"
                              title="Jelentkezés törlése"
                              onClick={() =>
                                setDeleteConfirm({
                                  id: reg.id,
                                  name: reg.attendeeName,
                                })
                              }
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Registration Alert Dialog */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Jelentkezés törlése</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Biztosan törölni szeretnéd a(z) &quot;{deleteConfirm?.name}&quot;
              diákhoz tartozó jelentkezést? Ezzel a kiválasztott órákon
              felszabadul a lefoglalt férőhely.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-3">
            <AlertDialogCancel className="border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white">
              Mégse
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) {
                  deleteMutation.mutate({ id: deleteConfirm.id });
                }
              }}
              className="border-red-600 bg-red-700 text-white hover:bg-red-600 hover:text-white"
            >
              {deleteMutation.isPending ? "Törlés..." : "Törlés megerősítése"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
