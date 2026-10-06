import LunchTokenUsageManager from "@/components/admin/lunch/LunchTokenUsageManager";
import OnlyRoles from "@/components/auth/OnlyRoles";
import PageWithHeader from "@/components/PageWithHeader";

export const metadata = {
  title: "Admin / Ebédtoken Használat",
};

export default function LunchTokenUsagePage() {
  return (
    <OnlyRoles roles={["administrator", "lunch-system"]}>
      <PageWithHeader title="Admin / Ebédtoken Használat" homeLocation="/admin">
        <div className="px-10">
          <LunchTokenUsageManager />
        </div>
      </PageWithHeader>
    </OnlyRoles>
  );
}
