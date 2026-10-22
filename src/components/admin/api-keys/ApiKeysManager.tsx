"use client";

import { BanIcon, KeyRoundIcon, PencilIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import CreateApiKeyDialog from "@/components/admin/api-keys/CreateApiKeyDialog";
import Card from "@/components/Card";
import Loading from "@/components/Loading";
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
import { API_SCOPES } from "@/lib/apiKeys/scopes";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";

type ApiKeyItem = RouterOutputs["apiKey"]["list"][number];

const formatDate = (date: Date) =>
  new Date(date).toLocaleString("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

function getStatus(key: ApiKeyItem) {
  if (key.revokedAt) {
    return {
      label: "Visszavont",
      className: "border-red-800 bg-red-950/60 text-red-300",
    };
  }
  if (key.expiresAt && new Date(key.expiresAt) <= new Date()) {
    return {
      label: "Lejárt",
      className: "border-yellow-800 bg-yellow-950/60 text-yellow-300",
    };
  }
  return {
    label: "Aktív",
    className: "border-green-800 bg-green-950/60 text-green-300",
  };
}

export default function ApiKeysManager() {
  const [showRevoked, setShowRevoked] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyItem | null>(null);
  const [editTarget, setEditTarget] = useState<ApiKeyItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const utils = api.useUtils();
  const { data: keys, isLoading, error } = api.apiKey.list.useQuery();

  const revokeKey = api.apiKey.revoke.useMutation({
    onSuccess: async () => {
      setRevokeTarget(null);
      await utils.apiKey.list.invalidate();
    },
    onError: (err) => setActionError(err.message),
  });

  const updateKey = api.apiKey.update.useMutation({
    onSuccess: async () => {
      setEditTarget(null);
      await utils.apiKey.list.invalidate();
    },
    onError: (err) => setActionError(err.message),
  });

  const visibleKeys = useMemo(
    () => (keys ?? []).filter((key) => showRevoked || !key.revokedAt),
    [keys, showRevoked],
  );

  const openEdit = (key: ApiKeyItem) => {
    setActionError(null);
    setEditName(key.name);
    setEditDescription(key.description ?? "");
    setEditTarget(key);
  };

  if (error) {
    return (
      <Card>
        <div className="rounded-lg border border-red-500/30 bg-red-900/20 p-4 text-center text-red-200">
          <h3 className="mb-2 text-lg font-bold">
            Hiba az API kulcsok betöltésekor
          </h3>
          <p className="text-sm">{error.message}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-600 pb-3">
          <div className="flex items-center gap-2">
            <KeyRoundIcon className="size-5 text-white" />
            <h2 className="text-lg font-semibold text-white">API kulcsok</h2>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRevoked(!showRevoked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none ${
                  showRevoked ? "bg-green-600" : "bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showRevoked ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="hidden sm:inline">Visszavontak mutatása</span>
            </div>
            <Button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="border-blue-600 bg-blue-700 text-white hover:bg-blue-600 hover:text-white"
            >
              <PlusIcon className="size-4" />
              Új kulcs
            </Button>
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loading />
            <p className="mt-4 text-sm text-gray-300">
              API kulcsok betöltése...
            </p>
          </div>
        ) : visibleKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <KeyRoundIcon className="size-12 text-gray-500" />
            <p className="mt-4 text-lg font-medium text-gray-300">
              Nincs API kulcs
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleKeys.map((key, index) => {
              const status = getStatus(key);
              return (
                <div
                  key={key.id}
                  className={cn(
                    "flex flex-col gap-3 rounded-lg border border-gray-600 p-3 transition-colors hover:bg-[#2a2a2a] sm:flex-row sm:items-center",
                    index % 2 === 0 ? "bg-[#242424]" : "bg-[#2e2e2e]",
                    key.revokedAt && "opacity-60",
                  )}
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-white">{key.name}</span>
                      <Badge className={status.className}>{status.label}</Badge>
                    </div>
                    {key.description && (
                      <p className="text-sm text-gray-400">{key.description}</p>
                    )}
                    <code className="block truncate font-mono text-xs text-gray-400">
                      {key.maskedKey}
                    </code>
                    <div className="flex flex-wrap gap-1">
                      {key.scopes.map((scope) => (
                        <Badge
                          key={scope}
                          title={API_SCOPES[scope].description}
                          className="border-gray-600 bg-[#3a3a3a] text-gray-200"
                        >
                          {API_SCOPES[scope].label}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                      <span>
                        Létrehozta: {key.createdBy}, {formatDate(key.createdAt)}
                      </span>
                      <span>
                        Utoljára használva:{" "}
                        {key.lastUsedAt
                          ? `${formatDate(key.lastUsedAt)}${key.lastUsedIp ? ` (${key.lastUsedIp})` : ""}`
                          : "soha"}
                      </span>
                      {key.expiresAt && (
                        <span>Lejár: {formatDate(key.expiresAt)}</span>
                      )}
                      {key.revokedAt && (
                        <span>
                          Visszavonta: {key.revokedBy},{" "}
                          {formatDate(key.revokedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {!key.revokedAt && (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => openEdit(key)}
                        className="border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white"
                      >
                        <PencilIcon className="size-4" />
                        <span className="sm:hidden lg:inline">Szerkesztés</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setActionError(null);
                          setRevokeTarget(key);
                        }}
                        className="border-red-700 bg-red-800 text-white hover:bg-red-700 hover:text-white"
                      >
                        <BanIcon className="size-4" />
                        <span className="sm:hidden lg:inline">Visszavonás</span>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateApiKeyDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Revoke confirmation */}
      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
      >
        <AlertDialogContent className="border-gray-600 bg-[#2e2e2e]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              API kulcs visszavonása
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Biztosan visszavonod a(z) <strong>{revokeTarget?.name}</strong>{" "}
              kulcsot? Az ezt használó szolgáltatások azonnal elveszítik a
              hozzáférést. Ez nem vonható vissza.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {actionError && (
            <div className="rounded-md bg-red-950/60 border border-red-800 p-3 text-sm text-red-300">
              {actionError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white">
              Mégse
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={revokeKey.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (revokeTarget) revokeKey.mutate({ id: revokeTarget.id });
              }}
              className="border-red-700 bg-red-800 text-white hover:bg-red-700"
            >
              {revokeKey.isPending ? "Visszavonás..." : "Visszavonás"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editTarget) return;
              updateKey.mutate({
                id: editTarget.id,
                name: editName,
                description: editDescription || undefined,
              });
            }}
          >
            <DialogHeader>
              <DialogTitle>API kulcs szerkesztése</DialogTitle>
              <DialogDescription className="text-gray-400">
                A jogosultságok nem módosíthatók. Ehhez hozz létre új kulcsot.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {actionError && (
                <div className="rounded-md bg-red-950/60 border border-red-800 p-3 text-sm text-red-300">
                  {actionError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="api-key-edit-name" className="text-gray-200">
                  Név <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="api-key-edit-name"
                  required
                  maxLength={100}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white focus-visible:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="api-key-edit-description"
                  className="text-gray-200"
                >
                  Leírás
                </Label>
                <Input
                  id="api-key-edit-description"
                  maxLength={500}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <DialogFooter className="gap-3 sm:gap-3">
              <Button
                type="button"
                onClick={() => setEditTarget(null)}
                className="border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white"
              >
                Mégse
              </Button>
              <Button
                type="submit"
                disabled={updateKey.isPending}
                className="border-blue-600 bg-blue-700 text-white hover:bg-blue-600 hover:text-white"
              >
                {updateKey.isPending ? "Mentés..." : "Mentés"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
