import CreateTimetable from "@/components/admin/timetable/CreateTimetable";
import OnlyRoles from "@/components/auth/OnlyRoles";
import PageWithHeader from "@/components/PageWithHeader";

export const metadata = {
  title: "Admin / Órarend",
};

export default function Timetable() {
  return (
    <OnlyRoles roles={["administrator", "staff"]}>
      <PageWithHeader title="Admin / Órarend" homeLocation="/admin">
        <CreateTimetable />
      </PageWithHeader>
    </OnlyRoles>
  );
}
