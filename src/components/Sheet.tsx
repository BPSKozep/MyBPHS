import React, { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

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
                  <AnimatePresence>
                      <motion.div
                          key="modal"
                          initial={{ x: 300 }}
                          animate={{ x: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`fixed inset-y-0 right-0 w-3/4 transform border-l-2 border-l-gray-800 bg-[#09090b] p-6 shadow-lg transition-transform sm:max-w-sm ${
                              isOpen ? "translate-x-0" : "translate-x-full"
                          }`}
                      >
                          <button
                              className="absolute right-5 top-5 text-white"
                              onClick={onClose}
                          >
                              X
                          </button>
                          {children}
                      </motion.div>
                  </AnimatePresence>
              </div>,
              document.body
          )
        : null;
};

export default Sheet;
