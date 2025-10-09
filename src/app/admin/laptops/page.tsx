import OnlyRoles from "@/components/auth/OnlyRoles";
import PageWithHeader from "@/components/PageWithHeader";
import LaptopDeploymentsClient from "@/components/admin/laptops/LaptopDeploymentsClient";
import LaptopLogins from "@/components/admin/laptops/LaptopLogins";
import Card from "@/components/Card";

export const metadata = {
    title: "Admin / Laptopok",
};

export default function LaptopPage() {
    return (
        <OnlyRoles roles={["administrator"]}>
            <PageWithHeader title="Laptopok" homeLocation="/admin">
                <div className="flex flex-col gap-4 lg:flex-row">
                    {/* Left side - Deployments (50%) */}
                    <div className="w-full lg:w-1/2">
                        <Card>
                            <LaptopDeploymentsClient />
                        </Card>
                    </div>

                    {/* Right side - Logins (50%) */}
                    <div className="w-full lg:w-1/2">
                        <LaptopLogins />
                    </div>
                </div>
            </PageWithHeader>
        </OnlyRoles>
    );
}
