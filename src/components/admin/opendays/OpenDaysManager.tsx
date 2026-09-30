"use client";

import { Calendar, Clock, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import {
  formatOpenDayDate,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/trpc/react";
import ClassDialog from "./ClassDialog";
import OpenDayDialog from "./OpenDayDialog";
import RegisteredUsersList from "./RegisteredUsersList";

interface AdminOpenDay {
  id: string;
  date: Date;
  isPublished: boolean;
  registrationCount?: number;
  classes: OpenDayClass[];
}

export default function OpenDaysManager() {
  const utils = api.useUtils();
  const query = api.opendays.getAdminOpenDays.useQuery();
  const openDays: AdminOpenDay[] = query.data ?? [];

  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  // Dialog states
  const [openDayDialogOpen, setOpenDayDialogOpen] = useState(false);
  const [editingOpenDay, setEditingOpenDay] = useState<{
    id: string;
    date: Date;
    isPublished: boolean;
  } | null>(null);

  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<OpenDayClass | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "openday" | "class";
    openDayId: string;
    classId?: string;
    title: string;
  } | null>(null);

  // Default to selecting the first day if none selected
  useEffect(() => {
    if (!selectedDayId && openDays.length > 0) {
      setSelectedDayId(openDays[0]?.id ?? null);
    } else if (
      selectedDayId &&
      openDays.length > 0 &&
      !openDays.some((d) => d.id === selectedDayId)
    ) {
      setSelectedDayId(openDays[0]?.id ?? null);
    }
  }, [openDays, selectedDayId]);

  const selectedDay = openDays.find((d) => d.id === selectedDayId) ?? null;

  // Mutations
  const createOpenDayMutation = api.opendays.createOpenDay.useMutation({
    onSuccess: async (data) => {
      await utils.opendays.getAdminOpenDays.invalidate();
      await utils.opendays.getOpenDays.invalidate();
      setSelectedDayId(data.id);
    },
  });

  const updateOpenDayMutation = api.opendays.updateOpenDay.useMutation({
    onSuccess: async () => {
      await utils.opendays.getAdminOpenDays.invalidate();
      await utils.opendays.getOpenDays.invalidate();
    },
  });

  const deleteOpenDayMutation = api.opendays.deleteOpenDay.useMutation({
    onSuccess: async () => {
      await utils.opendays.getAdminOpenDays.invalidate();
      await utils.opendays.getOpenDays.invalidate();
    },
  });

  const addClassMutation = api.opendays.addClass.useMutation({
    onSuccess: async () => {
      await utils.opendays.getAdminOpenDays.invalidate();
      await utils.opendays.getOpenDays.invalidate();
    },
  });

  const updateClassMutation = api.opendays.updateClass.useMutation({
    onSuccess: async () => {
      await utils.opendays.getAdminOpenDays.invalidate();
      await utils.opendays.getOpenDays.invalidate();
    },
  });

  const deleteClassMutation = api.opendays.deleteClass.useMutation({
    onSuccess: async () => {
      await utils.opendays.getAdminOpenDays.invalidate();
      await utils.opendays.getOpenDays.invalidate();
    },
  });

  const handleSaveOpenDay = async (data: {
    date: Date;
    isPublished: boolean;
  }) => {
    if (editingOpenDay) {
      await updateOpenDayMutation.mutateAsync({
        id: editingOpenDay.id,
        date: data.date,
        isPublished: data.isPublished,
      });
    } else {
      await createOpenDayMutation.mutateAsync({
        date: data.date,
        isPublished: data.isPublished,
      });
    }
  };

  const handleSaveClass = async (data: {
    title: string;
    startTime: Date;
    endTime: Date;
    capacity: number;
    description: string;
  }) => {
    if (!selectedDayId) return;

    if (editingClass) {
      await updateClassMutation.mutateAsync({
        openDayId: selectedDayId,
        classId: editingClass.id,
        ...data,
      });
    } else {
      await addClassMutation.mutateAsync({
        openDayId: selectedDayId,
        ...data,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === "openday") {
      await deleteOpenDayMutation.mutateAsync({ id: deleteConfirm.openDayId });
      if (selectedDayId === deleteConfirm.openDayId) {
        setSelectedDayId(null);
      }
    } else if (deleteConfirm.type === "class" && deleteConfirm.classId) {
      await deleteClassMutation.mutateAsync({
        openDayId: deleteConfirm.openDayId,
        classId: deleteConfirm.classId,
      });
    }

    setDeleteConfirm(null);
  };

  if (query.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <SmallLoading />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="rounded-xl border border-red-800 bg-red-950/40 p-6 text-center text-red-300">
        <p className="font-semibold">
          Hiba történt a nyílt napok betöltésekor.
        </p>
        <p className="text-sm mt-1">{query.error.message}</p>
        <Button
          onClick={() => query.refetch()}
          className="mt-4 bg-red-800 hover:bg-red-700 text-white"
        >
          Újrapróbálkozás
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Nyílt napok
          </h2>
        </div>
        <Button
          onClick={() => {
            setEditingOpenDay(null);
            setOpenDayDialogOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shrink-0 cursor-pointer"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Új nyílt nap
        </Button>
      </div>

      {openDays.length === 0 ? (
        <Card className="bg-slate-900/60 border-slate-800 text-center py-12">
          <CardContent className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-gray-400">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Még nincsenek meghirdetett nyílt napok
              </h3>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Days list */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Időpontok ({openDays.length})
            </h3>
            <div className="space-y-3">
              {openDays.map((day) => {
                const isSelected = day.id === selectedDayId;
                return (
                  <div
                    key={day.id}
                    className={`w-full rounded-xl border p-4 text-left transition-all duration-150 ${
                      isSelected
                        ? "border-blue-500 bg-slate-800/90 shadow-md ring-1 ring-blue-500"
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedDayId(day.id)}
                      className="w-full text-left cursor-pointer focus:outline-none"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Calendar
                            className={`h-4 w-4 ${
                              isSelected ? "text-blue-400" : "text-gray-400"
                            }`}
                          />
                          <span className="font-semibold text-white text-base">
                            {formatOpenDayDate(day.date)}
                          </span>
                        </div>
                        <Badge
                          variant={day.isPublished ? "default" : "secondary"}
                          className={
                            day.isPublished
                              ? "bg-emerald-600/30 text-emerald-300 border-emerald-500/40 text-xs shrink-0"
                              : "bg-slate-800 text-gray-400 border-slate-700 text-xs shrink-0"
                          }
                        >
                          {day.isPublished ? "Publikus" : "Vázlat"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mt-2 pl-6 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-blue-400" />
                          {day.registrationCount ?? 0} jelentkező
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-500" />
                          {day.classes.length} óra
                        </span>
                      </div>
                    </button>

                    <div className="mt-3 flex items-center justify-end border-t border-slate-800/80 pt-2.5">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          type="button"
                          className="h-7 px-2.5 border border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white text-xs cursor-pointer"
                          title="Szerkesztés"
                          onClick={() => {
                            setEditingOpenDay(day);
                            setOpenDayDialogOpen(true);
                          }}
                        >
                          <Pencil className="mr-1 h-3 w-3" />
                          Szerkesztés
                        </Button>
                        <Button
                          size="sm"
                          type="button"
                          className="h-7 px-2.5 border border-red-600 bg-red-700 text-white hover:bg-red-600 hover:text-white text-xs cursor-pointer"
                          title="Törlés"
                          onClick={() => {
                            setDeleteConfirm({
                              type: "openday",
                              openDayId: day.id,
                              title: formatOpenDayDate(day.date),
                            });
                          }}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Törlés
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column: Classes or Registered users for selected day */}
          <div className="lg:col-span-2">
            {selectedDay ? (
              <Tabs defaultValue="classes" className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <TabsList className="bg-slate-900 border border-slate-800">
                    <TabsTrigger
                      value="classes"
                      className="flex items-center gap-2"
                    >
                      <Clock className="h-4 w-4" />
                      <span>Órák</span>
                      <Badge
                        variant="secondary"
                        className="bg-slate-800 text-gray-300 text-xs py-0 px-1.5"
                      >
                        {selectedDay.classes.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="registrations"
                      className="flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      <span>Jelentkezők</span>
                      <Badge
                        variant="secondary"
                        className="bg-slate-800 text-gray-300 text-xs py-0 px-1.5"
                      >
                        {selectedDay.registrationCount ?? 0}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent
                  value="classes"
                  className="m-0 focus-visible:outline-none"
                >
                  <Card className="bg-slate-900/60 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-800">
                      <div>
                        <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                          <Clock className="h-5 w-5 text-blue-400" />
                          <span>Órák</span>
                        </CardTitle>
                      </div>
                      <Button
                        onClick={() => {
                          setEditingClass(null);
                          setClassDialogOpen(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm cursor-pointer"
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Új óra
                      </Button>
                    </CardHeader>

                    <CardContent className="pt-6">
                      {selectedDay.classes.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-sm text-gray-400">
                          <p>Erre a napra még nem rögzítettél órákat.</p>
                          <Button
                            onClick={() => {
                              setEditingClass(null);
                              setClassDialogOpen(true);
                            }}
                            className="mt-3 border border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white text-xs cursor-pointer"
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Óra hozzáadása most
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedDay.classes.map((cls) => (
                            <div
                              key={cls.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-800/40 p-4 transition-colors hover:border-slate-700 hover:bg-slate-800/60"
                            >
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="border-blue-500/40 bg-blue-500/10 text-blue-300 font-mono text-xs flex items-center gap-1"
                                  >
                                    <Clock className="h-3 w-3" />
                                    {formatTimeRange(
                                      cls.startTime,
                                      cls.endTime,
                                    )}
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="bg-slate-800 text-gray-300 text-xs flex items-center gap-1"
                                  >
                                    <Users className="h-3 w-3" />
                                    {cls.registeredCount ?? 0} / {cls.capacity}{" "}
                                    fő
                                  </Badge>
                                </div>
                                <h4 className="font-semibold text-white text-base">
                                  {cls.title}
                                </h4>
                                {cls.description && (
                                  <p className="text-xs text-gray-400 line-clamp-2">
                                    {cls.description}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setEditingClass(cls);
                                    setClassDialogOpen(true);
                                  }}
                                  className="border border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white text-xs cursor-pointer"
                                >
                                  <Pencil className="mr-1 h-3.5 w-3.5" />
                                  Szerkesztés
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    setDeleteConfirm({
                                      type: "class",
                                      openDayId: selectedDay.id,
                                      classId: cls.id,
                                      title: cls.title,
                                    })
                                  }
                                  className="border border-red-600 bg-red-700 text-white hover:bg-red-600 hover:text-white text-xs cursor-pointer"
                                >
                                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                                  Törlés
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent
                  value="registrations"
                  className="m-0 focus-visible:outline-none"
                >
                  <RegisteredUsersList openDay={selectedDay} />
                </TabsContent>
              </Tabs>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-gray-400">
                Válassz ki egy nyílt napot a bal oldali listából a hozzá tartozó
                órák vagy jelentkezők megtekintéséhez.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Open Day Modal */}
      <OpenDayDialog
        open={openDayDialogOpen}
        onOpenChange={setOpenDayDialogOpen}
        initialData={editingOpenDay}
        onSave={handleSaveOpenDay}
      />

      {/* Class Modal */}
      {selectedDay && (
        <ClassDialog
          open={classDialogOpen}
          onOpenChange={setClassDialogOpen}
          baseDate={selectedDay.date}
          initialData={editingClass}
          onSave={handleSaveClass}
        />
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Biztosan törölni szeretnéd?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {deleteConfirm?.type === "openday"
                ? `A(z) "${deleteConfirm.title}" nyílt nap és az összes hozzá tartozó óra véglegesen törlődik.`
                : `A(z) "${deleteConfirm?.title}" óra törlődik erről a nyílt napról.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-3">
            <AlertDialogCancel className="border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white">
              Mégse
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="border-red-600 bg-red-700 text-white hover:bg-red-600 hover:text-white"
            >
              Törlés megerősítése
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
