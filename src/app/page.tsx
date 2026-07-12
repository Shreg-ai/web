import { createClient } from "@/lib/supabase/server";
import { HomeClient } from "./HomeClient";
import type { GraphRow } from "@/lib/supabase/dbTypes";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let graphs: Pick<GraphRow, "id" | "title" | "visibility">[] = [];
  if (user) {
    const { data } = await supabase
      .from("graphs")
      .select("id, title, visibility")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    graphs = data ?? [];
  }

  return <HomeClient isLoggedIn={Boolean(user)} graphs={graphs} />;
}
