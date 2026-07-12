"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FriendRequestRow } from "@/lib/supabase/dbTypes";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function toggleFollow(targetUserId: string, username: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You must be logged in." };
  if (user.id === targetUserId) return { error: "You can't follow yourself." };

  const { data: existing } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("followee_id", targetUserId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("follows").delete().eq("follower_id", user.id).eq("followee_id", targetUserId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("follows").insert({ follower_id: user.id, followee_id: targetUserId });
    if (error) return { error: error.message };
  }

  revalidatePath(`/u/${username}`);
  return {};
}

/**
 * Sends a friend request. If the target already sent *us* a pending request,
 * this accepts theirs instead of creating a redundant reverse row -- matching
 * how Facebook handles "add friend" on someone who already requested you.
 */
export async function sendFriendRequest(targetUserId: string, username: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You must be logged in." };
  if (user.id === targetUserId) return { error: "You can't friend yourself." };

  const { data: reverse } = await supabase
    .from("friend_requests")
    .select("*")
    .eq("requester_id", targetUserId)
    .eq("recipient_id", user.id)
    .maybeSingle();

  if (reverse) {
    const row = reverse as FriendRequestRow;
    if (row.status === "pending") {
      const { error } = await supabase
        .from("friend_requests")
        .update({ status: "accepted", responded_at: new Date().toISOString() })
        .eq("id", row.id);
      if (error) return { error: error.message };
      revalidatePath(`/u/${username}`);
      revalidatePath("/friends");
      return {};
    }
    return {};
  }

  const { error } = await supabase.from("friend_requests").insert({ requester_id: user.id, recipient_id: targetUserId });
  if (error) return { error: error.message };

  revalidatePath(`/u/${username}`);
  revalidatePath("/friends");
  return {};
}

export async function acceptFriendRequest(requestId: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You must be logged in." };

  const { error } = await supabase
    .from("friend_requests")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("recipient_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/friends");
  return {};
}

/** Declines a pending request, cancels one you sent, or removes an existing friendship -- all are just deleting the row. */
export async function removeFriendConnection(requestId: string, username?: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You must be logged in." };

  const { error } = await supabase
    .from("friend_requests")
    .delete()
    .eq("id", requestId)
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);
  if (error) return { error: error.message };

  revalidatePath("/friends");
  if (username) revalidatePath(`/u/${username}`);
  return {};
}
