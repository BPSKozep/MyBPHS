import LunchTokenUsageManager from "@/components/admin/lunch/LunchTokenUsageManager";
import OnlyRoles from "@/components/auth/OnlyRoles";
import PageWithHeader from "@/components/PageWithHeader";

export const metadata = {
  title: "Admin / Ebédtoken Használat",
};

export default async function LunchTokenUsagePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string | string[] }>;
}) {
  const { search } = await searchParams;

  return (
    <OnlyRoles roles={["administrator", "lunch-system"]}>
      <PageWithHeader title="Admin / Ebédtoken Használat" homeLocation="/admin">
        <div className="px-10">
          <LunchTokenUsageManager
            initialSearch={typeof search === "string" ? search : ""}
          />
        </div>
      </PageWithHeader>
    </OnlyRoles>
  );
}
