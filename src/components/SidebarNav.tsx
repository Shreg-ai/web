"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { logout } from "@/app/auth/actions";
import { POST_CATEGORIES } from "@/lib/categories";
import { Avatar } from "@/components/Avatar";

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12.5 4.5 7 10l5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FeedsIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M3 5h14M3 10h14M3 15h8" strokeLinecap="round" />
    </svg>
  );
}

function GraphsIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="5" cy="6" r="2" />
      <circle cx="15" cy="6" r="2" />
      <circle cx="10" cy="15" r="2" />
      <path d="M6.7 7.3 8.5 13M13.3 7.3 11.5 13M7 6h6" strokeLinecap="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M8 4H4v12h4M13 6l4 4-4 4M17 10H8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FriendsIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="7" cy="7" r="3" />
      <path d="M2 17c0-2.8 2.2-5 5-5s5 2.2 5 5" strokeLinecap="round" />
      <circle cx="15" cy="6" r="2.2" />
      <path d="M13 9.3c1.9.4 3.3 2 3.3 4" strokeLinecap="round" />
    </svg>
  );
}

export function SidebarNav({
  isLoggedIn,
  username,
  avatarUrl,
  pendingFriendRequests,
}: {
  isLoggedIn: boolean;
  username: string | null;
  avatarUrl: string | null;
  pendingFriendRequests: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem("sidebar-collapsed") === "true") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }

  const MAX_CATEGORIES = 3;

  const activeCategories = new Set(
    pathname === "/feed" ? (searchParams.get("categories") ?? "").split(",").filter(Boolean) : []
  );

  function toggleCategory(cat: string) {
    const next = new Set(activeCategories);
    if (next.has(cat)) {
      next.delete(cat);
    } else {
      if (next.size >= MAX_CATEGORIES) return;
      next.add(cat);
    }
    const qs = next.size > 0 ? `?categories=${Array.from(next).join(",")}` : "";
    router.push(`/feed${qs}`);
  }

  const onFeeds = pathname === "/feed";
  const onDashboard = pathname === "/dashboard";
  const onProfile = pathname === "/profile";
  const onFriends = pathname === "/friends";

  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-r border-violet-100 bg-white transition-[width] duration-150 ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      <div className={`flex items-center border-b border-violet-100 px-3 py-4 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-violet-950">
            <Image src="/logo.png" alt="" width={34} height={24} priority />
            Shreg
          </Link>
        )}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="rounded-md p-1 text-neutral-400 hover:bg-violet-50 hover:text-violet-700"
        >
          <ChevronIcon collapsed={collapsed} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3 text-sm">
        <Link
          href="/feed"
          title="Explore"
          className={`flex items-center gap-2 rounded-md px-2 py-2 font-medium ${
            onFeeds ? "bg-violet-100 text-violet-800" : "text-neutral-600 hover:bg-violet-50 hover:text-violet-700"
          } ${collapsed ? "justify-center" : ""}`}
        >
          <FeedsIcon />
          {!collapsed && "Explore"}
        </Link>

        {!collapsed && (
          <div className="ml-2 flex flex-col gap-0.5 border-l border-violet-100 pl-3">
            <label
              className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs ${
                activeCategories.size === 0 ? "bg-violet-100 font-medium text-violet-800" : "text-neutral-500 hover:bg-violet-50 hover:text-violet-700"
              }`}
            >
              <input
                type="checkbox"
                checked={activeCategories.size === 0}
                onChange={() => router.push("/feed")}
                className="accent-violet-600"
              />
              All
            </label>
            {POST_CATEGORIES.map((cat) => {
              const active = activeCategories.has(cat);
              const atLimit = !active && activeCategories.size >= MAX_CATEGORIES;
              return (
                <label
                  key={cat}
                  title={atLimit ? `Up to ${MAX_CATEGORIES} categories at a time` : undefined}
                  className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs ${
                    active
                      ? "cursor-pointer bg-violet-100 font-medium text-violet-800"
                      : atLimit
                        ? "cursor-not-allowed text-neutral-300"
                        : "cursor-pointer text-neutral-500 hover:bg-violet-50 hover:text-violet-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    disabled={atLimit}
                    onChange={() => toggleCategory(cat)}
                    className="accent-violet-600"
                  />
                  {cat}
                </label>
              );
            })}
          </div>
        )}

        {isLoggedIn && (
          <Link
            href="/dashboard"
            title="My graphs"
            className={`mt-2 flex items-center gap-2 rounded-md px-2 py-2 font-medium ${
              onDashboard ? "bg-violet-100 text-violet-800" : "text-neutral-600 hover:bg-violet-50 hover:text-violet-700"
            } ${collapsed ? "justify-center" : ""}`}
          >
            <GraphsIcon />
            {!collapsed && "My graphs"}
          </Link>
        )}

        {isLoggedIn && (
          <Link
            href="/friends"
            title="Friends"
            className={`relative flex items-center gap-2 rounded-md px-2 py-2 font-medium ${
              onFriends ? "bg-violet-100 text-violet-800" : "text-neutral-600 hover:bg-violet-50 hover:text-violet-700"
            } ${collapsed ? "justify-center" : ""}`}
          >
            <FriendsIcon />
            {!collapsed && (
              <span className="flex flex-1 items-center justify-between">
                Friends
                {pendingFriendRequests > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {pendingFriendRequests}
                  </span>
                )}
              </span>
            )}
            {collapsed && pendingFriendRequests > 0 && <span className="absolute top-1 right-2 h-2 w-2 rounded-full bg-red-500" />}
          </Link>
        )}

        {isLoggedIn && (
          <Link
            href="/profile"
            title="Profile"
            className={`flex items-center gap-2 rounded-md px-2 py-2 font-medium ${
              onProfile ? "bg-violet-100 text-violet-800" : "text-neutral-600 hover:bg-violet-50 hover:text-violet-700"
            } ${collapsed ? "justify-center" : ""}`}
          >
            <Avatar url={avatarUrl} username={username ?? "?"} size={18} />
            {!collapsed && "Profile"}
          </Link>
        )}
      </nav>

      <div className="border-t border-violet-100 p-2 text-sm">
        {isLoggedIn ? (
          <form action={logout}>
            <button
              type="submit"
              title="Log out"
              className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-neutral-500 hover:bg-violet-50 hover:text-violet-700 ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <LogoutIcon />
              {!collapsed && "Log out"}
            </button>
          </form>
        ) : collapsed ? (
          <Link href="/login" title="Log in" className="flex justify-center rounded-md px-2 py-2 text-neutral-500 hover:bg-violet-50 hover:text-violet-700">
            <LogoutIcon />
          </Link>
        ) : (
          <div className="flex flex-col gap-2 px-1">
            <Link href="/login" className="text-neutral-600 hover:text-violet-700">
              Log in
            </Link>
            <Link href="/signup" className="rounded-md bg-violet-600 px-3 py-1.5 text-center text-white hover:bg-violet-700">
              Sign up
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
