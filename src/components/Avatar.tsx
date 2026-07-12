interface AvatarProps {
  url?: string | null;
  username: string;
  size?: number;
}

export function Avatar({ url, username, size = 32 }: AvatarProps) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- avatar URLs come from Supabase Storage, not a known set of domains
    return (
      <img
        src={url}
        alt={username}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  const initial = username.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-violet-200 font-medium text-violet-800"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {initial}
    </div>
  );
}
