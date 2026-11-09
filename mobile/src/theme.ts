// Primary is Nigerian green (#008751). Soft mint surfaces, deep-green ink and
// a warm orange accent give the clean, illustrated look of the app.
export const colors = {
  brand50: "#e9f7ef",
  brand100: "#cdeedb",
  brand200: "#9fdcb9",
  brand300: "#5fc28d",
  brand500: "#008751",
  brand600: "#00703f",
  brand700: "#005a33",
  brand800: "#0b3d2c",

  // Neutrals (earth* names kept so older components keep working)
  earth50: "#f3faf5", // app background — soft mint
  earth100: "#eaf2ec",
  earth200: "#e1ebe4", // hairlines
  earth400: "#98a69e",
  earth600: "#5b6b62",
  earth800: "#25382d",
  earth900: "#10241a", // ink

  sun100: "#fff1dd",
  sun300: "#ffd08a",
  sun500: "#f4a340",
  sun700: "#9a5a0b",
  clay100: "#fde6df",
  clay500: "#e0603a",
  clay700: "#9b3416",
  sky100: "#e3f2fb",
  sky300: "#9fd3f2",
  sky500: "#3b9bd9",
  sky700: "#1f6fa3",
  soil500: "#a8743f",
  soil700: "#7a5129",

  white: "#ffffff",
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 10, md: 14, lg: 20, xl: 28, full: 999 };

export const font = {
  small: 12,
  body: 15,
  title: 18,
  h1: 28,
};

export const levelColors = {
  info: { bg: colors.brand50, fg: colors.brand700, icon: colors.brand500 },
  good: { bg: colors.brand50, fg: colors.brand700, icon: colors.brand500 },
  watch: { bg: colors.sun100, fg: colors.sun700, icon: colors.sun500 },
  warning: { bg: colors.clay100, fg: colors.clay700, icon: colors.clay500 },
} as const;

export const shadow = {
  card: { shadowColor: "#0b3d2c", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  lifted: { shadowColor: "#008751", shadowOpacity: 0.28, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
};
