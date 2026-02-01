import UsersDataManager from "@/components/admin/users/UsersDataManager";
import OnlyRoles from "@/components/auth/OnlyRoles";
import PageWithHeader from "@/components/PageWithHeader";

export const metadata = {
  title: "Admin / Felhasználók",
};

export default function Users() {
  return (
    <OnlyRoles roles={["administrator"]}>
      <PageWithHeader title="Admin / Felhasználók" homeLocation="/admin">
        <div className="px-10">
          <UsersDataManager />
        </div>
      </PageWithHeader>
    </OnlyRoles>
  );
}
