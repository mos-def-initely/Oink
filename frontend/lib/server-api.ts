import { cookies } from "next/headers";

/**
 * Server-side reads, so a screen can arrive with its data already in the HTML.
 *
 * Client components fetch after hydration, which stacks three waits in a row:
 * the document, then the JavaScript, then the API call. Doing the first read
 * here collapses that to one.
 *
 * Deliberately best-effort: any failure returns null and the client component
 * falls back to fetching on mount exactly as before. A server-render problem
 * should cost a spinner, never the screen.
 */
function apiBase(): string {
  const explicit = process.env.INTERNAL_API_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.PUBLIC_BASE_URL) {
    return `${process.env.PUBLIC_BASE_URL.replace(/\/$/, "")}/api/v1`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/api/v1`;
  return "http://localhost:8000/api/v1";
}

export async function serverFetch<T>(path: string): Promise<T | null> {
  try {
    const jar = await cookies();
    const token = jar.get("oink_session")?.value;
    // No session means middleware is about to redirect to /sign-in anyway.
    if (!token) return null;

    const res = await fetch(`${apiBase()}${path}`, {
      // The API takes a Bearer token as well as the cookie, which saves
      // forwarding a cookie header across services.
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
