"use client";

import { useState } from "react";
import { toggleFollow } from "@/app/u/[username]/actions";

export function FollowButton({
  targetUserId,
  username,
  initialIsFollowing,
}: {
  targetUserId: string;
  username: string;
  initialIsFollowing: boolean;
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    const prev = isFollowing;
    setIsFollowing(!prev);
    const result = await toggleFollow(targetUserId, username);
    setBusy(false);
    if (result.error) setIsFollowing(prev);
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className={`rounded-md px-4 py-1.5 text-sm font-medium disabled:opacity-50 ${
        isFollowing
          ? "border border-violet-200 text-violet-700 hover:bg-violet-50"
          : "bg-violet-600 text-white hover:bg-violet-700"
      }`}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
