import CreditBar from "components/CreditBar";
import React, { useState } from "react";

function CreditBarDemo() {
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
                className="mx-2 rounded-md bg-white p-3"
            >
                Set
            </button>
            <div className="absolute flex h-full w-full items-center justify-center">
                <CreditBar progress={progress} />
            </div>
        </>
    );
}

export default CreditBarDemo;