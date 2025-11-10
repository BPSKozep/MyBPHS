import SignInComponent from "@/components/auth/SignInComponent";
import Card from "@/components/Card";

export const metadata = {
  title: "Bejelentkezés",
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
