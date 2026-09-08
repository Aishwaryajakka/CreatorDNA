import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Moon, Sun } from "lucide-react";

export type ThemePreference = "system" | "light" | "dark";

const PUBLIC_STORAGE_KEY = "creator-dna-public-theme";
const APP_STORAGE_KEY = "creator-dna-app-theme";

function resolveTheme(preference: ThemePreference): "light" | "dark" {
  if (preference !== "system") return preference;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({
  children,
  storageKey = PUBLIC_STORAGE_KEY,
}: {
  children: ReactNode;
  storageKey?: string;
}) {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    if (typeof window === "undefined") return "system";
    const stored = window.localStorage.getItem(storageKey);
    return stored === "light" || stored === "dark" || stored === "system"
      ? stored
      : "system";
  });

  useEffect(() => {
    const root = document.documentElement;
    const apply = () =>
      root.classList.toggle("dark", resolveTheme(preference) === "dark");
    apply();
    window.localStorage.setItem(storageKey, preference);
    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
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
}>({ preference: "system", setPreference: () => undefined });

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle({
  className,
  variant = "slider",
}: { className?: string; variant?: "slider" | "icon" } = {}) {
  const { preference, setPreference } = useTheme();
  const isDark =
    preference === "dark" ||
    (preference === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
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
      className={
        className ??
        "relative grid h-8 w-16 grid-cols-2 rounded-lg border border-sidebar-border bg-sidebar-accent p-0.5 text-sidebar-foreground/55 transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      }
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
