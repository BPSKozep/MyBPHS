import React from "react";

function LatestGitCommit() {
    return (
        <div className="absolute bottom-1 right-1 text-gray-500">
            {process.env.MYBPHS_GIT_VERSION}
        </div>
    );
}

export default LatestGitCommit;
