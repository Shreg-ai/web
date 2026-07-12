import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "./locales";

// No URL-based locale routing -- language is an account-level preference
// (set on the profile page), not something that should fork every route into
// /en/..., /ja/..., etc. The cookie is the single source of truth on every
// request; login syncs it from the user's saved preference (see
// auth/actions.ts) and the profile page's language switcher updates both.
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
