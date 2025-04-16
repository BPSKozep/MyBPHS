import React from "react";
import { motion } from "framer-motion";

export default function ChatLoading() {
    return (
        <div className="flex items-center justify-center space-x-2">
            {[0, 1, 2].map((index) => (
                <motion.div
                    key={index}
                    className="h-3 w-3 rounded-full bg-blue-500"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.5, 1],
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: index * 0.2,
                    }}
                />
            ))}
        </div>
    );
}
