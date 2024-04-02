import React, { ReactNode } from "react";
import { motion } from "framer-motion";

function IconButton({
    onClick,
    icon,
}: {
    onClick: () => void;
    icon: ReactNode;
}) {
    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileFocus={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{
                type: "spring",
                stiffness: 500,
                damping: 20,
            }}
            className="inline-block aspect-square h-10 rounded-lg bg-slate-600"
            onClick={() => onClick()}
        >
            {icon}
        </motion.button>
    );
}

export default IconButton;
