"use client";

import { useState } from "react";
import { createPost } from "@/app/g/[id]/actions";

interface PostComposerProps {
  graphId: string;
  graphIsPublic: boolean;
}

export function PostComposer({ graphId, graphIsPublic }: PostComposerProps) {
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);

  async function handlePost() {
    setPosting(true);
    setError(null);
    const result = await createPost(graphId, content);
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
      <h2 className="mb-2 text-sm font-medium text-violet-950">Share to feed</h2>
      <p className="mb-3 text-xs text-neutral-500">
        Write a post promoting this graph. {!graphIsPublic && "Posting will also make this graph public."}
      </p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="What's this graph good for? Why should someone connect their agent to it?"
        className="w-full rounded-md border border-violet-200 px-3 py-2 text-sm focus:border-violet-400 focus:ring-1 focus:ring-violet-400 focus:outline-none"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={handlePost}
          disabled={posting || !content.trim()}
          className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {posting ? "Posting…" : "Post"}
        </button>
        {posted && <span className="text-sm text-green-700">Posted to the feed.</span>}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
