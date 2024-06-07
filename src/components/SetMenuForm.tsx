import React, { useEffect, useState } from "react";

const days = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"];

function SetMenuForm({
    onChange,
}: {
    onChange: (options: { "a-menu": string; "b-menu": string }[]) => void;
}) {
    const [options, setOptions] = useState(
        Array(5)
            .fill(0)
            .map(() => {
                return {
                    "a-menu": "",
                    "b-menu": "",
                };
            })
    );

    useEffect(() => {
        onChange(options);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options]);

    return (
        <>
            {days.map((day, dayIndex) => (
                <React.Fragment key={dayIndex}>
                    <h1 className="py-2 text-xl font-bold text-white">{day}</h1>
                    <div className="flex flex-row items-center justify-center">
                        <input
                            type="text"
                            className="m-2 w-32 rounded-md border-none p-2 text-center font-bold text-black sm:w-40"
                            placeholder="A Menü"
                            value={options[dayIndex]["a-menu"]}
                            onChange={(e) => {
                                setOptions((options) => {
                                    const option = {
                                        "a-menu": e.target.value,
                                        "b-menu": options[dayIndex]["b-menu"],
                                    };

                                    const optionsCopy = [...options];

                                    optionsCopy[dayIndex] = option;

                                    return optionsCopy;
                                });
                            }}
                        />
                        <input
                            type="text"
                            className="m-2 w-32 rounded-md border-none p-2 text-center font-bold text-black sm:w-40"
                            placeholder="B Menü"
                            value={options[dayIndex]["b-menu"]}
                            onChange={(e) => {
                                setOptions((options) => {
                                    const option = {
                                        "a-menu": options[dayIndex]["a-menu"],
                                        "b-menu": e.target.value,
                                    };

                                    const optionsCopy = [...options];

                                    optionsCopy[dayIndex] = option;

                                    return optionsCopy;
                                });
                            }}
                        />
                    </div>
                </React.Fragment>
            ))}
        </>
    );
}

export default SetMenuForm;
