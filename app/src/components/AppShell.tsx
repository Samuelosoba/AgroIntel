import clsx from "clsx";
import { NavLink, Outlet, Link } from "react-router";
import { BarChart3, Camera, House, MessageCircle, Sprout, Tractor } from "lucide-react";
import { useAuth } from "@/lib/auth";

const tabs = [
  { to: "/", label: "Home", icon: House },
  { to: "/crops", label: "Crops", icon: Sprout },
  { to: "/scan", label: "Scan", icon: Camera, primary: true },
  { to: "/farms", label: "My Farms", icon: Tractor },
  { to: "/assistant", label: "Ask AI", icon: MessageCircle },
];

export function AppShell() {
  const { user } = useAuth();
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-earth-50/90 px-4 pb-2 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur">
        <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight text-brand-700">
          <img src="/favicon.svg" alt="" className="size-7" />
          AgroIntel
        </Link>
        <div className="flex items-center gap-1">
          <NavLink to="/insights" aria-label="Insights" className="rounded-full p-2 text-earth-600 hover:bg-earth-100">
            <BarChart3 className="size-5" />
          </NavLink>
          <NavLink
            to="/profile"
            aria-label="Profile"
            className="grid size-9 place-items-center rounded-full bg-brand-500 text-sm font-bold text-white"
          >
            {user?.name.charAt(0).toUpperCase()}
          </NavLink>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-earth-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {tabs.map(({ to, label, icon: Icon, primary }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  clsx(
                    "flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold",
                    isActive ? "text-brand-600" : "text-earth-400",
                  )
                }
              >
                {primary ? (
                  <span className="-mt-7 grid size-14 place-items-center rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/30 ring-4 ring-earth-50">
                    <Icon className="size-6" />
                  </span>
                ) : (
                  <Icon className="size-6" />
                )}
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
