import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

import { THEME_COOKIE_NAME, type ResolvedTheme } from "@/lib/theme";

export const getInitialTheme = createServerFn({ method: "GET" }).handler(
  (): ResolvedTheme => {
    return getCookie(THEME_COOKIE_NAME) === "light" ? "light" : "dark";
  },
);
