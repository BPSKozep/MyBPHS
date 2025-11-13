import type React from "react";
import { useEffect, useState } from "react";

export default function Tabs({
  options,
  defaultOption,
  onChange,
}: {
  options: Record<string, string>;
  defaultOption: string;
  onChange: (selected: string) => void;
}) {
  const [selectedTab, setSelectedTab] = useState(defaultOption);

  const handleTabChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedTab(event.target.value);
  };

  useEffect(() => {
    onChange(selectedTab);
  }, [selectedTab, onChange]);

  return (
    <div className="text-white select-none">
      {Object.entries(options).map(([key, value], index) => (
        <div key={key} className="inline-block">
          <input
            type="radio"
            id={key}
            value={key}
            checked={selectedTab === key}
            onChange={handleTabChange}
            className="hidden"
          />
          <label
            htmlFor={key}
            className={`box-border inline-block p-3 px-5 text-sm font-bold sm:text-base ${
              selectedTab === key ? "bg-[#434a68]" : "bg-[#565e85]"
            } ${index === 0 ? "rounded-l-md" : ""} ${
              index === Object.keys(options).length - 1 ? "rounded-r-md" : ""
            }`}
          >
            {value}
          </label>
        </div>
      ))}
    </div>
  );
}
