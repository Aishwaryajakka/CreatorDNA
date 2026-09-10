import type { Session, User } from "@supabase/supabase-js";
import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cancelAuthenticatedRequests, supabase } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/profile";

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "error";

type AuthState = {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  error: string | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const resolveVersion = useRef(0);
  const signingOut = useRef(false);
  const profileRequest = useRef<AbortController | null>(null);
  const [state, setState] = useState<Omit<AuthState, "refresh" | "signOut">>({
    status: "loading",
    user: null,
    session: null,
    profile: null,
    error: null,
  });

  const resolve = useCallback(async (session: Session | null) => {
    const version = ++resolveVersion.current;
    profileRequest.current?.abort();
    profileRequest.current = null;
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
    const controller = new AbortController();
    profileRequest.current = controller;
    try {
      const response = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("We couldn't load your account.");
      const profile = (await response.json()) as Profile;
      if (version !== resolveVersion.current) return;
      setState((current) => ({ ...current, status: "authenticated", profile }));
    } catch (error) {
      if (version !== resolveVersion.current) return;
      setState((current) => ({
        ...current,
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "We couldn't load your account.",
      }));
    } finally {
      if (profileRequest.current === controller) profileRequest.current = null;
    }
  }, []);

  const refresh = async () => {
    setState((current) => ({ ...current, status: "loading", error: null }));
    const { data } = await supabase.auth.getSession();
    await resolve(data.session);
  };

  const signOut = async () => {
    signingOut.current = true;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setState((current) => ({ ...current, error: error.message }));
        return;
      }
      cancelAuthenticatedRequests();
      await resolve(null);
    } finally {
      signingOut.current = false;
    }
  };

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) void resolve(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!active || event === "INITIAL_SESSION") return;
        if (event === "SIGNED_OUT" && signingOut.current) return;
        void resolve(session);
      },
    );
    return () => {
      active = false;
      profileRequest.current?.abort();
      listener.subscription.unsubscribe();
    };
  }, [resolve]);

  return (
    <AuthContext.Provider value={{ ...state, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthState() {
  const state = useContext(AuthContext);
  if (!state) throw new Error("useAuthState must be used inside AuthProvider");
  return state;
}
