const screens: Record<string, string> = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

export default function createBreakpoint(from?: string, to?: string) {
  if (from && to)
    return `(min-width: ${screens[from]}) and (max-width: ${screens[to]})`;
  else if (from) return `(min-width: ${screens[from]})`;
  else if (to) return `(max-width: ${screens[to]})`;

  throw new Error("Provide at least one of 'from' or 'to'.");
}
