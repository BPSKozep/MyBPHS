import { useEffect, useState } from "react";

export default function NFCInput({
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: onReading
  useEffect(() => {
    if (nfc && "NDEFReader" in window) {
      const ndef = new NDEFReader();

      ndef.addEventListener("reading", onReading);

      ndef.scan().catch((error) => {
        console.error(error);
      });

      return () => {
        ndef.removeEventListener("reading", onReading);
      };
    }
  }, [nfc]);

  useEffect(() => {
    onChange(data);
  }, [data, onChange]);

  return (
    <input
      type="text"
      value={data}
      onChange={(e) => setData(e.target.value)}
      className="h-10 w-40 rounded-md bg-white p-1 text-center text-black"
      placeholder="Token ID"
    />
  );
}
