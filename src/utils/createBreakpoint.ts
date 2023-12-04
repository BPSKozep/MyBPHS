import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../tailwind.config";

const screens =
    (resolveConfig(tailwindConfig).theme?.screens as {
        [breakpoint: string]: string;
    }) || {};

export default function createBreakpoint(from?: string, to?: string) {
    if (from && to)
        return `(min-width: ${screens[from]}) and (max-width: ${screens[to]})`;
    else if (from) return `(min-width: ${screens[from]})`;
    else if (to) return `(max-width: ${screens[to]})`;

    throw new Error("Provide at least one of 'from' or 'to'.");
}
