"use client";

import { UserPlusIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import rolesJson from "@/data/roles.json";
import { api } from "@/trpc/react";

interface AddUserDialogProps {
  onSuccess: () => void;
  onError: (title: string, description: string) => void;
}

interface NewUser {
  name: string;
  email: string;
  nfcId: string;
  roles: string[];
  blocked: boolean;
  sendWelcomeEmail: boolean;
}

const initialUserState: NewUser = {
  name: "",
  email: "",
  nfcId: "",
  roles: [],
  blocked: false,
  sendWelcomeEmail: true,
};

export default function AddUserDialog({
  onSuccess,
  onError,
}: AddUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>(initialUserState);

  const createUserMutation = api.user.create.useMutation({
    onSuccess: () => {
      setNewUser(initialUserState);
      setOpen(false);
      onSuccess();
    },
    onError: (error) => {
      onError(
        "Létrehozási hiba",
        `Hiba történt a felhasználó létrehozásakor: ${error.message}`,
      );
    },
  });

  const handleCreateUser = () => {
    if (
      !newUser.name ||
      !newUser.email ||
      !newUser.nfcId ||
      newUser.roles.length === 0
    ) {
      onError(
        "Hiányzó adatok",
        "Kérlek tölts ki minden kötelező mezőt és válassz legalább egy szerepet.",
      );
      return;
    }

    createUserMutation.mutate(newUser);
  };

  const toggleNewUserRole = (role: string) => {
    setNewUser((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const updateField = <K extends keyof NewUser>(
    field: K,
    value: NewUser[K],
  ) => {
    setNewUser((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const roles: Record<string, string> = rolesJson;
  const roleKeys = Object.keys(roles);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
        >
          <UserPlusIcon className="size-4" />
          <span className="hidden sm:inline">Új felhasználó</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md border-gray-600 bg-[#2e2e2e]">
        <DialogHeader>
          <DialogTitle className="text-white">
            Új felhasználó hozzáadása
          </DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">
              Név*
            </Label>
            <Input
              id="name"
              value={newUser.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="border-gray-600 bg-[#565656] text-white placeholder:text-gray-300"
              placeholder="Teljes név"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">
              Email*
            </Label>
            <Input
              id="email"
              type="email"
              value={newUser.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="border-gray-600 bg-[#565656] text-white placeholder:text-gray-300"
              placeholder="pelda@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nfcId" className="text-white">
              NFC ID*
            </Label>
            <Input
              id="nfcId"
              value={newUser.nfcId}
              maxLength={8}
              onChange={(e) => updateField("nfcId", e.target.value)}
              className="border-gray-600 bg-[#565656] font-mono text-white placeholder:text-gray-300"
              placeholder="12345678"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white">Szerepek*</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white"
                >
                  {newUser.roles.length === 0
                    ? "Válassz szerepeket"
                    : newUser.roles
                        .map((role) => roles[role] ?? role)
                        .join(", ")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-gray-600 bg-[#242424]">
                {roleKeys.map((role) => (
                  <DropdownMenuCheckboxItem
                    key={role}
                    checked={newUser.roles.includes(role)}
                    onCheckedChange={() => toggleNewUserRole(role)}
                    className="font-medium text-white hover:bg-[#2e2e2e] hover:text-white focus:bg-[#2e2e2e] focus:text-white"
                  >
                    {roles[role] ?? role}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="blocked"
              checked={newUser.blocked}
              onCheckedChange={(checked) => updateField("blocked", checked)}
              className="data-[state=checked]:bg-red-600"
            />
            <Label htmlFor="blocked" className="text-white">
              Blokkolva
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="sendWelcomeEmail"
              checked={newUser.sendWelcomeEmail}
              onCheckedChange={(checked) =>
                updateField("sendWelcomeEmail", checked)
              }
              className="data-[state=checked]:bg-blue-600"
            />
            <Label htmlFor="sendWelcomeEmail" className="text-white">
              Üdvözlő email küldése
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white"
          >
            Mégse
          </Button>
          <Button
            onClick={handleCreateUser}
            disabled={createUserMutation.isPending}
            className="border-blue-600 bg-blue-700 text-white hover:bg-blue-600 hover:text-white"
          >
            {createUserMutation.isPending ? "Létrehozás..." : "Létrehozás"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
