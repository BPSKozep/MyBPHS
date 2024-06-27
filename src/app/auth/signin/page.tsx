import Card from "components/Card";
import SignInComponent from "components/SignInComponent";
import React from "react";

function SignIn() {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center text-white">
            <Card>
                <SignInComponent />
            </Card>
        </div>
    );
}

export default SignIn;
