import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Home,
  Import,
  Library,
  LogOut,
  Menu,
  MoreHorizontal,
  Network,
  Search,
  Settings,
  Sparkle,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { AdaptiveCreatorDNAIcon, AdaptiveCreatorDNALogo } from "./Logo";
import { supabase } from "@/lib/supabase/client";
import { useProfile } from "@/lib/use-profile";
import { ThemeToggle } from "@/components/ThemeProvider";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/story-map", label: "Story Map", icon: Network },
] as const;

function SidebarGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <p className="mono-label mb-2.5 border-b border-sidebar-border px-3 pb-2.5 text-sidebar-foreground/45">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function SidebarLink({
  to,
  label,
  icon: Icon,
}: {
  to:
    | "/foundation"
    | "/brand-territories"
    | "/library"
    | "/import"
    | "/add-content"
    | "/research"
    | "/plan";
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      to={to}
      className="sidebar-link group relative flex items-center gap-3 overflow-hidden rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium text-sidebar-foreground/65 transition-[color,background-color,border-color,transform] duration-200 hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:translate-y-px focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[status=active]:border-primary/40 data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-foreground"
    >
      <Icon
        className="h-[18px] w-[18px] shrink-0 opacity-75 transition-opacity duration-200 group-hover:opacity-100 group-data-[status=active]:opacity-100"
        strokeWidth={1.9}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node))
        setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);
  async function signOut() {
    await supabase.auth.signOut();
    await navigate({ to: "/login", replace: true });
  }
  return (
    <aside className="telemetry-grid flex w-full shrink-0 flex-col justify-between border-r border-sidebar-border bg-sidebar px-4 py-4 text-sidebar-foreground lg:sticky lg:top-0 lg:h-screen lg:w-[15.5rem] lg:px-4 lg:py-6">
      <div>
        <div className="flex items-center justify-between">
          <Link
            to="/"
            aria-label="Creator DNA home"
            className="logo-link group flex items-center gap-2.5 rounded-lg px-2"
          >
            <AdaptiveCreatorDNAIcon className="h-9 w-9 shrink-0 transition-transform duration-200 group-hover:scale-105" />
            <AdaptiveCreatorDNALogo
              showIcon={false}
              showTagline={false}
              className="h-7 w-[7.75rem]"
            />
          </Link>
          <button
            type="button"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-sidebar-border text-sidebar-foreground lg:hidden"
          >
            {mobileOpen ? (
              <X className="h-[18px] w-[18px]" strokeWidth={1.9} />
            ) : (
              <Menu className="h-[18px] w-[18px]" strokeWidth={1.9} />
            )}
          </button>
        </div>
        <nav
          onClick={() => setMobileOpen(false)}
          className={`${mobileOpen ? "block" : "hidden"} mt-6 space-y-5 lg:mt-9 lg:block`}
        >
          <div>
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="sidebar-link group relative flex shrink-0 items-center gap-3 overflow-hidden rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium text-sidebar-foreground/65 transition-[color,background-color,border-color,transform] duration-200 hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:translate-y-px focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[status=active]:border-primary/40 data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-foreground"
              >
                <item.icon
                  className="h-[18px] w-[18px] shrink-0 opacity-75 transition-opacity duration-200 group-hover:opacity-100 group-data-[status=active]:opacity-100"
                  strokeWidth={1.9}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
          <SidebarGroup title="YOUR DNA">
            <SidebarLink
              to="/foundation"
              label="My Foundation"
              icon={Settings}
            />
            <SidebarLink
              to="/brand-territories"
              label="Brand Territories"
              icon={Network}
            />
            <SidebarLink to="/library" label="Content Library" icon={Library} />
          </SidebarGroup>
          <SidebarGroup title="GROW">
            <SidebarLink to="/import" label="Import Content" icon={Import} />
            <SidebarLink to="/add-content" label="Add Content" icon={Sparkle} />
          </SidebarGroup>
          <SidebarGroup title="RESEARCH">
            <SidebarLink to="/research" label="Research" icon={Search} />
            <SidebarLink to="/plan" label="Plan Content" icon={Sparkle} />
          </SidebarGroup>
        </nav>
      </div>
      <div
        className={`${mobileOpen ? "flex" : "hidden"} mt-5 items-center gap-2 border-t border-sidebar-border pt-4 lg:block lg:space-y-1.5`}
      >
        <ThemeToggle />
        <Link
          to="/profile"
          className="hidden w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-[color,background-color,transform] duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:translate-y-px focus-visible:ring-2 focus-visible:ring-sidebar-ring lg:flex"
        >
          <Settings className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />{" "}
          Profile & settings
        </Link>
        <div ref={profileMenuRef} className="relative flex-1 lg:mt-2">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls="creator-profile-menu"
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm font-medium text-sidebar-foreground/70 transition-[color,background-color,transform] duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:translate-y-px focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-experience text-xs font-bold text-midnight">
              {profile?.displayName
                ?.split(/\s+/)
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
            <MoreHorizontal
              className="ml-auto h-[18px] w-[18px]"
              strokeWidth={1.9}
            />
          </button>
          {menuOpen ? (
            <div
              id="creator-profile-menu"
              role="menu"
              className="popover-enter absolute bottom-full left-0 z-20 mb-2 w-48 rounded-xl border border-sidebar-border bg-sidebar p-1 shadow-lift"
            >
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent"
              >
                <UserRound className="h-[18px] w-[18px]" strokeWidth={1.9} />{" "}
                Profile
              </Link>
              <Link
                to="/foundation"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent"
              >
                <Settings className="h-[18px] w-[18px]" strokeWidth={1.9} />{" "}
                Creator Foundation
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent"
              >
                <LogOut className="h-[18px] w-[18px]" strokeWidth={1.9} /> Sign
                out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
