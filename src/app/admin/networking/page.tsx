import NetworkingToggleGuestWifi from "@/components/admin/networking/NetworkingToggleGuestWifi";
import OnlyRoles from "@/components/auth/OnlyRoles";
import Card from "@/components/Card";
import PageWithHeader from "@/components/PageWithHeader";

export const metadata = {
  title: "Admin / Hálózat",
};

export default function NetworkingPage() {
  return (
    <OnlyRoles roles={["administrator"]}>
      <PageWithHeader title="Hálózat" homeLocation="/admin">
        <div className="px-10">
          <Card>
            <NetworkingToggleGuestWifi />
          </Card>
        </div>
      </PageWithHeader>
    </OnlyRoles>
  );
}
