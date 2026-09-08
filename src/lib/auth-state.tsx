import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/profile";

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "error";

type AuthState = {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  error: string | null;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<AuthState, "refresh">>({
    status: "loading",
    user: null,
    session: null,
    profile: null,
    error: null,
  });

  async function resolve(session: Session | null) {
    if (!session) {
      setState({
        status: "unauthenticated",
        user: null,
        session: null,
        profile: null,
        error: null,
      });
      return;
    }
    setState((current) => ({
      ...current,
      status: "loading",
      user: session.user,
      session,
      error: null,
    }));
    try {
      const response = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error("We couldn't load your account.");
      const profile = (await response.json()) as Profile;
      setState((current) => ({ ...current, status: "authenticated", profile }));
    } catch (error) {
      setState((current) => ({
        ...current,
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "We couldn't load your account.",
      }));
    }
  }

  const refresh = async () => {
    setState((current) => ({ ...current, status: "loading", error: null }));
    const { data } = await supabase.auth.getSession();
    await resolve(data.session);
  };

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) void resolve(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!active || event === "INITIAL_SESSION") return;
        void resolve(session);
      },
    );
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthState() {
  const state = useContext(AuthContext);
  if (!state) throw new Error("useAuthState must be used inside AuthProvider");
  return state;
}
