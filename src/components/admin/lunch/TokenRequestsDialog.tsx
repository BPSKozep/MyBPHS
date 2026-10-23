"use client";

import { CheckIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import Loading from "@/components/Loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

const dateFormat = new Intl.DateTimeFormat("hu-HU", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Budapest",
});

export default function TokenRequestsDialog() {
  const [open, setOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const utils = api.useUtils();

  // Pending list is always loaded so the button can show a count badge.
  const pending = api.token.listRequests.useQuery({ includeCompleted: false });
  const all = api.token.listRequests.useQuery(
    { includeCompleted: true },
    { enabled: open && showCompleted },
  );
  const list = showCompleted ? all : pending;

  const onSuccess = () => utils.token.listRequests.invalidate();
  const setStatus = api.token.setRequestStatus.useMutation({ onSuccess });
  const remove = api.token.deleteRequest.useMutation({ onSuccess });
  const busy = setStatus.isPending || remove.isPending;

  const pendingCount = pending.data?.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={cn(
            "cursor-pointer border text-white",
            pendingCount > 0
              ? "border-yellow-500 bg-yellow-600 hover:bg-yellow-700"
              : "border-gray-600 bg-[#565656] hover:bg-[#454545]",
          )}
        >
          Token igénylések{pendingCount > 0 && ` (${pendingCount})`}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-gray-600 bg-[#2e2e2e] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-white">Token igénylések</DialogTitle>
          <DialogDescription>
            Az új tokent kérő felhasználók listája.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-lg bg-gray-800/60 px-4 py-3">
          <Label
            htmlFor="show-completed-requests"
            className="text-sm font-medium text-white"
          >
            Teljesítettek mutatása
          </Label>
          <Switch
            id="show-completed-requests"
            checked={showCompleted}
            onCheckedChange={setShowCompleted}
            className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-600"
          />
        </div>

        {list.isLoading ? (
          <div className="flex justify-center py-8">
            <Loading />
          </div>
        ) : list.isError ? (
          <p className="py-6 text-center text-red-400">
            Hiba történt az igénylések betöltésekor.
          </p>
        ) : !list.data || list.data.length === 0 ? (
          <p className="py-6 text-center text-gray-300">Nincs igénylés.</p>
        ) : (
          <ul className="space-y-2">
            {list.data.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-2 rounded-lg border border-gray-600 bg-[#242424] p-3 text-white sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-medium">
                    {r.userName}
                    {r.status === "COMPLETED" ? (
                      <Badge className="ml-2 bg-green-600 text-white">
                        Teljesítve
                      </Badge>
                    ) : (
                      <Badge className="ml-2 bg-yellow-600 text-white">
                        Függőben
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-300">{r.userEmail}</div>
                  <div className="text-xs text-gray-400">
                    {dateFormat.format(r.createdAt)} · {r.price} Ft
                  </div>
                </div>
                <div className="flex gap-2">
                  {r.status === "PENDING" ? (
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        setStatus.mutate({ id: r.id, status: "COMPLETED" })
                      }
                      className="cursor-pointer bg-green-600 text-white hover:bg-green-700"
                    >
                      <CheckIcon className="size-4" />
                      Teljesítve
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        setStatus.mutate({ id: r.id, status: "PENDING" })
                      }
                      className="cursor-pointer border-gray-500 bg-[#565656] text-white hover:bg-[#454545] hover:text-white"
                    >
                      <RotateCcwIcon className="size-4" />
                      Visszaállít
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busy}
                    onClick={() => remove.mutate({ id: r.id })}
                    className="cursor-pointer"
                  >
                    <Trash2Icon className="size-4" />
                    Törlés
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
