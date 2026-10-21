"use client";

import {
  CheckCircleIcon,
  LogOutIcon,
  PrinterIcon,
  ScanIcon,
  TrashIcon,
  XCircleIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import NFCInput from "@/components/admin/lunch/NFCInput";
import Card from "@/components/Card";
import SmallLoading from "@/components/SmallLoading";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

interface ScannedToken {
  id: string;
  timestamp: Date;
  isAssociated: boolean;
  userName?: string;
}

export default function TokenScanner() {
  const [nfcId, setNfcId] = useState<string>("");
  const [scannedTokens, setScannedTokens] = useState<ScannedToken[]>([]);
  const [showOffboardDialog, setShowOffboardDialog] = useState(false);

  // Query to check if token is associated with a user
  const {
    data: user,
    isFetched: isUserFetched,
    isLoading: isUserLoading,
  } = api.user.getUserByNfcId.useQuery(nfcId, {
    enabled: !!nfcId,
  });

  const offboardMutation = api.user.offboard.useMutation({
    onSuccess: () => {
      // Remove offboarded tokens from the scanned list
      setScannedTokens((prev) => prev.filter((t) => !t.isAssociated));
      setShowOffboardDialog(false);
    },
  });

  // Handle new scanned token
  useEffect(() => {
    if (nfcId && isUserFetched) {
      const isAssociated = !!user;

      // Check if token already scanned
      const alreadyScanned = scannedTokens.some((token) => token.id === nfcId);

      if (!alreadyScanned) {
        const newToken: ScannedToken = {
          id: nfcId,
          timestamp: new Date(),
          isAssociated,
          userName: user?.name,
        };

        setScannedTokens((prev) => [newToken, ...prev]);
      }

      // Clear nfcId after processing
      setTimeout(() => setNfcId(""), 1000);
    }
  }, [nfcId, user, isUserFetched, scannedTokens]);

  // Get unassociated tokens for printing
  const unassociatedTokens = scannedTokens.filter(
    (token) => !token.isAssociated,
  );

  // Get associated tokens for offboarding
  const associatedTokens = scannedTokens.filter((token) => token.isAssociated);

  // Clear all tokens
  const clearTokens = () => {
    setScannedTokens([]);
  };

  const handleOffboard = () => {
    offboardMutation.mutate(associatedTokens.map((t) => t.id));
  };

  // Detect if user is on mobile device
  const isMobile = () => {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      ) || window.innerWidth <= 768
    );
  };

  // Generate HTML content for tokens
  const generateTokensHtml = () => {
    const qrSrc = `${window.location.origin}/mybphs-qrcode.svg`;
    const tokensHtml = unassociatedTokens
      .slice()
      .reverse()
      .map(
        (token) => `
        <div class="token-item">
          <img class="token-qr" src="${qrSrc}" alt="QR" />
          <span class="token-id">${token.id}</span>
        </div>`,
      )
      .join("");

    return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    @page {
                        margin: 0.5in;
                        size: A4;
                    }
                    body {
                        font-family: 'Courier New', 'Monaco', monospace;
                        background: white;
                        margin: 0;
                        padding: 0;
                        font-size: 12px;
                        line-height: 1.2;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                        padding: 10px;
                        border-bottom: 2px solid #333;
                    }
                    .tokens-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 8px;
                        width: 100%;
                    }
                    .token-item {
                        border: 1px solid #000;
                        padding: 4px 6px;
                        font-weight: bold;
                        font-size: 18px;
                        background: white;
                        color: black;
                        break-inside: avoid;
                        min-height: 40px;
                        display: flex;
                        flex-direction: row;
                        align-items: center;
                        gap: 6px;
                    }
                    .token-qr {
                        height: 34px;
                        width: 34px;
                        flex-shrink: 0;
                        display: block;
                    }
                    .token-id {
                        flex: 1;
                        text-align: center;
                    }
                    @media print {
                        body { -webkit-print-color-adjust: exact; }
                        .tokens-grid { page-break-inside: avoid; }
                    }
                    @media screen and (max-width: 768px) {
                        .tokens-grid {
                            grid-template-columns: repeat(2, 1fr);
                            gap: 6px;
                        }
                        .token-item {
                            font-size: 16px;
                            padding: 4px 6px;
                        }
                        .token-qr {
                            height: 30px;
                            width: 30px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Onboarding Tokenek</h1>
                    <p>Összesen: ${unassociatedTokens.length} token</p>
                </div>
                <div class="tokens-grid">
                    ${tokensHtml}
                </div>
            </body>
            </html>
        `;
  };

  // Print tokens in grid format
  const printTokens = () => {
    if (unassociatedTokens.length === 0) return;

    const htmlContent = generateTokensHtml();

    if (isMobile()) {
      // For mobile devices, create a blob and open it in a new tab
      // This works better with mobile browsers
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);

      // Try to open in new tab/window
      const printWindow = window.open(url, "_blank");

      if (!printWindow) {
        // If popup blocked, try alternative approach
        // Create a temporary link and click it
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.download = `tokens-${Date.now()}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        // Show helpful message
        alert(
          "A token lista új lapon nyílik meg. Használd a böngésző nyomtatás funkcióját (⋮ menü → Nyomtatás)",
        );
      } else {
        // Clean up URL when window is closed
        const cleanup = () => {
          URL.revokeObjectURL(url);
        };

        // Try to detect when window is closed (not reliable on all mobile browsers)
        const checkClosed = setInterval(() => {
          if (printWindow.closed) {
            cleanup();
            clearInterval(checkClosed);
          }
        }, 1000);

        // Cleanup after 30 seconds regardless
        setTimeout(() => {
          cleanup();
          clearInterval(checkClosed);
        }, 30000);
      }
    } else {
      // Desktop approach - works reliably on desktop browsers
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert(
          "Popup blokkolva! Engedélyezd a popup ablakokat ehhez az oldalhoz.",
        );
        return;
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500); // Small delay to ensure content is fully loaded
      };
    }
  };

  return (
    <Card>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-600 pb-4">
          <div className="flex items-center gap-2">
            <ScanIcon className="size-5 text-white" />
            <h2 className="text-lg font-semibold text-white">Token Szkenner</h2>
          </div>
        </div>
        <div className="flex flex-row justify-between gap-4">
          {/* Scanner Input */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <NFCInput nfc={true} onChange={setNfcId} />
              {isUserLoading && (
                <div className="flex items-center gap-2">
                  <SmallLoading />
                  <span className="text-sm text-gray-400">
                    Token ellenőrzése...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={printTokens}
              disabled={unassociatedTokens.length === 0}
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
            >
              <PrinterIcon className="size-4" />
              <span className="hidden sm:block">
                {isMobile() ? "Megnyitás" : "Nyomtatás"} (
                {unassociatedTokens.length})
              </span>
            </Button>
            <Button
              onClick={() => setShowOffboardDialog(true)}
              disabled={associatedTokens.length === 0}
              className="flex items-center gap-2 bg-orange-600 text-white hover:bg-orange-700 hover:text-white"
            >
              <LogOutIcon className="size-4" />
              <span className="hidden sm:block">
                Offboard ({associatedTokens.length})
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={clearTokens}
              disabled={scannedTokens.length === 0}
              className="flex items-center gap-2 border-red-600 bg-red-700 text-white hover:bg-red-600 hover:text-white"
            >
              <TrashIcon className="size-4" />
              <span className="hidden sm:block">Összes törlése</span>
            </Button>
          </div>
        </div>

        {/* Scanned Tokens List */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300">
            Szkennelések ({scannedTokens.length})
          </h3>
          <div className="scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 max-h-64 space-y-2 overflow-y-auto">
            {scannedTokens.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <ScanIcon className="size-12 text-gray-500" />
                <p className="mt-2 text-gray-400">Még nincs token</p>
              </div>
            ) : (
              scannedTokens.map((token) => (
                <div
                  key={`${token.id}-${token.timestamp.getTime()}`}
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-3 py-5",
                    token.isAssociated
                      ? "border-red-500/30 bg-red-900/20"
                      : "border-green-500/30 bg-green-900/20",
                  )}
                >
                  <div className="flex items-center gap-3">
                    {token.isAssociated ? (
                      <XCircleIcon className="size-5 text-red-500" />
                    ) : (
                      <CheckCircleIcon className="size-5 text-green-500" />
                    )}
                    <div className="flex flex-col gap-1">
                      <code className="rounded border border-gray-500 bg-[#565656] px-2 py-1 font-mono text-sm text-white">
                        {token.id}
                      </code>
                      {token.isAssociated && token.userName && (
                        <span className="text-xs text-red-300">
                          {token.userName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Offboard Confirmation Dialog */}
      <Dialog open={showOffboardDialog} onOpenChange={setShowOffboardDialog}>
        <DialogContent className="border-gray-700 bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              Offboard megerősítése
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 p-3">
            {associatedTokens.map((token) => (
              <div
                key={token.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-medium text-white">
                  {token.userName ?? "Ismeretlen"}
                </span>
                <code className="rounded border border-gray-600 bg-gray-700 px-1.5 py-0.5 font-mono text-xs text-gray-300">
                  {token.id}
                </code>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowOffboardDialog(false)}
              disabled={offboardMutation.isPending}
              className="border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white"
            >
              Mégse
            </Button>
            <Button
              onClick={handleOffboard}
              disabled={offboardMutation.isPending}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {offboardMutation.isPending ? (
                <SmallLoading />
              ) : (
                <>
                  <LogOutIcon className="size-4" />
                  Offboard
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
