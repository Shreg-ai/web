import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserList } from "@/components/UserList";
import { FriendRequestRow } from "@/components/FriendRequestRow";
import type { FriendRequestRow as FriendRequestRowType, ProfileRow } from "@/lib/supabase/dbTypes";

export default async function FriendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/friends");

  const { data: requests } = await supabase
    .from("friend_requests")
    .select("*")
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

  const rows = (requests ?? []) as FriendRequestRowType[];
  const incoming = rows.filter((r) => r.status === "pending" && r.recipient_id === user.id);
  const outgoing = rows.filter((r) => r.status === "pending" && r.requester_id === user.id);
  const accepted = rows.filter((r) => r.status === "accepted");

  const otherIds = [
    ...incoming.map((r) => r.requester_id),
    ...outgoing.map((r) => r.recipient_id),
    ...accepted.map((r) => (r.requester_id === user.id ? r.recipient_id : r.requester_id)),
  ];
  const uniqueIds = [...new Set(otherIds)];

  const { data: profiles } = uniqueIds.length ? await supabase.from("profiles").select("*").in("id", uniqueIds) : { data: [] };
  const profileById = new Map((profiles as ProfileRow[] | null)?.map((p) => [p.id, p]) ?? []);

  return (
    <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto bg-gradient-to-b from-violet-50 to-white p-6">
      <h1 className="mb-6 text-xl font-medium text-violet-950">Friends</h1>

      {incoming.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-medium tracking-wide text-neutral-400 uppercase">Friend requests</h2>
          <ul className="flex flex-col gap-2">
            {incoming.map((r) => {
              const profile = profileById.get(r.requester_id);
              if (!profile) return null;
              return <FriendRequestRow key={r.id} requestId={r.id} profile={profile} direction="incoming" />;
            })}
          </ul>
        </div>
      )}

      {outgoing.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-medium tracking-wide text-neutral-400 uppercase">Sent requests</h2>
          <ul className="flex flex-col gap-2">
            {outgoing.map((r) => {
              const profile = profileById.get(r.recipient_id);
              if (!profile) return null;
              return <FriendRequestRow key={r.id} requestId={r.id} profile={profile} direction="outgoing" />;
            })}
          </ul>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-medium tracking-wide text-neutral-400 uppercase">Your friends</h2>
        <UserList
          users={accepted
            .map((r) => profileById.get(r.requester_id === user.id ? r.recipient_id : r.requester_id))
            .filter((p): p is ProfileRow => Boolean(p))}
          emptyMessage="No friends yet. Visit someone's profile to send a request."
        />
      </div>
    </div>
  );
}
