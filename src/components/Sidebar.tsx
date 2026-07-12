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
  if (user) {
    const { data } = await supabase.from("profiles").select("username, avatar_url").eq("id", user.id).single();
    profile = data;
  }

  return (
    <Suspense fallback={<div className="h-full w-56 shrink-0 border-r border-violet-100 bg-white" />}>
      <SidebarNav isLoggedIn={Boolean(user)} username={profile?.username ?? null} avatarUrl={profile?.avatar_url ?? null} />
    </Suspense>
  );
}
