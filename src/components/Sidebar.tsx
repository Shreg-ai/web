import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/SidebarNav";
import type { ProfileRow } from "@/lib/supabase/dbTypes";

export async function Sidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Pick<ProfileRow, "username" | "avatar_url"> | null = null;
  let pendingFriendRequests = 0;
  if (user) {
    const [{ data }, { count }] = await Promise.all([
      supabase.from("profiles").select("username, avatar_url").eq("id", user.id).single(),
      supabase.from("friend_requests").select("*", { count: "exact", head: true }).eq("recipient_id", user.id).eq("status", "pending"),
    ]);
    profile = data;
    pendingFriendRequests = count ?? 0;
  }

  return (
    <Suspense fallback={<div className="hidden h-full w-56 shrink-0 border-r border-violet-100 bg-white md:block" />}>
      <SidebarNav
        isLoggedIn={Boolean(user)}
        username={profile?.username ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        pendingFriendRequests={pendingFriendRequests}
      />
    </Suspense>
  );
}
