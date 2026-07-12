"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { deletePost, updatePost } from "@/app/g/[id]/actions";
import { POST_CATEGORIES, type PostCategory } from "@/lib/categories";
import type { GraphEvaluationRow, GraphRow, PostRow } from "@/lib/supabase/dbTypes";

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function FeedPostCard({
  post,
  graph,
  username,
  avatarUrl,
  evaluations,
  isOwner,
  showGraphCard = true,
  truncate = false,
}: {
  post: PostRow;
  graph: GraphRow;
  username: string;
  avatarUrl?: string | null;
  evaluations: GraphEvaluationRow[];
  isOwner?: boolean;
  /** Set false when the post is already shown in the context of its graph (e.g. on the graph page itself), so the graph mini-card would be redundant. */
  showGraphCard?: boolean;
  /** Clamp content to a few lines -- for compact listings like "posts about this graph". */
  truncate?: boolean;
}) {
  const graphWins = evaluations.filter((e) => e.winner === "graph").length;

  const [content, setContent] = useState(post.content);
  const [category, setCategory] = useState<PostCategory>(post.category);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  async function handleSave() {
    setBusy(true);
    setError(null);
    const result = await updatePost(post.id, content, category);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditing(false);
  }

  async function handleDelete() {
    if (!window.confirm("Delete this post?")) return;
    setBusy(true);
    setError(null);
    const result = await deletePost(post.id);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDeleted(true);
  }

  if (deleted) return null;

  return (
    <article className="rounded-lg border border-violet-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-xs text-neutral-500">
        <Link href={`/u/${username}`} className="flex items-center gap-1.5 font-medium text-violet-700 hover:underline">
          <Avatar url={avatarUrl} username={username} size={20} />
          @{username}
        </Link>
        <span>·</span>
        <span>{timeAgo(post.created_at)}</span>
        <span>·</span>
        {!editing && <span className="rounded-full bg-violet-100 px-2 py-0.5 font-medium text-violet-700">{post.category}</span>}
        {isOwner && !editing && (
          <span className="ml-auto flex gap-2">
            <button onClick={() => setEditing(true)} className="text-neutral-500 hover:text-violet-700 hover:underline">
              Edit
            </button>
            <button onClick={handleDelete} disabled={busy} className="text-neutral-500 hover:text-red-600 hover:underline disabled:opacity-50">
              Delete
            </button>
          </span>
        )}
      </div>

      {editing ? (
        <div className="mb-3 flex flex-col gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-violet-200 px-3 py-2 text-sm focus:border-violet-400 focus:ring-1 focus:ring-violet-400 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PostCategory)}
              className="rounded-md border border-violet-200 px-2 py-1.5 text-sm focus:border-violet-400 focus:ring-1 focus:ring-violet-400 focus:outline-none"
            >
              {POST_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <button
              onClick={handleSave}
              disabled={busy || !content.trim()}
              className="rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setContent(post.content);
                setCategory(post.category);
                setError(null);
              }}
              className="text-sm text-neutral-500 hover:text-neutral-900"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className={`mb-3 text-sm whitespace-pre-wrap text-neutral-800 ${truncate ? "line-clamp-3" : ""}`}>{post.content}</p>
      )}

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {showGraphCard && (
        <Link href={`/g/${graph.id}`} className="block rounded-md bg-violet-50/60 p-3 hover:bg-violet-50">
          <p className="text-sm font-medium text-violet-950">{graph.title}</p>
          {graph.description && <p className="mt-1 line-clamp-2 text-xs text-neutral-600">{graph.description}</p>}
          <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
            <span>
              {graph.node_count} nodes · {graph.edge_count} edges
            </span>
            {evaluations.length > 0 && (
              <span className="font-medium text-violet-700">
                {graphWins}/{evaluations.length} eval wins
              </span>
            )}
          </div>
        </Link>
      )}
    </article>
  );
}
