"use client";

/**
 * How to put Oink on the home screen.
 *
 * The steps differ per platform and there's no way to do it for someone: iOS
 * only offers it from Safari's share sheet, and Chrome hides it in the menu.
 * So this tells them where to look rather than pretending to install anything.
 */
import { Sheet } from "@/components/ui";
import type { Platform } from "@/lib/homescreen";

export function InstallSteps({ os }: { os: Platform }) {
  if (os === "ios") {
    return (
      <ol className="space-y-2 text-sm text-ink-soft">
        <li>
          <strong className="text-ink">1.</strong> Tap the share button at the bottom of Safari —
          the square with an arrow coming out of it.
        </li>
        <li>
          <strong className="text-ink">2.</strong> Scroll down and tap{" "}
          <strong className="text-ink">Add to Home Screen</strong>.
        </li>
        <li>
          <strong className="text-ink">3.</strong> Tap <strong className="text-ink">Add</strong>. It
          lands next to your other apps.
        </li>
      </ol>
    );
  }
  if (os === "android") {
    return (
      <ol className="space-y-2 text-sm text-ink-soft">
        <li>
          <strong className="text-ink">1.</strong> Tap the three dots at the top right of Chrome.
        </li>
        <li>
          <strong className="text-ink">2.</strong> Tap{" "}
          <strong className="text-ink">Add to Home screen</strong> — or{" "}
          <strong className="text-ink">Install app</strong> if it offers that.
        </li>
        <li>
          <strong className="text-ink">3.</strong> Confirm, and it lands with your other apps.
        </li>
      </ol>
    );
  }
  return (
    <ol className="space-y-2 text-sm text-ink-soft">
      <li>
        <strong className="text-ink">1.</strong> Open Oink on your phone — that&apos;s where it&apos;s
        worth having.
      </li>
      <li>
        <strong className="text-ink">2.</strong> On iPhone use Safari&apos;s share button; on Android
        use Chrome&apos;s menu.
      </li>
      <li>
        <strong className="text-ink">3.</strong> Choose{" "}
        <strong className="text-ink">Add to Home Screen</strong>.
      </li>
    </ol>
  );
}

export default function AddToHomeScreen({
  open,
  os,
  onClose,
}: {
  open: boolean;
  os: Platform;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="put oink on your home screen">
      <div className="space-y-4 pb-4">
        <p className="text-sm text-ink-soft">
          Oink works like an app once it&apos;s on your home screen — its own icon, no browser bar,
          and it opens straight to the feed. Takes about ten seconds.
        </p>
        <InstallSteps os={os} />
        <p className="text-xs text-ink-soft">
          You can find these again any time under the <strong className="text-ink">i</strong> on your
          profile.
        </p>
        <button onClick={onClose} className="btn-primary w-full text-lg">
          got it
        </button>
      </div>
    </Sheet>
  );
}
