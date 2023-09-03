import { useState } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";

function SaveButton({ onClick }: { onClick: () => void }) {
    const [saveAnimation, setSaveAnimation] = useState(false);

    return (
        <motion.button
            className="h-12 w-12 rounded-2xl p-3 text-white"
            initial={{
                scale: 1,
                backgroundColor: "#565e85",
            }}
            animate={
                saveAnimation
                    ? {
                          scale: 1.2,
                          backgroundColor: "#4abd63",
                      }
                    : { scale: 1 }
            }
            transition={{
                scale: {
                    type: "spring",
                    damping: 9,
                    stiffness: 200,
                },
                backgroundColor: {
                    type: "tween",
                },
            }}
            whileHover={{
                backgroundColor: saveAnimation ? "#4abd63" : "#3a445d",
            }}
            onClick={() => {
                onClick();

                setSaveAnimation(true);
                setTimeout(() => setSaveAnimation(false), 800);
            }}
        >
            <div className="relative">
                <motion.div
                    initial={{ display: "block", opacity: 1 }}
                    animate={{
                        display: saveAnimation ? "none" : "block",
                        opacity: saveAnimation ? 0 : 1,
                    }}
                >
                    <FontAwesomeIcon icon={faFloppyDisk} size="xl" />
                </motion.div>
                <motion.div
                    initial={{ display: "none", scale: 0 }}
                    animate={{
                        display: saveAnimation ? "block" : "none",
                        scale: saveAnimation ? 1 : 0,
                    }}
                >
                    <FontAwesomeIcon icon={faCheck} size="xl" />
                </motion.div>
            </div>
        </motion.button>
    );
}

export default SaveButton;
