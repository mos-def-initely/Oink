import type { Metadata, Viewport } from "next";
import { Nunito, Nunito_Sans } from "next/font/google";
import "./globals.css";

// Rounded but restrained; the personality comes from colour, not a novelty face.
const display = Nunito({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
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
};

// Mobile-first (spec §6) — lock the viewport to device width.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FFE8D6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        {/* Phone-width column, centred on desktop rather than stretched (spec §6) */}
        <div className="mx-auto min-h-screen w-full max-w-[480px] bg-apricot">{children}</div>
      </body>
    </html>
  );
}
