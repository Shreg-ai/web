"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createPost } from "@/app/g/[id]/actions";
import { POST_CATEGORIES, type PostCategory } from "@/lib/categories";
import { Spinner } from "@/components/Spinner";

interface PostComposerProps {
  graphId: string;
  graphIsPublic: boolean;
}

export function PostComposer({ graphId, graphIsPublic }: PostComposerProps) {
  const t = useTranslations("postComposer");
  const tCategories = useTranslations("categories");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PostCategory>(POST_CATEGORIES[0]);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);

  async function handlePost() {
    setPosting(true);
    setError(null);
    const result = await createPost(graphId, content, category);
    setPosting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setContent("");
    setPosted(true);
    setTimeout(() => setPosted(false), 2500);
  }

  return (
    <div className="border-t border-violet-100 p-5">
      <h2 className="mb-2 text-sm font-medium text-violet-950">{t("heading")}</h2>
      <p className="mb-3 text-xs text-neutral-500">
        {t("writePrompt")} {!graphIsPublic && t("willBePublic")}
      </p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder={t("contentPlaceholder")}
        className="w-full rounded-md border border-violet-200 px-3 py-2 text-sm focus:border-violet-400 focus:ring-1 focus:ring-violet-400 focus:outline-none"
      />
      <div className="mt-2 flex items-center gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as PostCategory)}
          className="rounded-md border border-violet-200 px-2 py-2 text-sm focus:border-violet-400 focus:ring-1 focus:ring-violet-400 focus:outline-none"
        >
          {POST_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {tCategories(cat)}
            </option>
          ))}
        </select>
        <button
          onClick={handlePost}
          disabled={posting || !content.trim()}
          className="flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {posting && <Spinner className="h-4 w-4" />}
          {posting ? t("posting") : t("post")}
        </button>
        {posted && <span className="text-sm text-green-700">{t("posted")}</span>}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
