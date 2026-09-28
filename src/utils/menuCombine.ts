import globalOptions from "@/data/global_options.json";

type Menu = Record<string, string>;

export default function menuCombine(menu: Menu, include_no_order = true): Menu {
  const { i_am_not_want_food: _, ...globalOptionsOmitted } = globalOptions;
  const baseGlobals = include_no_order ? globalOptions : globalOptionsOmitted;

  const combined: Menu = {};

  // 1. Specific menu options for the day (e.g. a-menu, b-menu, everyfree, enimölfree, veghatariannus)
  for (const [key, val] of Object.entries(menu)) {
    if (key === "soup") continue;
    if (val && val.trim() !== "") {
      combined[key] = val;
    }
  }

  // 2. Global fallback options not already provided
  for (const [key, val] of Object.entries(baseGlobals)) {
    if (key === "i_am_not_want_food") continue;
    if (!(key in combined)) {
      combined[key] = val;
    }
  }

  // 3. No order option at the end
  if (include_no_order) {
    combined.i_am_not_want_food = globalOptions.i_am_not_want_food;
  }

  return combined;
}

export function menuCombines(menus: Menu[], include_no_order = true): Menu[] {
  return menus.map((menu) => menuCombine(menu, include_no_order));
}
