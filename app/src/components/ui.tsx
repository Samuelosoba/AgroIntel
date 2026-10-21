import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import type { AdvisoryLevel } from "@agrointel/shared";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx("rounded-2xl border border-earth-200/70 bg-white p-4 shadow-sm", className)}>{children}</div>;
}

type Variant = "primary" | "secondary" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700",
  secondary: "bg-brand-50 text-brand-700 hover:bg-brand-100",
  ghost: "text-earth-600 hover:bg-earth-100",
  danger: "bg-clay-100 text-clay-700 hover:bg-clay-500 hover:text-white",
};

export function Button({
  variant = "primary",
  loading,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={clsx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 font-semibold transition disabled:opacity-60",
        variants[variant],
        className,
      )}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

const levelStyles: Record<AdvisoryLevel | "good", string> = {
  info: "bg-brand-50 text-brand-700",
  good: "bg-brand-50 text-brand-700",
  watch: "bg-sun-100 text-sun-700",
  warning: "bg-clay-100 text-clay-700",
};

export function Badge({ level = "info", children }: { level?: AdvisoryLevel | "good"; children: ReactNode }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", levelStyles[level])}>
      {children}
    </span>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 mt-6 flex items-end justify-between">
      <h2 className="text-base font-bold text-earth-800">{children}</h2>
      {action}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-earth-600">
      <LoaderCircle className="size-5 animate-spin text-brand-500" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-2 py-8 text-center">
      <div className="mb-1 rounded-full bg-brand-50 p-3 text-brand-500">{icon}</div>
      <p className="font-semibold">{title}</p>
      <p className="max-w-xs text-sm text-earth-600">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}

export function ErrorNote({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <p className="rounded-xl bg-clay-100 px-3 py-2 text-sm text-clay-700">
      {error instanceof Error ? error.message : "Something went wrong"}
    </p>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-earth-600">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full min-h-11 rounded-xl border border-earth-200 bg-white px-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
