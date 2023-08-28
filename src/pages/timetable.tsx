import PageWithHeader from "components/PageWithHeader";
import Timetable from "components/Timetable";
import { useSession } from "next-auth/react";
import React from "react";
import { trpc } from "utils/trpc";

const EMPTY_TIMETABLE = Array(5).fill([]);

function TimetableDemo() {
    const { data: session } = useSession();
    const { data: timetable } = trpc.user.getTimetable.useQuery(
        session?.user?.email || ""
    );

    return (
        <PageWithHeader title="Órarend">
            <div className="flex h-full w-full items-center justify-center">
                <Timetable
                    timetable={timetable || EMPTY_TIMETABLE}
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

export default TimetableDemo;
