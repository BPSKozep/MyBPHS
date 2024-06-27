"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import sleep from "utils/sleep";
import IconSubmitButton from "components/IconSubmitButton";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { trpc } from "utils/trpc";

function LaptopPasswordReset() {
    const [input, setInput] = useState("");
    const { data, refetch: refetchData } =
        trpc.adpassword.getLastChanged.useQuery();
    const { mutateAsync: setNewPassword } =
        trpc.adpassword.setNewPassword.useMutation();

    const inputValid = input.length >= 6;

    return (
        <div className="flex flex-col items-center text-center">
            <h1 className="mb-5 font-bold text-white">
                Bejelentkezési jelszó be- vagy visszaállítása
            </h1>
            <input
                type="password"
                placeholder="Jelszó"
                className="mb-3 rounded-md p-1 text-center transition-all"
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />

            <motion.span
                className="text-white"
                initial={{
                    opacity: 0,
                    height: 0,
                }}
                animate={{
                    opacity: inputValid ? 0 : 1,
                    height: inputValid ? 0 : "auto",
                }}
                transition={{
                    height: { delay: inputValid ? 0.2 : 0 },
                }}
            >
                A jelszó legalább 6 karakter hosszú legyen.
            </motion.span>

            <div className="mt-3">
                <IconSubmitButton
                    icon={<FontAwesomeIcon icon={faFloppyDisk} />}
                    onClick={async () => {
                        try {
                            await sleep(500);

                            await setNewPassword(input);

                            refetchData();

                            return true;
                        } catch (err) {
                            return false;
                        }
                    }}
                />
            </div>
            <h1 className="mt-5 text-white">
                Legutoljára módosítva: {data ? data : "Még nem volt"}
            </h1>
        </div>
    );
}

export default LaptopPasswordReset;
