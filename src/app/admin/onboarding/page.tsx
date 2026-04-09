import GoogleGroupSync from "@/components/admin/onboarding/GoogleGroupSync";
import LastUsers from "@/components/admin/onboarding/LastUsers";
import TokenScanner from "@/components/admin/onboarding/TokenScanner";
import OnlyRoles from "@/components/auth/OnlyRoles";
import PageWithHeader from "@/components/PageWithHeader";

export const metadata = {
  title: "Admin / Onboarding",
};

export default function Onboarding() {
  return (
    <OnlyRoles roles={["administrator"]}>
      <PageWithHeader title="Admin / Onboarding" homeLocation="/admin">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 px-10">
          <div>
            <TokenScanner />
          </div>
          <div className="flex flex-col gap-4">
            <GoogleGroupSync />
            <LastUsers />
          </div>
        </div>
      </PageWithHeader>
    </OnlyRoles>
  );
}
