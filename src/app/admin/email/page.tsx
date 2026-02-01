import SendEmail from "@/components/admin/email/SendEmail";
import OnlyRoles from "@/components/auth/OnlyRoles";
import PageWithHeader from "@/components/PageWithHeader";

export const metadata = {
  title: "Admin / Email",
};

export default function Email() {
  return (
    <OnlyRoles roles={["administrator"]}>
      <PageWithHeader title="Admin / Email" homeLocation="/admin">
        <div className="px-10">
          <SendEmail />
        </div>
      </PageWithHeader>
    </OnlyRoles>
  );
}
