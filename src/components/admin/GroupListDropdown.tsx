import { useEffect, useState } from "react";
import { trpc } from "utils/trpc";

export default function UserDropdown({
    onChange,
}: {
    onChange: (data: string) => void;
}) {
    const groups = trpc.group.list.useQuery();

    const [data, setData] = useState("");

    useEffect(() => {
        onChange(data);
    }, [data, onChange]);

    return (
        <>
            <select
                className="h-10 w-40 rounded-md border-none p-2 text-center font-bold text-black"
                onChange={(e) => setData(e.target.value)}
            >
                {groups.data?.length === 0 ? <h1>Nincsenek csoportok</h1> : 
                    groups.data?.map((group) => (
                        <option
                            key={group.groupName}
                            value={group.groupName}
                            className="font-bold"
                        >
                            {group.groupName}
                        </option>
                    ))}
            </select>
        </>
    );
}
