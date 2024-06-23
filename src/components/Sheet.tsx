import React, { useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface SheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const Sheet = ({ isOpen, onClose, children }: SheetProps) => {
    const overlayRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            return () => {
                document.removeEventListener("keydown", handleKeyDown);
            };
        }
    }, [isOpen, onClose]);

    return isOpen
        ? createPortal(
              <div ref={overlayRef} className="fixed inset-0 z-50">
                  <div
                      className="fixed inset-0 bg-black/80"
                      onClick={onClose}
                  />
                  <div
                      className={`fixed inset-y-0 right-0 w-3/4 transform bg-gray-400/50 p-6 shadow-lg transition-transform sm:max-w-sm ${
                          isOpen ? "translate-x-0" : "translate-x-full"
                      }`}
                  >
                      <button
                          className="absolute right-4 top-4 rounded-full bg-gray-200 p-2 hover:bg-gray-300"
                          onClick={onClose}
                      >
                          X
                      </button>
                      {children}
                  </div>
              </div>,
              document.body
          )
        : null;
};

export default Sheet;
