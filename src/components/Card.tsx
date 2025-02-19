import React, { PropsWithChildren } from "react";

interface CardProps extends PropsWithChildren {
    padding?: string;
}

function Card({ children, padding = "5" }: CardProps) {
    return (
        <div
            className={`relative m-5 rounded-xl bg-[#242424] shadow-xl p-${padding}`}
        >
            {children}
        </div>
    );
}

export default Card;
