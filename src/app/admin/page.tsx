import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import BigLinkButton from "@/components/BigLinkButton";
import PageWithHeader from "@/components/PageWithHeader";
import { authOptions } from "@/server/auth";
import { api } from "@/trpc/server";

export const metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.disabled) {
    redirect("/forbidden");
  }

  const user = await api.user.get(session.user?.email ?? "");
  const isAdministrator = user?.roles.includes("administrator");
  const isOpendayAdmin = user?.roles.includes("openday-admin");

  if (!isAdministrator && !isOpendayAdmin) {
    redirect("/forbidden");
  }

  return (
    <PageWithHeader title="Admin">
      <div className="flex h-full w-full items-center justify-center text-white">
        <div className="m-3 inline-grid grid-cols-1 gap-4 sm:grid-cols-2">
          {isAdministrator && (
            <>
              <BigLinkButton title="Ebédrendelés" url="/admin/lunch" />
              <BigLinkButton title="Felhasználók" url="/admin/users" />
              <BigLinkButton title="Hálózat" url="/admin/networking" />
              <BigLinkButton title="Onboarding" url="/admin/onboarding" />
              <BigLinkButton title="Email" url="/admin/email" />
              <BigLinkButton title="Laptopok" url="/admin/laptops" />
            </>
          )}
          <BigLinkButton title="Nyílt napok" url="/admin/opendays" />
        </div>
      </div>
    </PageWithHeader>
  );
}
