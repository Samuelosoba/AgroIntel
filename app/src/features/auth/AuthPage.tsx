import { useState } from "react";
import { Button, ErrorNote, Field, inputClass } from "@/components/ui";
import { useAuth } from "@/lib/auth";

export function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-brand-500 to-brand-700">
      <div className="px-6 pb-10 pt-16 text-white">
        <img src="/favicon.svg" alt="" className="size-14 rounded-2xl ring-4 ring-white/20" />
        <h1 className="mt-5 text-3xl font-extrabold">AgroIntel</h1>
        <p className="mt-1 text-brand-100">Your digital farming co-pilot. Scan sick plants, plan planting, beat the weather.</p>
      </div>
      <div className="flex-1 rounded-t-3xl bg-earth-50 px-6 pt-8">
        <form onSubmit={submit} className="mx-auto max-w-sm space-y-4">
          <h2 className="text-xl font-bold">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          {mode === "register" && (
            <Field label="Full name"><input required value={form.name} onChange={set("name")} className={inputClass} autoComplete="name" /></Field>
          )}
          <Field label="Email"><input required type="email" value={form.email} onChange={set("email")} className={inputClass} autoComplete="email" /></Field>
          <Field label="Password">
            <input
              required type="password" minLength={mode === "register" ? 8 : undefined} value={form.password} onChange={set("password")}
              className={inputClass} autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </Field>
          <ErrorNote error={error} />
          <Button type="submit" className="w-full" loading={busy}>{mode === "login" ? "Sign in" : "Create account"}</Button>
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="w-full py-2 text-sm font-semibold text-brand-700"
          >
            {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
