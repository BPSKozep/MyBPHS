import React, { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";

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
                      className="fixed inset-0 bg-black/40"
                      onClick={onClose}
                  />
                  <motion.div
                      initial={{ x: 400 }}
                      animate={{ x: 0 }}
                      transition={{ type: "spring" }}
                      className={`fixed inset-y-0 right-0 w-3/4 transform border-l-2 border-l-gray-800 bg-[#111827] p-6 shadow-lg transition-transform sm:max-w-sm ${
                          isOpen ? "translate-x-0" : "translate-x-full"
                      }`}
                  >
                      <button
                          className="absolute right-5 top-5 text-white"
                          onClick={onClose}
                      >
                          <FontAwesomeIcon icon={faX} />
                      </button>
                      {children}
                  </motion.div>
              </div>,
              document.body
          )
        : null;
};
export default Sheet;
