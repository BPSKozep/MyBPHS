import Card from "components/Card";
import SignInComponent from "components/SignInComponent";
import React from "react";

export const metadata = {
    title: "MyBPHS - Bejelentkezés",
};

export default function SignIn() {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center text-white">
            <Card>
                <SignInComponent />
            </Card>
        </div>
    );
}
