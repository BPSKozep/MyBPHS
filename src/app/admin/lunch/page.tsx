import CloseMenuOrders from "@/components/admin/lunch/CloseMenuOrders";
import LunchOrders from "@/components/admin/lunch/LunchOrders";
import SetMenuAndSendEmail from "@/components/admin/lunch/SetMenuAndSendEmail";
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
        <div className="flex flex-col justify-center md:flex-row space-x-10">
          <Card>
            <SetMenuAndSendEmail />
          </Card>
          <Card>
            <LunchOrders />
          </Card>
          <Card>
            <div className="flex flex-col items-center justify-center text-center">
              <CloseMenuOrders />
              <hr className="my-5 h-1 w-full border bg-gray-900" />
              <TokenCheck />
            </div>
          </Card>
        </div>
      </PageWithHeader>
    </OnlyRoles>
  );
}
