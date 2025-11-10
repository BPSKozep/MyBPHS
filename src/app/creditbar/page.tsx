"use client";

import { useState } from "react";
import CreditBar from "@/components/CreditBar";

export default function CreditBarDemo() {
  const [progressInput, setProgressInput] = useState("");
  const [progress, setProgress] = useState(0);

  return (
    <>
      <input
        type="number"
        value={progressInput}
        onChange={(e) => setProgressInput(e.target.value)}
        className="rounded-md bg-white p-3"
      />
      <button
        onClick={() => setProgress(parseFloat(progressInput) / 100)}
        type="button"
        className="mx-2 rounded-md bg-white p-3"
      >
        Set
      </button>
      <div className="absolute flex h-full w-full items-center justify-center px-5">
        <CreditBar
          progress={progress}
          credits={[
            "COMPLETED",
            "COMPLETED",
            "FAILED",
            "COMPLETED",
            "PENDING",
            "PENDING",
            "PENDING",
            "PENDING",
            "PENDING",
            "PENDING",
          ]}
        />
      </div>
    </>
  );
}
