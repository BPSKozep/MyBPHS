import ApiKeysManager from "@/components/admin/api-keys/ApiKeysManager";
import OnlyRoles from "@/components/auth/OnlyRoles";
import PageWithHeader from "@/components/PageWithHeader";

export const metadata = {
  title: "Admin / API kulcsok",
};

export default function ApiKeysPage() {
  return (
    <OnlyRoles roles={["administrator"]}>
      <PageWithHeader title="API kulcsok" homeLocation="/admin">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-10">
          <ApiKeysManager />
        </div>
      </PageWithHeader>
    </OnlyRoles>
  );
}
