import globalOptions from "data/global_options.json";

type Menu = { [key: string]: string };

export default function menuCombine(menu: Menu): Menu {
    return { ...globalOptions, ...menu };
}
