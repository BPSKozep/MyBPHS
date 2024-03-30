import globalOptions from "data/global_options.json";

type Menu = Record<string, string>;

export default function menuCombine(menu: Menu): Menu {
    return { ...globalOptions, ...menu };
}
