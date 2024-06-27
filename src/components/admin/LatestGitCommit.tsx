import React from "react";

function LatestGitCommit() {
    return (
        <div className="absolute bottom-0 right-0 text-gray-500">
            {process.env.MYBPHS_VERSION}
        </div>
    );
}

export default LatestGitCommit;
