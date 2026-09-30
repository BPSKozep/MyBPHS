import type { Metadata } from "next";
import OpenDaysRegistrationFlow from "@/components/opendays/OpenDaysRegistrationFlow";

export const metadata: Metadata = {
  title: "Nyílt Napok - Budapest School JPP",
  description: "Budapest School JPP Nyílt Napok",
};

export default function OpenDaysPage() {
  return (
    <div className="h-full w-full overflow-y-auto px-4 py-8 scrollbar-thin [scrollbar-color:#4b5563_transparent]">
      <OpenDaysRegistrationFlow />
    </div>
  );
}
