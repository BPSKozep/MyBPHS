import React from "react";

function OrderCounts({ data }: { data: Record<string, number> }) {
    return (
        <table>
            <thead>
                <tr>
                    <th className="bg-gray-700 px-6 py-3 text-left text-2xl font-bold tracking-wider text-white">
                        Opció
                    </th>
                    <th className="bg-gray-700 px-6 py-3 text-left text-2xl font-bold tracking-wider text-white">
                        Mennyiség
                    </th>
                </tr>
            </thead>
            <tbody>
                {Object.entries(data).map((dataRow, index) => (
                    <tr key={index}>
                        <td className="whitespace-nowrap bg-gray-700 px-6 py-3 text-left text-xl font-medium text-gray-100">
                            {dataRow[0]}
                        </td>
                        <td className="whitespace-nowrap bg-gray-700 px-6 py-3 text-center text-xl font-medium text-gray-100">
                            {dataRow[1]}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default OrderCounts;
