"use client";

import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDownIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { FaEnvelope } from "react-icons/fa6";
import Card from "@/components/Card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import UserInput from "@/components/ui/UserInput";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

// Text content presets
const TEXT_PRESETS = {
  // Group templates
  general_group: {
    name: "Általános",
    type: "group" as const,
  },
  important_group: {
    name: "Fontos",
    type: "group" as const,
  },
  update: {
    name: "Frissítés",
    type: "group" as const,
  },
  // User templates
  general_user: {
    name: "Általános",
    type: "user" as const,
  },
  important_user: {
    name: "Fontos",
    type: "user" as const,
  },
};

const GROUP_EMAILS = {
  "bphs-sysadmins@budapest.school": "Rendszergazdák",
  "jpp-students@budapestschool.org": "Mindenki",
  "jpp-students-only@budapestschool.org": "Diákok",
  "jpp-teachers@budapestschool.org": "Tanárok",
};

type PresetKey = keyof typeof TEXT_PRESETS;
type GroupEmail = keyof typeof GROUP_EMAILS;

export default function SendEmail() {
  const [preset, setPreset] = useState<PresetKey>("general_group");
  const [isGroupMode, setIsGroupMode] = useState(true);
  const [groupEmail, setGroupEmail] = useState<GroupEmail>(
    "bphs-sysadmins@budapest.school",
  );
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [selectedUserName, setSelectedUserName] = useState("");
  const [subject, setSubject] = useState("");
  const [buttonLink, setButtonLink] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Filter templates based on mode
  const filteredPresets = Object.entries(TEXT_PRESETS).filter(
    ([_, presetData]) => presetData.type === (isGroupMode ? "group" : "user"),
  );

  const sendEmail = api.email.sendAdminEmail.useMutation();
  const sendSlackWebhook = api.webhook.sendSlackWebhook.useMutation();

  const user = api.user.get.useQuery(selectedUserEmail, {
    enabled: !!selectedUserEmail,
  });

  // Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure the list extensions with inline styles for email compatibility
        bulletList: {
          HTMLAttributes: {
            style:
              "list-style-type: disc; margin-left: 24px; margin-top: 8px; margin-bottom: 8px;",
          },
        },
        orderedList: {
          HTMLAttributes: {
            style:
              "list-style-type: decimal; margin-left: 24px; margin-top: 8px; margin-bottom: 8px;",
          },
        },
        listItem: {
          HTMLAttributes: {
            style: "margin-bottom: 4px;",
          },
        },
        // Configure text formatting with inline styles for email compatibility
        bold: {
          HTMLAttributes: {
            style: "font-weight: bold;",
          },
        },
        italic: {
          HTMLAttributes: {
            style: "font-style: italic;",
          },
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          style: "color: #60a5fa; text-decoration: underline;",
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[200px] p-4 w-full",
      },
    },
    immediatelyRender: false,
  });

  // Update selected user name when user data loads
  useEffect(() => {
    if (user.data?.name) {
      setSelectedUserName(user.data.name);
    }
  }, [user.data?.name]);

  // Auto-adjust preset based on group/user mode
  useEffect(() => {
    const currentPresetType = TEXT_PRESETS[preset]?.type;
    const targetType = isGroupMode ? "group" : "user";

    if (currentPresetType !== targetType) {
      // Find equivalent template in the new mode
      const currentPresetName = TEXT_PRESETS[preset]?.name;
      const equivalentPreset = Object.entries(TEXT_PRESETS).find(
        ([_, presetData]) =>
          presetData.type === targetType &&
          presetData.name === currentPresetName,
      );

      if (equivalentPreset) {
        setPreset(equivalentPreset[0] as PresetKey);
      } else {
        // Default to first available template for the mode
        const firstAvailable = filteredPresets[0];
        if (firstAvailable) {
          setPreset(firstAvailable[0] as PresetKey);
        }
      }
    }
  }, [isGroupMode, preset, filteredPresets]);

  const handleSend = () => {
    // Show confirmation dialog instead of sending directly
    setShowConfirmDialog(true);
    return false; // Return false to indicate not to proceed with default behavior
  };

  const confirmAndSend = async () => {
    if (!editor) return false;

    try {
      const recipient = isGroupMode ? groupEmail : selectedUserEmail;
      const emailFormat = preset.startsWith("important")
        ? "important"
        : preset === "update"
          ? "update"
          : "general";

      // Get rich HTML content from editor for email content
      const emailHtml = editor.getHTML();

      await sendEmail.mutateAsync({
        emailFormat,
        emailTo: recipient,
        emailSubject: subject,
        emailHtml,
        buttonLink: preset === "update" ? buttonLink : undefined,
        buttonText: preset === "update" ? buttonText : undefined,
        user: !isGroupMode ? selectedUserName : undefined,
        isGroupEmail: isGroupMode,
      });

      // Close the dialog after successful send
      setShowConfirmDialog(false);
      return true;
    } catch (err) {
      await sendSlackWebhook.mutateAsync({
        title: "SendEmail Hiba",
        body: String(err),
        error: true,
      });
      // Don't close dialog on error so user can try again
      return false;
    }
  };

  // Toolbar functions
  const setLink = () => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", previousUrl ?? "");

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  // Toolbar button component
  const ToolbarButton = ({
    onClick,
    title,
    children,
  }: {
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="h-8 w-8 p-0 text-gray-300 transition-colors hover:bg-gray-600 hover:text-white"
      title={title}
    >
      {children}
    </Button>
  );

  const handleGroupModeChange = useCallback((newIsGroupMode: boolean) => {
    setIsGroupMode(newIsGroupMode);
  }, []);

  if (!editor) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            <p className="text-white">Szerkesztő betöltése...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-center">
          <h1 className="text-2xl font-bold text-white">Email Küldés</h1>
        </div>

        {/* Controls Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Group/User Toggle - First */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-white">Küldés típusa</p>
              <div className="flex rounded-lg border border-gray-600 bg-[#2e2e2e] p-1">
                <button
                  type="button"
                  className={cn(
                    "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all",
                    isGroupMode
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-300 hover:bg-gray-600 hover:text-white",
                  )}
                  onClick={() => handleGroupModeChange(true)}
                >
                  Csoport
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all",
                    !isGroupMode
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-300 hover:bg-gray-600 hover:text-white",
                  )}
                  onClick={() => handleGroupModeChange(false)}
                >
                  Egyéni
                </button>
              </div>
            </div>

            {/* Template Selection - Filtered */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-white">Email sablon</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white"
                  >
                    {TEXT_PRESETS[preset]?.name || "Válassz sablont"}
                    <ChevronDownIcon className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full min-w-[200px] border-gray-600 bg-[#242424]">
                  {filteredPresets.map(([key, presetData]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => setPreset(key as PresetKey)}
                      className="font-medium text-white hover:bg-[#2e2e2e] hover:text-white focus:bg-[#2e2e2e] focus:text-white"
                    >
                      {presetData.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Recipient Selection */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-white">Címzett</p>
              {isGroupMode ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white"
                    >
                      {GROUP_EMAILS[groupEmail]}
                      <ChevronDownIcon className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full min-w-[200px] border-gray-600 bg-[#242424]">
                    {Object.entries(GROUP_EMAILS).map(([email, label]) => (
                      <DropdownMenuItem
                        key={email}
                        onClick={() => setGroupEmail(email as GroupEmail)}
                        className="font-medium text-white hover:bg-[#2e2e2e] hover:text-white focus:bg-[#2e2e2e] focus:text-white"
                      >
                        {label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="w-full">
                  <UserInput
                    onSelect={(user) => {
                      setSelectedUserEmail(user.email);
                      setSelectedUserName(user.name);
                    }}
                  />
                </div>
              )}
              {/* Greeting Preview */}
              {(isGroupMode || selectedUserName.trim()) && (
                <div className="text-xs text-gray-400">
                  <span className="font-medium">Üdvözlés: </span>
                  {isGroupMode
                    ? groupEmail === "bphs-sysadmins@budapest.school"
                      ? "Kedves rendszergazdák!"
                      : groupEmail === "jpp-students@budapestschool.org"
                        ? "Kedves tanárok és diákok!"
                        : groupEmail === "jpp-students-only@budapestschool.org"
                          ? "Kedves diákok!"
                          : "Kedves tanárok!"
                    : `Kedves ${selectedUserName}!`}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Subject Field */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-white">Email tárgy</p>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Az email tárgya..."
                className="border-gray-600 bg-[#565656] text-white placeholder:text-gray-300 focus:border-gray-400"
              />
              {/* Subject Preview */}
              {subject.trim() && (
                <div className="text-xs text-gray-400">
                  <span className="font-medium">Tárgy: </span>
                  {preset.startsWith("important")
                    ? `FONTOS MyBPHS üzenet | ${subject}`
                    : `${subject}${
                        isGroupMode ? " | MyBPHS hírlevél" : " | MyBPHS üzenet"
                      }`}
                </div>
              )}
            </div>

            {/* Update Template Fields */}
            {preset === "update" && (
              <>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-white">Gomb URL</p>
                  <Input
                    type="url"
                    value={buttonLink}
                    onChange={(e) => setButtonLink(e.target.value)}
                    placeholder="https://my.bphs.hu/valami"
                    className="border-gray-600 bg-[#565656] text-white placeholder:text-gray-300 focus:border-gray-400"
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-white">Gomb szöveg</p>
                  <Input
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="Próbáld ki most!"
                    className="border-gray-600 bg-[#565656] text-white placeholder:text-gray-300 focus:border-gray-400"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Rich Text Editor Section */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-white">Email tartalom</p>

          {/* Editor Toolbar */}
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-gray-600 bg-[#2e2e2e] p-2">
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBold().run()}
              title="Félkövér"
            >
              <Bold size={16} />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              title="Dőlt"
            >
              <Italic size={16} />
            </ToolbarButton>

            <div className="mx-1 h-6 w-px bg-gray-600"></div>

            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              title="Felsorolás"
            >
              <List size={16} />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              title="Számozott lista"
            >
              <ListOrdered size={16} />
            </ToolbarButton>

            <div className="mx-1 h-6 w-px bg-gray-600"></div>

            <ToolbarButton onClick={setLink} title="Link">
              <LinkIcon size={16} />
            </ToolbarButton>

            <div className="mx-1 h-6 w-px bg-gray-600"></div>

            <ToolbarButton
              onClick={() => editor?.chain().focus().setTextAlign("left").run()}
              title="Balra zárt"
            >
              <AlignLeft size={16} />
            </ToolbarButton>

            <ToolbarButton
              onClick={() =>
                editor?.chain().focus().setTextAlign("center").run()
              }
              title="Középre zárt"
            >
              <AlignCenter size={16} />
            </ToolbarButton>

            <ToolbarButton
              onClick={() =>
                editor?.chain().focus().setTextAlign("right").run()
              }
              title="Jobbra zárt"
            >
              <AlignRight size={16} />
            </ToolbarButton>
          </div>

          {/* Editor Content */}
          <div className="rounded-lg border border-gray-600 bg-white text-black">
            <EditorContent
              editor={editor}
              className="min-h-[300px] rounded-lg focus-within:ring-2 focus-within:ring-blue-500"
            />
          </div>
        </div>

        {/* Send Button */}
        <div className="flex justify-center pt-6">
          <Button
            onClick={handleSend}
            disabled={sendEmail.isPending}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {sendEmail.isPending ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Küldés...
              </div>
            ) : (
              <>
                <FaEnvelope className="mr-2 h-4 w-4" />
                Email küldése
              </>
            )}
          </Button>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="border-gray-600 bg-[#242424] text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-white">
                Email küldés megerősítése
              </DialogTitle>
              <DialogDescription className="text-gray-300">
                Kérjük, ellenőrizd az alábbi adatokat a küldés előtt:
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Recipient Information */}
              <div className="space-y-2">
                <h4 className="font-semibold text-white">Címzett:</h4>
                <div className="rounded-lg bg-[#2e2e2e] p-3">
                  {isGroupMode ? (
                    <div>
                      <p className="font-medium">{GROUP_EMAILS[groupEmail]}</p>
                      <p className="text-sm text-gray-400">{groupEmail}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">
                        {selectedUserName || "Névtelen felhasználó"}
                      </p>
                      <p className="text-sm text-gray-400">
                        {selectedUserEmail}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Subject Information */}
              <div className="space-y-2">
                <h4 className="font-semibold text-white">Email tárgy:</h4>
                <div className="rounded-lg bg-[#2e2e2e] p-3">
                  <p>
                    {preset.startsWith("important")
                      ? `FONTOS MyBPHS üzenet | ${subject}`
                      : `${subject}${
                          isGroupMode
                            ? " | MyBPHS hírlevél"
                            : " | MyBPHS üzenet"
                        }`}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                className="border-gray-600 bg-[#2e2e2e] text-white hover:bg-[#404040] hover:text-white"
              >
                Mégse
              </Button>
              <Button
                onClick={confirmAndSend}
                disabled={sendEmail.isPending}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {sendEmail.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Küldés...
                  </div>
                ) : (
                  <>
                    <FaEnvelope className="mr-2 h-4 w-4" />
                    Email küldése
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
