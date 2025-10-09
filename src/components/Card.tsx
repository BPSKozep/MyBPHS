import type { PropsWithChildren } from "react";
import React from "react";

interface CardProps extends PropsWithChildren {
    padding?: string;
    margin?: string;
    color?: string;
}

export default function Card({
    children,
    padding = "5",
    margin = "5",
    color = "#242424",
}: CardProps) {
    return (
        <div
            className={`relative m-${margin} rounded-xl bg-[${color}] shadow-xl p-${padding}`}
        >
            {children}
        </div>
    );
}
