import OnlyRoles from "@/components/auth/OnlyRoles";
import BigLinkButton from "@/components/BigLinkButton";
import PageWithHeader from "@/components/PageWithHeader";

export const metadata = {
  title: "Admin",
};

export default function Users() {
  return (
    <OnlyRoles roles={["administrator"]}>
      <PageWithHeader title="Admin">
        <div className="flex h-full w-full items-center justify-center text-white">
          <div className="m-3 inline-grid grid-cols-1 grid-rows-4 gap-4 sm:grid-cols-2 sm:grid-rows-2">
            <BigLinkButton title="Ebédrendelés" url="/admin/lunch" />
            <BigLinkButton title="Felhasználók" url="/admin/users" />
            <BigLinkButton title="Órarend" url="/admin/timetable" />
            {/* <BigLinkButton title="Csoportok" url="/admin/groups" /> */}
            <BigLinkButton title="Onboarding" url="/admin/onboarding" />
            <BigLinkButton title="Email" url="/admin/email" />
            <BigLinkButton title="Laptopok" url="/admin/laptops" />
          </div>
        </div>
      </PageWithHeader>
    </OnlyRoles>
  );
}
