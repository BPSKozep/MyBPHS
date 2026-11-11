import LunchTokenAnalytics from "@/components/admin/lunch/analytics/LunchTokenAnalytics";
import OnlyRoles from "@/components/auth/OnlyRoles";
import PageWithHeader from "@/components/PageWithHeader";

export const metadata = {
  title: "Admin / Ebédtoken Statisztikák",
};

export default function LunchTokenAnalyticsPage() {
  return (
    <OnlyRoles roles={["administrator", "lunch-system"]}>
      <PageWithHeader
        title="Admin / Ebédtoken Statisztikák"
        homeLocation="/admin/lunch-token-usage"
      >
        <div className="px-4 py-5 sm:px-10">
          <LunchTokenAnalytics />
        </div>
      </PageWithHeader>
    </OnlyRoles>
  );
}
