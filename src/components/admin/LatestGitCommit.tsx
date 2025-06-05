import React from "react";

export default function LatestGitCommit() {
    return (
        <div className="absolute right-1 bottom-1 text-gray-500">
            {process.env.MYBPHS_GIT_VERSION}
        </div>
    );
}
