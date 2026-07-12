import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import type { ProfileRow } from "@/lib/supabase/dbTypes";

export function UserList({ users, emptyMessage }: { users: ProfileRow[]; emptyMessage: string }) {
  if (users.length === 0) {
    return <p className="text-sm text-neutral-500">{emptyMessage}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {users.map((u) => (
        <li key={u.id}>
          <Link
            href={`/u/${u.username}`}
            className="flex items-center gap-3 rounded-lg border border-violet-100 bg-white p-3 shadow-sm hover:bg-violet-50/50"
          >
            <Avatar url={u.avatar_url} username={u.username} size={40} />
            <div>
              <p className="text-sm font-medium text-violet-950">@{u.username}</p>
              {u.bio && <p className="line-clamp-1 text-xs text-neutral-500">{u.bio}</p>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
