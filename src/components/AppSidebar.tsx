import { Link } from "@tanstack/react-router";
import { Home, Network, Sparkle, Library, Settings, Youtube } from "lucide-react";
import { DnaMark } from "./Logo";
import { supabase } from "@/lib/supabase/client";
import { useProfile } from "@/lib/use-profile";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/story-map", label: "My Story Map", icon: Network },
  { to: "/plan", label: "Plan Content", icon: Sparkle },
  { to: "/library", label: "Content Library", icon: Library },
  { to: "/import-youtube", label: "Import YouTube", icon: Youtube },
] as const;

export function AppSidebar() {
  const profile = useProfile();
  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }
  return (
    <aside className="flex w-[15.5rem] shrink-0 flex-col justify-between bg-sidebar px-4 py-6 lg:sticky lg:top-0 lg:h-screen">
      <div>
        <Link to="/" className="flex items-center gap-2.5 px-2">
          <DnaMark className="h-9 w-9 shrink-0" />
          <span className="min-w-0">
            <span className="block text-[1.0625rem] font-extrabold leading-none tracking-tight text-sidebar-foreground">
              Creator<span className="text-experience">DNA</span>
            </span>
            <span className="mt-1.5 block text-[0.5rem] font-medium uppercase tracking-[0.16em] text-sidebar-foreground/55">
              Your stories. A brighter tomorrow.
            </span>
          </span>
        </Link>

        <nav className="mt-9 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>

        <Link
          to="/add-content"
          className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          + Add Content
        </Link>
        <Link
          to="/onboarding"
          className="mt-2 flex items-center justify-center rounded-xl border border-sidebar-border px-3 py-2 text-xs font-semibold text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          Creator Foundation
        </Link>
      </div>

      <div className="space-y-1 border-t border-sidebar-border pt-4">
        <Link
          to="/profile"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Settings className="h-4 w-4 shrink-0" /> Profile
        </Link>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </button>
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex w-full items-center rounded-xl px-3 py-2 text-xs text-sidebar-foreground/55 hover:text-sidebar-foreground"
        >
          Sign out
        </button>
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-experience text-xs font-bold text-midnight">
            {profile?.displayName
              .split(/\s+/)
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() || "…"}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-sidebar-foreground">
              {profile?.displayName || "Loading profile…"}
            </span>
            <span className="block truncate text-[0.6875rem] text-sidebar-foreground/55">
              {profile ? `@${profile.username}` : ""}
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
}
