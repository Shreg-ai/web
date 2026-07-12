"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/Avatar";
import { acceptFriendRequest, removeFriendConnection } from "@/app/u/[username]/actions";
import type { ProfileRow } from "@/lib/supabase/dbTypes";

export function FriendRequestRow({
  requestId,
  profile,
  direction,
}: {
  requestId: string;
  profile: ProfileRow;
  direction: "incoming" | "outgoing";
}) {
  const t = useTranslations("friendActions");
  const tCommon = useTranslations("common");
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleAccept() {
    setBusy(true);
    const result = await acceptFriendRequest(requestId);
    setBusy(false);
    if (!result.error) setHidden(true);
  }

  async function handleRemove() {
    setBusy(true);
    const result = await removeFriendConnection(requestId);
    setBusy(false);
    if (!result.error) setHidden(true);
  }

  if (hidden) return null;

  return (
    <li className="flex items-center gap-3 rounded-lg border border-violet-100 bg-white p-3 shadow-sm">
      <Link href={`/u/${profile.username}`} className="flex flex-1 items-center gap-3">
        <Avatar url={profile.avatar_url} username={profile.username} size={40} />
        <p className="text-sm font-medium text-violet-950">@{profile.username}</p>
      </Link>
      {direction === "incoming" ? (
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            disabled={busy}
            className="rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {t("accept")}
          </button>
          <button
            onClick={handleRemove}
            disabled={busy}
            className="rounded-md border border-violet-200 px-3 py-1.5 text-sm text-neutral-600 hover:bg-violet-50 disabled:opacity-50"
          >
            {t("decline")}
          </button>
        </div>
      ) : (
        <button
          onClick={handleRemove}
          disabled={busy}
          className="rounded-md border border-violet-200 px-3 py-1.5 text-sm text-neutral-600 hover:bg-violet-50 disabled:opacity-50"
        >
          {tCommon("cancel")}
        </button>
      )}
    </li>
  );
}
