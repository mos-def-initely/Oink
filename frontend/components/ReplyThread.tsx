"use client";

/**
 * The conversation under someone's review — spec §6.4.
 *
 * Lives on the place page rather than the feed. The feed shows only who is
 * talking and how many, because reply bodies there would grow cards without
 * limit and undo the work of keeping that page quiet.
 *
 * Flat, oldest first. Twenty-odd friends arguing about one restaurant don't
 * need a tree, and threading doubles the layout work for nothing.
 *
 * Only replies to **reviews** exist. An oink carries no text to reply to, and
 * allowing it would turn every row in the feed into a potential thread.
 */
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { PlaceDetail, Recommendation, User } from "@/lib/types";
import PigAvatar from "@/components/pigs/PigAvatar";
import { timeAgo } from "@/components/ui";

export default function ReplyThread({
  placeId,
  rec,
  viewer,
  onChange,
}: {
  placeId: string;
  rec: Recommendation;
  viewer: User | null;
  onChange: (place: PlaceDetail) => void;
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await api.addReply(placeId, rec.id, text));
      setBody("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't send");
    } finally {
      setBusy(false);
    }
  }

  async function remove(replyId: string) {
    setBusy(true);
    try {
      onChange(await api.deleteReply(placeId, rec.id, replyId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-1">
      {rec.replies.length > 0 && <div className="rule-dashed mb-2" />}

      <ul className="space-y-2">
        {rec.replies.map((reply) => (
          <li key={reply.id} className="flex items-start gap-2">
            <Link href={`/profile/${reply.user.username}`} className="mt-0.5 shrink-0">
              <PigAvatar
                config={reply.user.pig_avatar_config}
                placesLogged={reply.user.places_logged}
                lastLoggedAt={reply.user.last_logged_at}
                size={24}
                variant="face"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug">
                <Link
                  href={`/profile/${reply.user.username}`}
                  className="font-display font-bold"
                >
                  {reply.user.display_name}
                </Link>{" "}
                {reply.body}
              </p>
              <p className="micro mt-0.5">{timeAgo(reply.created_at)}</p>
            </div>
            {/* Only the author can delete their own reply — not the review's
                author, who could otherwise quietly clear disagreement off
                their own card. */}
            {viewer?.id === reply.user.id && (
              <button
                onClick={() => remove(reply.id)}
                disabled={busy}
                className="micro shrink-0 disabled:opacity-50"
                aria-label="delete your reply"
              >
                delete
              </button>
            )}
          </li>
        ))}
      </ul>

      {viewer && (
        <div className="mt-2 flex items-center gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder="reply…"
            maxLength={600}
            className="field flex-1 !py-1.5 text-sm"
            aria-label={`reply to ${rec.user.display_name}`}
          />
          <button
            onClick={send}
            disabled={busy || !body.trim()}
            className="btn-primary shrink-0 text-xs disabled:opacity-40"
          >
            {busy ? "…" : "send"}
          </button>
        </div>
      )}

      {error && <p className="mt-1 text-xs font-bold text-rust">{error}</p>}
    </div>
  );
}
