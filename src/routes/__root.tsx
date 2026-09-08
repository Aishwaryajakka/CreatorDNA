import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuthState } from "@/lib/auth-state";
import { DataPulse } from "@/components/Motion";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back
          home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: "Creator DNA — Your stories. A brighter tomorrow." },
        {
          name: "description",
          content:
            "Every creator has a content calendar. Creator DNA gives them a story map.",
        },
        { property: "og:title", content: "Creator DNA" },
        {
          property: "og:description",
          content:
            "Every creator has a content calendar. Creator DNA gives them a story map.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [
        {
          rel: "stylesheet",
          href: appCss,
        },
        { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      ],
    }),

    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
  },
);

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('creator-dna-public-theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`,
          }}
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootContent() {
  const location = useLocation();
  const { status } = useAuthState();
  const publicPath = ["/login", "/reset-password"].includes(location.pathname);
  const landingPath = location.pathname === "/" && status === "unauthenticated";
  const authenticated = status === "authenticated";

  return (
    <ThemeProvider
      key={authenticated ? "app-theme" : "public-theme"}
      storageKey={
        authenticated ? "creator-dna-app-theme" : "creator-dna-public-theme"
      }
    >
      {publicPath || landingPath ? (
        <Outlet />
      ) : (
        <ProtectedApp>
          <AuthenticatedAppShell>
            <Outlet />
          </AuthenticatedAppShell>
        </ProtectedApp>
      )}
    </ThemeProvider>
  );
}

export function AuthenticatedAppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isStoryMap = location.pathname === "/story-map";
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      <AppSidebar />
      <main
        className={`creative-workspace min-w-0 flex-1 bg-background px-5 sm:px-8 ${isStoryMap ? "py-6 lg:py-7" : "py-8 lg:px-12 lg:py-10"}`}
      >
        <div
          key={location.pathname}
          className={`route-enter mx-auto ${isStoryMap ? "max-w-none" : "max-w-6xl"}`}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

function ProtectedApp({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, session, profile, error } = useAuthState();
  useEffect(() => {
    if (status === "unauthenticated")
      void navigate({ to: "/login", replace: true });
    if (
      status === "authenticated" &&
      location.pathname !== "/onboarding" &&
      profile &&
      !profile.onboardingCompleted
    ) {
      void navigate({ to: "/onboarding", replace: true });
    }
  }, [location.pathname, navigate, profile, status]);
  if (status === "loading")
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        <span className="flex items-center gap-3 font-mono text-xs uppercase tracking-wide">
          <DataPulse color="aqua" /> Loading Creator DNA…
        </span>
      </div>
    );
  if (status === "error")
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-sm text-destructive">
        {error ?? "We couldn't load your account."}
      </div>
    );
  if (!session) return null;
  return children;
}
