import React, { PropsWithChildren } from "react";

function Card({ children }: PropsWithChildren) {
    return (
        <div className="m-5 rounded-xl bg-[#242424] p-5 shadow-xl">
            {children}
        </div>
    );
}

export default Card;
