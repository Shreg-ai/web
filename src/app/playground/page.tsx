import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listImportableGraphs } from "./actions";
import { PlaygroundView } from "@/components/Playground/PlaygroundView";

export default async function PlaygroundPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/playground");

  const { graphs } = await listImportableGraphs();

  return <PlaygroundView importableGraphs={graphs ?? []} />;
}
