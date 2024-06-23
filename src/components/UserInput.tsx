import { useEffect, useState } from "react";
import { trpc } from "utils/trpc";

export default function UserInput({
    onChange,
}: {
    onChange: (data: string) => void;
}) {
    const users = trpc.user.list.useQuery("all");

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
                {users.data &&
                    users.data.map((user) => (
                        <option key={user.email} value={user.email}>
                            {user.name}
                        </option>
                    ))}
            </select>
        </>
    );
}
