import React from "react";
import { useRouter } from "next/router";
import HomeIcon from "@mui/icons-material/Home";

function Credits() {
    const router = useRouter();

    return (
        <>
            <div className="flex bg-slate-800 items-center justify-center h-[7vh] gap-4">
                <HomeIcon
                    color="primary"
                    fontSize="large"
                    onClick={() => {
                        router.push("/");
                    }}
                    className="cursor-pointer"
                />
                <h1 className="text-center text-xl sm:text-2xl font-black text-white">
                    Kreditek
                </h1>
            </div>
        </>
    );
}

export default Credits;
