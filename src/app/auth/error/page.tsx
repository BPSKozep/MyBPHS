import PageWithHeader from "@/components/PageWithHeader";
import React from "react";
import Link from "next/link";
import Button from "@/components/Button";

export default function AuthError() {
    return (
        <PageWithHeader title="">
            <div className="flex h-full flex-col items-center justify-center">
                <h1 className="mb-6 text-xl font-black text-white">
                    Hiba történt.
                </h1>
                <Link href="/">
                    <Button>Vissza a főoldalra</Button>
                </Link>
            </div>
        </PageWithHeader>
    );
}
