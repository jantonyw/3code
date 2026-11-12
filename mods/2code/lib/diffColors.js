// Diff colors are independent of terminal ANSI colors, which vary by theme.
export function diffColors(dark) {
  return dark
    ? { add: "#19392d", del: "#49282c", addText: "#82d6a6", delText: "#f39a9a", hunk: "#252f3a", hunkText: "#96b8d6" }
    : { add: "#e4f5e9", del: "#fde9e9", addText: "#247844", delText: "#b63e49", hunk: "#eaf2f8", hunkText: "#466f91" };
}
