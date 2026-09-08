import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Moon, Sun } from "lucide-react";
import { THEME_COOKIE_NAME, type ResolvedTheme } from "@/lib/theme";

export type ThemePreference = ResolvedTheme;

const PUBLIC_STORAGE_KEY = "creator-dna-public-theme";

export function ThemeProvider({
  children,
  initialTheme,
  storageKey = PUBLIC_STORAGE_KEY,
}: {
  children: ReactNode;
  initialTheme: ResolvedTheme;
  storageKey?: string;
}) {
  const [preference, setPreference] = useState<ThemePreference>(initialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", preference === "dark");
    window.localStorage.setItem(storageKey, preference);
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${THEME_COOKIE_NAME}=${preference}; Path=/; SameSite=Lax; Max-Age=31536000${secure}`;
  }, [preference, storageKey]);

  return (
    <ThemeContext.Provider value={{ preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

const ThemeContext = createContext<{
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}>({ preference: "light", setPreference: () => undefined });

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle({
  className,
  variant = "slider",
}: { className?: string; variant?: "slider" | "icon" } = {}) {
  const { preference, setPreference } = useTheme();
  const isDark = preference === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";
  const toggleTheme = () => {
    const update = () => setPreference(isDark ? "light" : "dark");
    if (typeof document === "undefined") {
      update();
      return;
    }
    const viewTransitionDocument = document as Document & {
      startViewTransition?: (callback: () => void) => unknown;
    };
    if (
      viewTransitionDocument.startViewTransition &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      viewTransitionDocument.startViewTransition(update);
      return;
    }
    update();
  };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={label}
      title={label}
      onClick={toggleTheme}
      className={`transition-[color,background-color,border-color,transform] duration-200 active:translate-y-px active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        className ??
        "relative grid h-8 w-16 grid-cols-2 rounded-lg border border-sidebar-border bg-sidebar-accent p-0.5 text-sidebar-foreground/55 hover:border-sidebar-ring/60"
      }`}
    >
      {variant === "icon" ? (
        isDark ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )
      ) : (
        <>
          <span
            className={`grid place-items-center rounded-md transition-colors ${!isDark ? "bg-sidebar-primary text-white" : ""}`}
          >
            <Sun className="h-4 w-4" />
          </span>
          <span
            className={`grid place-items-center rounded-md transition-colors ${isDark ? "bg-sidebar-primary text-white" : ""}`}
          >
            <Moon className="h-4 w-4" />
          </span>
        </>
      )}
    </button>
  );
}
