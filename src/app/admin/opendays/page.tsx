import OpenDaysManager from "@/components/admin/opendays/OpenDaysManager";
import OnlyRoles from "@/components/auth/OnlyRoles";
import PageWithHeader from "@/components/PageWithHeader";

export const metadata = {
  title: "Admin / Nyílt napok",
};

export default function OpenDaysAdminPage() {
  return (
    <OnlyRoles roles={["administrator", "openday-admin"]}>
      <PageWithHeader title="Admin / Nyílt napok" homeLocation="/admin">
        <div className="px-4 sm:px-10 pb-16">
          <OpenDaysManager />
        </div>
      </PageWithHeader>
    </OnlyRoles>
  );
}
