import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import BigLinkButton from "@/components/BigLinkButton";
import PageWithHeader from "@/components/PageWithHeader";
import { authOptions } from "@/server/auth";
import { api } from "@/trpc/server";

export const metadata = {
  title: "Admin",
};

const buttonClass = "items-center p-4 text-base sm:p-7 sm:text-xl";

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
      <div className="flex min-h-full w-full items-center justify-center p-3 text-white">
        <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:inline-grid sm:w-auto sm:max-w-none sm:gap-4">
          {isAdministrator && (
            <>
              <BigLinkButton
                className={buttonClass}
                title="Ebédrendelés"
                url="/admin/lunch"
              />
              <BigLinkButton
                className={buttonClass}
                title="Token használat"
                url="/admin/lunch-token-usage"
              />
              <BigLinkButton
                className={buttonClass}
                title="Felhasználók"
                url="/admin/users"
              />
              <BigLinkButton
                className={buttonClass}
                title="Onboarding"
                url="/admin/onboarding"
              />
              <BigLinkButton
                className={buttonClass}
                title="Email"
                url="/admin/email"
              />
              <BigLinkButton
                className={buttonClass}
                title="Laptopok"
                url="/admin/laptops"
              />
              <BigLinkButton
                className={buttonClass}
                title="API kulcsok"
                url="/admin/api-keys"
              />
            </>
          )}
          <BigLinkButton
            className={buttonClass}
            title="Nyílt napok"
            url="/admin/opendays"
          />
        </div>
      </div>
    </PageWithHeader>
  );
}
