import { useEffect, useState } from "react";
import "utils/web-nfc.d.ts";

function NFCInput({
    nfc,
    onChange,
}: {
    nfc: boolean;
    onChange: (data: string) => void;
}) {
    const [data, setData] = useState("");

    function onReading({ serialNumber }: NDEFReadingEvent) {
        setData(serialNumber.replaceAll(":", ""));
    }

    useEffect(() => {
        if (nfc && "NDEFReader" in window) {
            const ndef = new NDEFReader();

            ndef.addEventListener("reading", onReading);

            ndef.scan();

            return () => {
                ndef.removeEventListener("reading", onReading);
            };
        }
    }, [nfc]);

    useEffect(() => {
        onChange(data);
    }, [data, onChange]);

    return (
        <>
            <input
                type="text"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="h-10 w-40 rounded-md p-1 text-center"
                placeholder="Token ID"
            />
        </>
    );
}

export default NFCInput;
