import globalOptions from "data/global_options.json";

type Menu = Record<string, string>;

export default function menuCombine(
    menu: Menu,
    include_no_order: boolean = true
): Menu {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { i_am_not_want_food: _, ...globalOptionsOmitted } = globalOptions;

    return {
        ...menu,
        ...(include_no_order ? globalOptions : globalOptionsOmitted),
    };
}
