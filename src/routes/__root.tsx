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
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CampusProvider } from "@/lib/campus/store";
import { campusRoles, type CampusRole } from "@/lib/campus/access";
import type { CampusProfile } from "@/lib/campus/profile";
import { endCampusDemo, getCampusDemoProfile, isCampusDemoMode, startCampusDemo } from "@/lib/campus/demo";
import { CampusShell } from "@/components/campus/shell";
import { Toaster } from "@/components/ui/sonner";

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

function SignInScreen({ onDemoLogin }: { onDemoLogin: (role: CampusRole) => void }) {
  const [demoRole, setDemoRole] = useState<CampusRole>("Super Admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Almighty AI</p>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">Campus demo workspace</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Choose a role to explore the campus workspace. No phone number, email, or OTP is needed.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          This is a local demo. Changes stay in this browser and are not saved to the campus backend.
        </p>
        <label className="mt-6 block text-sm text-foreground">
          Demo role
          <select
            aria-label="Demo role"
            value={demoRole}
            onChange={(event) => {
              const nextRole = campusRoles.find((candidate) => candidate === event.target.value);
              if (nextRole) setDemoRole(nextRole);
            }}
            className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {campusRoles.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
        </label>
        <button
          type="button"
          onClick={() => onDemoLogin(demoRole)}
          className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Continue to demo workspace
        </button>
      </div>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<CampusProfile | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (isCampusDemoMode()) {
        const demoProfile = getCampusDemoProfile();
        if (demoProfile) {
          setProfile(demoProfile);
        } else {
          endCampusDemo();
        }
      }
    } catch (error) {
      setDemoError(error instanceof Error ? error.message : "The local campus demo could not be loaded.");
    } finally {
      setReady(true);
    }
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading campus workspace…
      </div>
    );
  }

  if (demoError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold">Demo workspace unavailable</h1>
          <p className="mt-3 text-sm text-muted-foreground">{demoError}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Try again</button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <QueryClientProvider client={queryClient}>
        <SignInScreen onDemoLogin={(role) => {
          try {
            const demoProfile = startCampusDemo(role);
            queryClient.clear();
            setProfile(demoProfile);
          } catch (error) {
            setDemoError(error instanceof Error ? error.message : "The local campus demo could not be started.");
          }
        }} />
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