"use client";

/** Sign-in — spec §6.1. Deliberately minimal: username, password, done. */
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import { ErrorNote } from "@/components/ui";
import PigAvatar from "@/components/pigs/PigAvatar";

function SignInForm() {
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        await api.signup(username, password, displayName || username);
      } else {
        await api.login(username, password);
      }
      // The session cookie is set by the API; a full navigation lets the Next
      // middleware see it immediately.
      window.location.href = params.get("next") || "/";
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <div className="mb-5 flex flex-col items-center">
        <PigAvatar size={92} variant="full" placesLogged={18} config={{ color: "pink", hat: "chef" }} />
        <h1 className="mt-2 text-5xl tracking-tight">Oink</h1>
        <p className="mt-1 text-center font-display text-sm text-ink-soft">
          Where your friends actually eat.
        </p>
      </div>

      <form onSubmit={submit} className="card w-full space-y-3 p-4">
        <div className="flex gap-2">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`btn flex-1 text-sm ${
                mode === m ? "bg-coral text-white shadow-pop" : "bg-apricot"
              }`}
            >
              {m === "login" ? "Sign in" : "Join"}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="font-display text-sm font-bold">Username</span>
          <input
            className="field mt-1 bg-apricot"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            required
          />
        </label>

        {mode === "signup" && (
          <label className="block">
            <span className="font-display text-sm font-bold">Display name</span>
            <input
              className="field mt-1 bg-apricot"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="What friends call you"
            />
          </label>
        )}

        <label className="block">
          <span className="font-display text-sm font-bold">Password</span>
          <input
            className="field mt-1 bg-apricot"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />
        </label>

        {error && <ErrorNote message={error} />}

        <button type="submit" className="btn-primary w-full text-lg" disabled={busy}>
          {busy ? "…" : mode === "login" ? "Let me in" : "Make me a pig"}
        </button>

        <p className="text-center text-xs text-ink-soft">Stays signed in for 30 days.</p>
      </form>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
