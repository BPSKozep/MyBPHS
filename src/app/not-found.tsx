import Button from "@/components/Button";
import PageWithHeader from "@/components/PageWithHeader";
import Link from "next/link";
import React from "react";

export default function NotFound() {
    return (
        <PageWithHeader title="">
            <div className="flex h-full flex-col items-center justify-center">
                <h1 className="mb-6 text-xl font-black text-white">
                    Az oldal nem található.
                </h1>
                <Link href="/">
                    <Button>Vissza a főoldalra</Button>
                </Link>
            </div>
        </PageWithHeader>
    );
}
