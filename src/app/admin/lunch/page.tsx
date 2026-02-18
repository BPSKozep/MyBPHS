import CloseMenuOrders from "@/components/admin/lunch/CloseMenuOrders";
import CreateMenu from "@/components/admin/lunch/CreateMenu";
import LunchOrders from "@/components/admin/lunch/LunchOrders";
import TokenCheck from "@/components/admin/lunch/TokenCheck";
import OnlyRoles from "@/components/auth/OnlyRoles";
import Card from "@/components/Card";
import PageWithHeader from "@/components/PageWithHeader";

export const metadata = {
  title: "Admin / Ebédrendelés",
};

export default function LunchAdmin() {
  return (
    <OnlyRoles roles={["administrator"]}>
      <PageWithHeader title="Admin / Ebédrendelés" homeLocation="/admin">
        <div className="flex w-full max-w-full min-w-0 flex-col justify-center gap-5 md:flex-row px-10">
          <div className="min-w-0 flex-1">
            <Card>
              <CreateMenu />
            </Card>
          </div>
          <div className="min-w-0 flex-1">
            <Card>
              <LunchOrders />
            </Card>
          </div>
          <div className="min-w-0 flex-1">
            <Card>
              <div className="flex flex-col items-center justify-center text-center">
                <CloseMenuOrders />
                <hr className="my-5 h-1 w-full border bg-gray-900" />
                <TokenCheck />
              </div>
            </Card>
          </div>
        </div>
      </PageWithHeader>
    </OnlyRoles>
  );
}
