import type { Metadata, Viewport } from "next";
import { Outfit, Nunito_Sans } from "next/font/google";
import "./globals.css";
import RouteTransition from "@/components/RouteTransition";
import SideNav from "@/components/SideNav";

// Outfit: geometric, even, tight — the "funky but designed" face. Used for the
// wordmark, headings and place names only. Body copy stays on a plain sans,
// because a tight display face is unreadable at review-text sizes.
const display = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const body = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Oink",
  description: "Restaurant, bar and cafe recommendations between friends.",
  // Makes "add to home screen" produce an actual app: own icon, own name, and
  // no browser chrome. Without these it installs as a bookmark with a
  // screenshot for an icon, which is what stops people bothering.
  manifest: "/manifest.webmanifest",
  applicationName: "Oink",
  appleWebApp: { capable: true, title: "Oink", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    // iOS ignores the manifest's icons entirely and uses this. 180 is the size
    // it actually asks for, and it lives at the conventional path as well, so
    // it's still found if the tag is ever missed.
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

// Mobile-first (spec §6) — lock the viewport to device width.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F4EEDC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        {/* Phone-width column below `lg`; above it the nav moves to the left
            edge and the column becomes a proper content area. The 480px cap is
            the whole of the phone layout, so it's lifted rather than widened —
            each screen decides its own measure from there, because a feed of
            cards and a page of prose don't want the same one. */}
        <div className="lg:flex">
          <SideNav />
          <div className="mx-auto min-h-screen w-full max-w-[480px] bg-oat lg:max-w-none lg:flex-1">
            <RouteTransition>{children}</RouteTransition>
          </div>
        </div>
      </body>
    </html>
  );
}
