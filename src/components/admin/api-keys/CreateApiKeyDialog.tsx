"use client";

import { CheckIcon, CopyIcon, TriangleAlertIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { API_SCOPE_IDS, API_SCOPES, type ApiScope } from "@/lib/apiKeys/scopes";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

const EXPIRY_OPTIONS = [
  { label: "Soha", days: undefined },
  { label: "30 nap", days: 30 },
  { label: "90 nap", days: 90 },
  { label: "1 év", days: 365 },
] as const;

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateApiKeyDialog({
  open,
  onOpenChange,
}: CreateApiKeyDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scopes, setScopes] = useState<ApiScope[]>([]);
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const utils = api.useUtils();
  const createKey = api.apiKey.create.useMutation({
    onSuccess: async ({ key }) => {
      setCreatedKey(key);
      await utils.apiKey.list.invalidate();
    },
    onError: (err) => setError(err.message),
  });

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setScopes([]);
      setExpiresInDays(undefined);
      setError(null);
      setCreatedKey(null);
      setCopied(false);
    }
  }, [open]);

  const toggleScope = (scope: ApiScope, checked: boolean) => {
    setScopes((prev) =>
      checked ? [...prev, scope] : prev.filter((s) => s !== scope),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Kérjük, adj nevet a kulcsnak!");
      return;
    }
    if (scopes.length === 0) {
      setError("Válassz legalább egy jogosultságot!");
      return;
    }

    setError(null);
    createKey.mutate({
      name,
      description: description || undefined,
      scopes,
      expiresInDays,
    });
  };

  const handleCopy = async () => {
    if (!createdKey) return;
    try {
      await navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Nem sikerült a vágólapra másolni.");
    }
  };

  if (createdKey) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="sm:max-w-xl bg-slate-900 border-slate-700 text-white"
        >
          <DialogHeader>
            <DialogTitle>API kulcs létrehozva</DialogTitle>
            <DialogDescription className="text-gray-400">
              Másold ki a kulcsot és add meg a szolgáltatásnál.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-md border border-yellow-700 bg-yellow-950/50 p-3 text-sm text-yellow-200">
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
              <span>
                Ez a kulcs többé nem jelenik meg. Ha elveszik, vissza kell vonni
                és újat kell létrehozni.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded-md border border-slate-700 bg-slate-800 p-3 font-mono text-sm text-gray-100 select-all">
                {createdKey}
              </code>
              <Button
                type="button"
                onClick={handleCopy}
                className="border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white"
              >
                {copied ? (
                  <CheckIcon className="size-4" />
                ) : (
                  <CopyIcon className="size-4" />
                )}
              </Button>
            </div>

            {error && (
              <div className="rounded-md bg-red-950/60 border border-red-800 p-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="border-blue-600 bg-blue-700 text-white hover:bg-blue-600 hover:text-white"
            >
              Kimásoltam, bezárás
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-700 text-white">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Új API kulcs</DialogTitle>
            <DialogDescription className="text-gray-400">
              Külső szolgáltatások ezzel a kulccsal érhetik el a MyBPHS API-t.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-red-950/60 border border-red-800 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="api-key-name" className="text-gray-200">
                Név <span className="text-red-400">*</span>
              </Label>
              <Input
                id="api-key-name"
                required
                maxLength={100}
                placeholder="pl. Entra ID SCIM"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500 focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key-description" className="text-gray-200">
                Leírás
              </Label>
              <Input
                id="api-key-description"
                maxLength={500}
                placeholder="Hol és mire használjuk?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500 focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-200">
                Jogosultságok <span className="text-red-400">*</span>
              </Label>
              <div className="space-y-2">
                {API_SCOPE_IDS.map((scope) => (
                  <label
                    key={scope}
                    htmlFor={`api-key-scope-${scope}`}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-800 bg-slate-800/40 p-3 transition-colors hover:bg-slate-800/70"
                  >
                    <Checkbox
                      id={`api-key-scope-${scope}`}
                      checked={scopes.includes(scope)}
                      onCheckedChange={(checked) =>
                        toggleScope(scope, checked === true)
                      }
                      className="mt-0.5 border-slate-500 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                    />
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium text-gray-200">
                        {API_SCOPES[scope].label}{" "}
                        <span className="font-mono text-xs text-gray-500">
                          {scope}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {API_SCOPES[scope].description}
                      </p>
                      <p className="font-mono text-xs text-gray-500">
                        {API_SCOPES[scope].endpoints.join(", ")}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-200">Lejárat</Label>
              <div className="grid grid-cols-4 gap-2">
                {EXPIRY_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setExpiresInDays(option.days)}
                    className={cn(
                      "rounded-md border px-2 py-1.5 text-sm transition-colors",
                      expiresInDays === option.days
                        ? "border-blue-600 bg-blue-700 text-white"
                        : "border-slate-700 bg-slate-800 text-gray-300 hover:bg-slate-700",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
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
              disabled={createKey.isPending}
              className="border-blue-600 bg-blue-700 text-white hover:bg-blue-600 hover:text-white"
            >
              {createKey.isPending ? "Létrehozás..." : "Létrehozás"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
