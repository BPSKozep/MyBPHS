import { redirect } from "next/navigation";
import KioskPage from "@/components/admin/KioskPage";

export const metadata = {
  title: "Kiosk",
};

export default async function Kiosk({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  if (params?.token) {
    redirect(`/auth/kiosk?token=${encodeURIComponent(params.token)}`);
  }

  return <KioskPage />;
}
