import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileSettingsForm } from "@/components/ProfileSettingsForm";
import { CompleteProfileForm } from "@/components/CompleteProfileForm";
import type { ProfileRow } from "@/lib/supabase/dbTypes";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/profile");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  // Authenticated but no profile row -- signup partially failed at some point
  // (e.g. a username collision after the auth account was already created).
  // Let them pick a username and finish, instead of bouncing to login forever.
  if (!profile) return <CompleteProfileForm />;

  const row = profile as ProfileRow;

  return (
    <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto bg-gradient-to-b from-violet-50 to-white p-6">
      <h1 className="mb-1 text-xl font-medium text-violet-950">Your profile</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Public page:{" "}
        <Link href={`/u/${row.username}`} className="text-violet-600 hover:underline">
          @{row.username}
        </Link>
      </p>
      <ProfileSettingsForm profile={row} />
    </div>
  );
}
