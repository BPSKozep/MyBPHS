"use client";

import { useSession } from "next-auth/react";
import PageWithHeader from "@/components/PageWithHeader";
import Timetable from "@/components/timetable/Timetable";
import { api } from "@/trpc/react";

const EMPTY_TIMETABLE = Array(5).fill([]);

export default function TimetableDemo() {
  const { data: session } = useSession();
  const timetable = api.user.getTimetable.useQuery(session?.user?.email ?? "");

  return (
    <PageWithHeader title="Órarend">
      <div className="flex h-full w-full items-center justify-center">
        <Timetable
          timetable={timetable.data ?? EMPTY_TIMETABLE}
          timeslots={[
            "9:00-9:45",
            "9:55-10:40",
            "10:55-11:40",
            "11:50-12:35",
            "12:35-13:30",
            "13:30-14:15",
            "14:25-15:10",
            "15:15-16:00",
          ]}
        />
      </div>
    </PageWithHeader>
  );
}
