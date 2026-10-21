export const pct = (x: number) => `${Math.round(x * 100)}%`;

export const dayName = (iso: string, i: number) =>
  i === 0 ? "Today" : i === 1 ? "Tmrw" : new Date(iso).toLocaleDateString(undefined, { weekday: "short" });

export const time = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

export const date = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};
