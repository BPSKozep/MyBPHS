import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { ObjectValues } from "utils/types";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { sleep } from "utils/sleep";

const RESULT = {
    SUCCESS: "SUCCESS",
    FAILURE: "FAILURE",
} as const;

const COLORS = {
    DEFAULT: "#565e85",
    PENDING: "var(--sky-600)",
    SUCCESS: "var(--green-500)",
    ERROR: "var(--red-700)",
} as const;

function LoadingIcon() {
    return (
        <motion.div
            className="aspect-square h-3 rounded-full bg-white"
            animate={{
                scale: [1, 1.6, 1],
            }}
            transition={{
                duration: 0.8,
                repeat: Infinity,
                repeatDelay: 0.5,
            }}
        ></motion.div>
    );
}

function IconSubmitButton({
    onClick,
    icon,
}: {
    onClick: () =>
        | Promise<ObjectValues<typeof RESULT>>
        | ObjectValues<typeof RESULT>;
    icon: ReactNode;
}) {
    const [isPressed, setIsPressed] = useState(false);
    const [buttonRotation, setButtonRotation] = useState(0);
    const [buttonColor, setButtonColor] = useState<ObjectValues<typeof COLORS>>(
        COLORS.DEFAULT
    );
    const [currentIcon, setCurrentIcon] = useState<ReactNode>(icon);

    return (
        <motion.button
            className="bg- h-12 w-12 rounded-2xl p-3 text-white"
            initial={{
                scale: 1,
                backgroundColor: COLORS.DEFAULT,
            }}
            animate={{
                scale: isPressed ? 1.2 : 1,
                backgroundColor: buttonColor,
                rotate: buttonRotation,
            }}
            transition={{
                scale: {
                    type: "spring",
                    damping: 9,
                    stiffness: 200,
                },
                rotate: {
                    type: "spring",
                    damping: 20,
                    stiffness: 300,
                },
                backgroundColor: {
                    type: "tween",
                },
            }}
            whileHover={{
                backgroundColor: isPressed ? buttonColor : "#3a445d",
            }}
            onClick={async () => {
                if (isPressed) return;

                setIsPressed(true);

                setButtonRotation((rotation) => rotation + 45);
                setButtonColor(COLORS.PENDING);
                setCurrentIcon(<LoadingIcon />);

                const result = await onClick();

                setButtonRotation((rotation) => rotation + 360);

                switch (result) {
                    case RESULT.SUCCESS: {
                        setButtonColor(COLORS.SUCCESS);
                        setCurrentIcon(<FontAwesomeIcon icon={faCheck} />);
                        break;
                    }

                    case RESULT.FAILURE: {
                        setButtonColor(COLORS.ERROR);
                        setCurrentIcon(<FontAwesomeIcon icon={faXmark} />);
                        break;
                    }
                }

                await sleep(1500);

                setButtonColor(COLORS.DEFAULT);
                setCurrentIcon(icon);
                setButtonRotation((rotation) => rotation + 45);
                setIsPressed(false);
            }}
        >
            <div
                className="relative flex items-center justify-center"
                style={{ transform: `rotate(${-buttonRotation}deg)` }}
            >
                {currentIcon}
            </div>
        </motion.button>
    );
}

export default IconSubmitButton;
