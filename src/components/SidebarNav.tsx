"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { logout } from "@/app/auth/actions";
import { POST_CATEGORIES } from "@/lib/categories";
import { Avatar } from "@/components/Avatar";
import { Spinner } from "@/components/Spinner";

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

function MenuIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M5 5l10 10M15 5 5 15" strokeLinecap="round" />
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

function FollowsIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="8" cy="7" r="3" />
      <path d="M2 17c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
      <path d="M14 5l1.5 1.5L18 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PostsIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="4" width="14" height="12" rx="2" />
      <path d="M6 8h8M6 11h5" strokeLinecap="round" />
    </svg>
  );
}

function PlaygroundIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="5" cy="5" r="2" />
      <circle cx="15" cy="6" r="2" />
      <circle cx="9" cy="15" r="2" />
      <path d="M6.5 6 13.5 5.7M6 6.7 8 13.3M13.5 7.5 10 13" strokeLinecap="round" strokeDasharray="2 2" />
    </svg>
  );
}

function ConnectIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="5" cy="10" r="2.5" />
      <circle cx="15" cy="5" r="2.5" />
      <circle cx="15" cy="15" r="2.5" />
      <path d="M7.3 9 12.8 6M7.3 11l5.5 3" strokeLinecap="round" />
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
  const t = useTranslations("nav");
  const tCategories = useTranslations("categories");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);
  const [isExploring, startExploreTransition] = useTransition();

  // Collapsing to an icon rail is a desktop-only affordance (see the md:
  // prefixes below on every class it touches) -- on mobile the sidebar is an
  // overlay drawer that's either fully open or fully closed, so it always
  // shows full labels there regardless of this flag.
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem("sidebar-collapsed") === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }

  const MAX_CATEGORIES = 3;

  function categoriesFromUrl() {
    return new Set(pathname === "/feed" ? (searchParams.get("categories") ?? "").split(",").filter(Boolean) : []);
  }

  // Checkboxes only stage a pending selection -- navigation happens once,
  // when the user clicks "Explore", instead of on every single click.
  const [pendingCategories, setPendingCategories] = useState<Set<string>>(categoriesFromUrl);

  useEffect(() => {
    setPendingCategories(categoriesFromUrl());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  function togglePendingCategory(cat: string) {
    setPendingCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        if (next.size >= MAX_CATEGORIES) return prev;
        next.add(cat);
      }
      return next;
    });
  }

  function handleExplore() {
    const qs = pendingCategories.size > 0 ? `?categories=${Array.from(pendingCategories).join(",")}` : "";
    startExploreTransition(() => {
      router.push(`/feed${qs}`);
    });
  }

  const onFeeds = pathname === "/feed";
  const onFollows = pathname === "/follows";
  const onDashboard = pathname === "/dashboard";
  const onPlayground = pathname === "/playground";
  const onPosts = pathname === "/posts";
  const onProfile = pathname === "/profile";
  const onFriends = pathname === "/friends";
  const onConnect = pathname === "/connect";

  // Only hidden at the md breakpoint and below when collapsed -- on mobile
  // the drawer always shows full labels, per the note above.
  const labelClass = collapsed ? "md:hidden" : "";
  const justifyClass = collapsed ? "md:justify-center" : "";

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-20 flex h-12 items-center gap-2 border-b border-violet-100 bg-white px-3 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label={t("openMenu")}
          className="rounded-md p-1.5 text-neutral-500 hover:bg-violet-50 hover:text-violet-700"
        >
          <MenuIcon />
        </button>
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-violet-950">
          <Image src="/logo.png" alt="" width={28} height={20} priority />
          Shreg
        </Link>
      </div>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full w-64 shrink-0 flex-col border-r border-violet-100 bg-white transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:static md:z-auto md:translate-x-0 md:transition-[width] md:duration-150 ${collapsed ? "md:w-14" : "md:w-56"}`}
      >
        <div className={`flex items-center border-b border-violet-100 px-3 py-4 justify-between ${justifyClass}`}>
          <Link href="/" className={`flex items-center gap-2 text-xl font-bold text-violet-950 ${labelClass}`}>
            <Image src="/logo.png" alt="" width={34} height={24} priority />
            Shreg
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label={t("closeMenu")}
            className="rounded-md p-1 text-neutral-400 hover:bg-violet-50 hover:text-violet-700 md:hidden"
          >
            <CloseIcon />
          </button>
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
            className="hidden rounded-md p-1 text-neutral-400 hover:bg-violet-50 hover:text-violet-700 md:block"
          >
            <ChevronIcon collapsed={collapsed} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3 text-sm">
          <Link
            href="/feed"
            title={t("explore")}
            className={`flex items-center gap-2 rounded-md px-2 py-2 font-medium ${
              onFeeds ? "bg-violet-100 text-violet-800" : "text-neutral-600 hover:bg-violet-50 hover:text-violet-700"
            } ${justifyClass}`}
          >
            <FeedsIcon />
            <span className={labelClass}>{t("explore")}</span>
          </Link>

          <div className={`ml-2 flex flex-col gap-0.5 border-l border-violet-100 pl-3 ${labelClass}`}>
            <label
              className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs ${
                pendingCategories.size === 0 ? "bg-violet-100 font-medium text-violet-800" : "text-neutral-500 hover:bg-violet-50 hover:text-violet-700"
              }`}
            >
              <input
                type="checkbox"
                checked={pendingCategories.size === 0}
                onChange={() => setPendingCategories(new Set())}
                className="accent-violet-600"
              />
              {t("categoryAll")}
            </label>
            {POST_CATEGORIES.map((cat) => {
              const active = pendingCategories.has(cat);
              const atLimit = !active && pendingCategories.size >= MAX_CATEGORIES;
              return (
                <label
                  key={cat}
                  title={atLimit ? t("categoryLimit", { max: MAX_CATEGORIES }) : undefined}
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
                    onChange={() => togglePendingCategory(cat)}
                    className="accent-violet-600"
                  />
                  {tCategories(cat)}
                </label>
              );
            })}
            <button
              onClick={handleExplore}
              disabled={isExploring}
              className="mt-1 flex items-center justify-center gap-1.5 rounded-md bg-violet-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-70"
            >
              {isExploring && <Spinner className="h-3.5 w-3.5" />}
              {t("exploreButton")}
            </button>
          </div>

          <Link
            href="/connect"
            title={t("connect")}
            className={`mt-2 flex items-center gap-2 rounded-md px-2 py-2 font-medium ${
              onConnect ? "bg-violet-100 text-violet-800" : "text-neutral-600 hover:bg-violet-50 hover:text-violet-700"
            } ${justifyClass}`}
          >
            <ConnectIcon />
            <span className={labelClass}>{t("connect")}</span>
          </Link>

          {isLoggedIn && (
            <Link
              href="/follows"
              title={t("myFollows")}
              className={`mt-2 flex items-center gap-2 rounded-md px-2 py-2 font-medium ${
                onFollows ? "bg-violet-100 text-violet-800" : "text-neutral-600 hover:bg-violet-50 hover:text-violet-700"
              } ${justifyClass}`}
            >
              <FollowsIcon />
              <span className={labelClass}>{t("myFollows")}</span>
            </Link>
          )}

          {isLoggedIn && (
            <Link
              href="/dashboard"
              title={t("myGraphs")}
              className={`flex items-center gap-2 rounded-md px-2 py-2 font-medium ${
                onDashboard ? "bg-violet-100 text-violet-800" : "text-neutral-600 hover:bg-violet-50 hover:text-violet-700"
              } ${justifyClass}`}
            >
              <GraphsIcon />
              <span className={labelClass}>{t("myGraphs")}</span>
            </Link>
          )}

          {isLoggedIn && (
            <Link
              href="/playground"
              title={t("playground")}
              className={`flex items-center gap-2 rounded-md px-2 py-2 font-medium ${
                onPlayground ? "bg-violet-100 text-violet-800" : "text-neutral-600 hover:bg-violet-50 hover:text-violet-700"
              } ${justifyClass}`}
            >
              <PlaygroundIcon />
              <span className={labelClass}>{t("playground")}</span>
            </Link>
          )}

          {isLoggedIn && (
            <Link
              href="/posts"
              title={t("myPosts")}
              className={`flex items-center gap-2 rounded-md px-2 py-2 font-medium ${
                onPosts ? "bg-violet-100 text-violet-800" : "text-neutral-600 hover:bg-violet-50 hover:text-violet-700"
              } ${justifyClass}`}
            >
              <PostsIcon />
              <span className={labelClass}>{t("myPosts")}</span>
            </Link>
          )}

          {isLoggedIn && (
            <Link
              href="/friends"
              title={t("friends")}
              className={`relative flex items-center gap-2 rounded-md px-2 py-2 font-medium ${
                onFriends ? "bg-violet-100 text-violet-800" : "text-neutral-600 hover:bg-violet-50 hover:text-violet-700"
              } ${justifyClass}`}
            >
              <FriendsIcon />
              <span className={`flex flex-1 items-center justify-between ${labelClass}`}>
                {t("friends")}
                {pendingFriendRequests > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {pendingFriendRequests}
                  </span>
                )}
              </span>
              {collapsed && pendingFriendRequests > 0 && (
                <span className="absolute top-1 right-2 hidden h-2 w-2 rounded-full bg-red-500 md:block" />
              )}
            </Link>
          )}

          {isLoggedIn && (
            <Link
              href="/profile"
              title={t("profile")}
              className={`flex items-center gap-2 rounded-md px-2 py-2 font-medium ${
                onProfile ? "bg-violet-100 text-violet-800" : "text-neutral-600 hover:bg-violet-50 hover:text-violet-700"
              } ${justifyClass}`}
            >
              <Avatar url={avatarUrl} username={username ?? "?"} size={18} />
              <span className={labelClass}>{t("profile")}</span>
            </Link>
          )}
        </nav>

        <div className="border-t border-violet-100 p-2 text-sm">
          {isLoggedIn ? (
            <form action={logout}>
              <button
                type="submit"
                title={t("logOut")}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-neutral-500 hover:bg-violet-50 hover:text-violet-700 ${justifyClass}`}
              >
                <LogoutIcon />
                <span className={labelClass}>{t("logOut")}</span>
              </button>
            </form>
          ) : (
            <>
              <div className={`flex flex-col gap-2 px-1 ${labelClass}`}>
                <Link href="/login" className="text-neutral-600 hover:text-violet-700">
                  {t("logIn")}
                </Link>
                <Link href="/signup" className="rounded-md bg-violet-600 px-3 py-1.5 text-center text-white hover:bg-violet-700">
                  {t("signUp")}
                </Link>
              </div>
              {collapsed && (
                <Link
                  href="/login"
                  title={t("logIn")}
                  className="hidden justify-center rounded-md px-2 py-2 text-neutral-500 hover:bg-violet-50 hover:text-violet-700 md:flex"
                >
                  <LogoutIcon />
                </Link>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
