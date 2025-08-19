import OnlyRoles from "@/components/auth/OnlyRoles";
import PageWithHeader from "@/components/PageWithHeader";
import LaptopDeploymentsClient from "@/components/admin/laptops/LaptopDeploymentsClient";

export const metadata = {
    title: "Admin / Laptop Telepítések",
};

export default function LaptopPage() {
    return (
        <OnlyRoles roles={["administrator"]}>
            <PageWithHeader title="Laptop Telepítések" homeLocation="/admin">
                <LaptopDeploymentsClient />
            </PageWithHeader>
        </OnlyRoles>
    );
}
