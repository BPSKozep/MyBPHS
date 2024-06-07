import React from "react";

function Loading() {
    return (
        <div className="scale-150">
            <div className="h-6 w-6 animate-spin rounded-full border-[0.22rem] border-solid border-gray-600 border-t-white" />
        </div>
    );
}

export default Loading;
