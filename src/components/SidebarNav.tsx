"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { logout } from "@/app/auth/actions";
import { POST_CATEGORIES } from "@/lib/categories";

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

export function SidebarNav({ isLoggedIn }: { isLoggedIn: boolean }) {
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

  const activeCategories = new Set(
    pathname === "/feed" ? (searchParams.get("categories") ?? "").split(",").filter(Boolean) : []
  );

  function toggleCategory(cat: string) {
    const next = new Set(activeCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    const qs = next.size > 0 ? `?categories=${Array.from(next).join(",")}` : "";
    router.push(`/feed${qs}`);
  }

  const onFeeds = pathname === "/feed";
  const onDashboard = pathname === "/dashboard";

  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-r border-violet-100 bg-white transition-[width] duration-150 ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      <div className={`flex items-center border-b border-violet-100 px-3 py-3 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <Link href="/" className="text-sm font-semibold text-violet-950">
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
          title="Feeds"
          className={`flex items-center gap-2 rounded-md px-2 py-2 font-medium ${
            onFeeds ? "bg-violet-100 text-violet-800" : "text-neutral-600 hover:bg-violet-50 hover:text-violet-700"
          } ${collapsed ? "justify-center" : ""}`}
        >
          <FeedsIcon />
          {!collapsed && "Feeds"}
        </Link>

        {!collapsed && (
          <div className="ml-2 flex flex-col gap-0.5 border-l border-violet-100 pl-3">
            {POST_CATEGORIES.map((cat) => {
              const active = activeCategories.has(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`rounded-md px-2 py-1 text-left text-xs ${
                    active ? "bg-violet-100 font-medium text-violet-800" : "text-neutral-500 hover:bg-violet-50 hover:text-violet-700"
                  }`}
                >
                  {cat}
                </button>
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
