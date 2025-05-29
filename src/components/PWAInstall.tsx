import React, { useEffect, useState } from "react";
import { FaDownload } from "react-icons/fa";

export default function PWAInstall() {
    const [supportsPWA, setSupportsPWA] = useState(false);
    const [PWAPrompt, setPWAPrompt] = useState<BeforeInstallPromptEvent>();

    useEffect(() => {
        const PWAHandler = (e: BeforeInstallPromptEvent) => {
            e.preventDefault();
            setSupportsPWA(true);
            setPWAPrompt(e);
        };

        window.addEventListener(
            "beforeinstallprompt",
            PWAHandler as EventListenerOrEventListenerObject,
        );

        return () =>
            window.removeEventListener(
                "beforeinstallprompt",
                PWAHandler as EventListenerOrEventListenerObject,
            );
    }, []);

    if (supportsPWA)
        return (
            <button
                onClick={async () => {
                    PWAPrompt?.prompt().catch((error) => {
                        console.error(error);
                    });
                    const choice = await PWAPrompt?.userChoice;

                    if (choice && choice.outcome === "accepted") {
                        setSupportsPWA(false);
                    }
                }}
                className="p-3 text-white"
            >
                <FaDownload className="scale-150 cursor-pointer" />
            </button>
        );
}
