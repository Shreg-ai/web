import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/SidebarNav";

export async function Sidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <Suspense fallback={<div className="h-full w-56 shrink-0 border-r border-violet-100 bg-white" />}>
      <SidebarNav isLoggedIn={Boolean(user)} />
    </Suspense>
  );
}
