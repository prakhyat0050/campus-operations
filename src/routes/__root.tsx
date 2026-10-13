import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CampusProvider } from "@/lib/campus/store";
import { campusRoles, type CampusRole } from "@/lib/campus/access";
import { getCampusProfile, syncCampusProfile, type CampusProfile } from "@/lib/campus/profile";
import { isValidE164Phone, normalizeCampusPhone } from "@/lib/campus/phone";
import { CampusShell } from "@/components/campus/shell";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
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

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
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

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Almighty AI — Smart Campus Intelligence" },
      { name: "description", content: "Smarter Campus. Greener Tomorrow. Campus intelligence and sustainability." },
      { name: "author", content: "Almighty AI" },
      { property: "og:title", content: "Almighty AI — Smart Campus Intelligence" },
      { property: "og:description", content: "Smarter Campus. Greener Tomorrow." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;450;500;550;600;650;700&family=Instrument+Serif:ital@0;1&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function SignInScreen() {
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const onRequestOtp = async () => {
    const input = contact.trim();
    if (!input) {
      setMessage("Enter your email or phone number first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      if (mode === "email") {
        const { error } = await supabase.auth.signInWithOtp({
          email: input,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) throw error;
        setStep("verify");
        setMessage("Check your email for a sign-in link or a 6-digit code. Open the link in this browser, or enter the code below.");
      } else {
        const phone = normalizeCampusPhone(input);
        if (!isValidE164Phone(phone)) {
          setMessage("Enter a valid phone number with its country code, for example +91 98765 43210.");
          return;
        }

        const { error } = await supabase.auth.signInWithOtp({
          phone,
          options: { shouldCreateUser: true },
        });

        if (error) throw error;
        setStep("verify");
        setMessage("A 6-digit OTP has been sent to your phone. Enter it below to continue.");
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unable to send the OTP.";
      setMessage(
        mode === "phone" && /unsupported phone provider/i.test(text)
          ? "Phone OTP is not enabled for this campus backend yet. The project owner must enable Phone sign-in and configure an SMS provider in Supabase Auth before SMS codes can be sent."
          : text,
      );
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    const code = otp.trim();
    if (!code) {
      setMessage("Enter the 6-digit code sent to your device.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const payload = mode === "email"
        ? { email: contact.trim(), token: code, type: "email" as const }
        : { phone: normalizeCampusPhone(contact), token: code, type: "sms" as const };

      const { error } = await supabase.auth.verifyOtp(payload);
      if (error) throw error;
      setMessage("Login successful. Redirecting to your campus workspace…");
    } catch (error) {
      const text = error instanceof Error ? error.message : "The OTP could not be verified.";
      setMessage(text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Almighty AI</p>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">Campus access</h1>
        <p className="mt-2 text-sm text-muted-foreground">Use email or phone OTP to sign in to the real campus workspace.</p>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-md border border-border bg-background p-1">
          <button
            type="button"
            onClick={() => {
              setMode("email");
              setStep("request");
              setOtp("");
              setMessage("");
            }}
            className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${mode === "email" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Email OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("phone");
              setStep("request");
              setOtp("");
              setMessage("");
            }}
            className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${mode === "phone" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Phone OTP
          </button>
        </div>

        <form onSubmit={step === "request" ? (event) => { event.preventDefault(); void onRequestOtp(); } : onVerifyOtp} className="mt-6 space-y-4">
          <label className="block text-sm text-foreground">
            {mode === "email" ? "Email" : "Phone number"}
            <input
              type={mode === "email" ? "email" : "tel"}
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-0 placeholder:text-muted-foreground focus:border-ring"
              placeholder={mode === "email" ? "name@campus.edu" : "+91 98765 43210"}
              required
            />
          </label>
          {mode === "phone" ? (
            <p className="-mt-2 text-xs text-muted-foreground">
              Indian 10-digit numbers are accepted; add +country code for other countries.
            </p>
          ) : null}

          {step === "verify" ? (
            <label className="block text-sm text-foreground">
              Enter OTP
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-0 placeholder:text-muted-foreground focus:border-ring"
                placeholder="123456"
                required
                maxLength={6}
              />
            </label>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (step === "request" ? "Sending OTP…" : "Verifying…") : (step === "request" ? "Send OTP" : "Verify OTP")}
          </button>

          {step === "verify" ? (
            <button
              type="button"
              onClick={() => {
                setStep("request");
                setOtp("");
                setMessage("You can request a new code any time.");
              }}
              className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Change contact details
            </button>
          ) : null}
        </form>

        {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
      </div>
    </div>
  );
}

function ProfileSetupScreen({ onComplete }: { onComplete: (profile: CampusProfile) => void }) {
  const [role, setRole] = useState<CampusRole>("Student");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No active campus session was found.");

      const profile = await syncCampusProfile({
        role,
        displayName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? "Campus user",
        email: user.email ?? null,
      });

      if (!profile) throw new Error("Your campus profile could not be saved.");
      onComplete(profile);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Your role could not be saved.";
      setMessage(text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Almighty AI</p>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">Set your campus role</h1>
        <p className="mt-2 text-sm text-muted-foreground">Choose the role that matches your access level for this campus workspace.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm text-foreground">
            Role
            <select
              value={role}
              onChange={(event) => {
                const selectedRole = campusRoles.find((candidate) => candidate === event.target.value);
                if (selectedRole) setRole(selectedRole);
              }}
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-0 focus:border-ring"
            >
              {campusRoles.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Saving role…" : "Continue to campus"}
          </button>
        </form>

        {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
      </div>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [profile, setProfile] = useState<CampusProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const profileRequest = useRef(0);

  useEffect(() => {
    let active = true;
    let lastLoadedUserId: string | null | undefined;
    let pendingUserId: string | null | undefined;

    const syncAuthState = async (userId: string | null) => {
      if (!active || userId === pendingUserId) return;
      if (userId === lastLoadedUserId) {
        setReady(true);
        return;
      }
      const requestId = ++profileRequest.current;
      pendingUserId = userId;
      setReady(false);
      setAuthError(null);
      if (!userId) {
        lastLoadedUserId = null;
        pendingUserId = null;
        setAuthenticated(false);
        setNeedsProfileSetup(false);
        setProfile(null);
        setReady(true);
        return;
      }
      setAuthenticated(true);

      try {
        const loadedProfile = await getCampusProfile(userId);
        if (!active || requestId !== profileRequest.current) return;
        setProfile(loadedProfile);
        setNeedsProfileSetup(!loadedProfile);
        lastLoadedUserId = userId;
      } catch (error) {
        if (!active || requestId !== profileRequest.current) return;
        setAuthError(error instanceof Error ? error.message : "Your campus profile could not be loaded.");
      } finally {
        if (active && requestId === profileRequest.current) {
          pendingUserId = null;
          setReady(true);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "TOKEN_REFRESHED") void syncAuthState(session?.user.id ?? null);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) throw error;
      void syncAuthState(data.session?.user.id ?? null);
    }).catch((error: unknown) => {
      if (!active) return;
      setAuthError(error instanceof Error ? error.message : "Campus access could not be initialized.");
      setReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading campus access…
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold">Campus profile unavailable</h1>
          <p className="mt-3 text-sm text-muted-foreground">{authError}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Try again</button>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <SignInScreen />
      </QueryClientProvider>
    );
  }

  if (needsProfileSetup || !profile) {
    return (
      <QueryClientProvider client={queryClient}>
        <ProfileSetupScreen onComplete={(savedProfile) => { setProfile(savedProfile); setNeedsProfileSetup(false); setAuthenticated(true); }} />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <CampusProvider profile={profile} onProfileChange={setProfile}>
        <CampusShell><Outlet /></CampusShell>
        <Toaster theme="dark" position="bottom-right" />
      </CampusProvider>
    </QueryClientProvider>
  );
}
