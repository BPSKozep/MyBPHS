"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { FaArrowRight, FaQuestionCircle } from "react-icons/fa";
import { twMerge } from "tailwind-merge";
import Button from "@/components/Button";
import Loading from "@/components/Loading";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/trpc/react";

interface WelcomeStepProps {
  name: string;
  email: string;
  onNext: () => void;
  onUserExists: () => void;
}

export default function WelcomeStep({
  name,
  email,
  onNext,
  onUserExists,
}: WelcomeStepProps) {
  const [checking, setChecking] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const checkUser = api.user.checkExists.useQuery(
    { email },
    {
      enabled: !!email,
      retry: false,
    },
  );

  useEffect(() => {
    if (checkUser.data !== undefined) {
      if (checkUser.data) {
        onUserExists();
      } else {
        setChecking(false);
      }
    }
    if (checkUser.error) {
      setChecking(false);
    }
  }, [checkUser.data, checkUser.error, onUserExists]);

  useEffect(() => {
    if (!showTooltip) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        setShowTooltip(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showTooltip]);

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Loading />
        <p className="mt-4 text-white">Ellenőrzés...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-3 text-center">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold text-white">Helló!</h1>
        <p className="mb-6 text-lg text-gray-300">
          Úgy tűnik, még nincs fiókod. Hozzuk létre most!
        </p>
      </div>

      <div className="mb-6 w-full space-y-4">
        <div className="flex items-center gap-3 rounded-lg bg-gray-700 p-4">
          <div className="text-left">
            <p className="text-sm text-gray-400">Név</p>
            <p className="font-medium wrap-break-word text-white">{name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg bg-gray-700 p-4">
          <div className="text-left">
            <p className="text-sm text-gray-400">Email cím</p>
            <p className="font-medium break-all text-white">{email}</p>
          </div>
        </div>
      </div>

      <div className="mb-8 flex items-center justify-center gap-2">
        <Checkbox
          id="has-token"
          checked={hasToken}
          onCheckedChange={(checked) => setHasToken(checked === true)}
          className="size-4.5 rounded border-gray-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 cursor-pointer"
        />
        <label
          htmlFor="has-token"
          className="cursor-pointer text-sm font-medium text-gray-200 select-none"
        >
          Megkaptam a tokenemet
        </label>
        <div className="relative inline-flex items-center" ref={tooltipRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip((prev) => !prev);
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            className="cursor-pointer text-gray-400 hover:text-gray-200 focus:outline-none transition-colors p-1"
            aria-label="Információ a tokenről"
          >
            <FaQuestionCircle className="h-4 w-4" />
          </button>
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 mb-2 w-64 max-w-[calc(100vw-3rem)] rounded-lg bg-gray-800 border border-gray-600 p-3 text-xs text-gray-200 shadow-xl z-50 text-left leading-relaxed"
                role="tooltip"
              >
                A regisztráció alatt szükség lesz az egyéni token azonosítódra.
                A tokenedért keresd a rendszergazdát vagy a mentorodat.
                <div className="absolute top-full right-2 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 -mt-1 h-2 w-2 rotate-45 bg-gray-800 border-r border-b border-gray-600" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={!hasToken}
        className={twMerge(
          "flex w-full items-center justify-center gap-2 transition-colors",
          hasToken
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-gray-700 hover:bg-gray-700 text-gray-400 opacity-60 cursor-not-allowed",
        )}
      >
        Kezdjük
        <FaArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
