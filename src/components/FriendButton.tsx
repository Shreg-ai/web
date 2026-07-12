"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { acceptFriendRequest, removeFriendConnection, sendFriendRequest } from "@/app/u/[username]/actions";

export type FriendStatus = "none" | "pending_sent" | "pending_received" | "friends";

export function FriendButton({
  targetUserId,
  username,
  initialStatus,
  initialRequestId,
}: {
  targetUserId: string;
  username: string;
  initialStatus: FriendStatus;
  initialRequestId: string | null;
}) {
  const t = useTranslations("friendActions");
  const tCommon = useTranslations("common");
  const [status, setStatus] = useState(initialStatus);
  const [requestId, setRequestId] = useState(initialRequestId);
  const [busy, setBusy] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  async function handleAdd() {
    setBusy(true);
    setStatus("pending_sent");
    const result = await sendFriendRequest(targetUserId, username);
    setBusy(false);
    if (result.error) setStatus("none");
  }

  async function handleAccept() {
    if (!requestId) return;
    setBusy(true);
    const result = await acceptFriendRequest(requestId);
    setBusy(false);
    if (!result.error) setStatus("friends");
  }

  async function handleRemove() {
    if (!requestId) return;
    setBusy(true);
    const result = await removeFriendConnection(requestId, username);
    setBusy(false);
    if (!result.error) {
      setStatus("none");
      setRequestId(null);
      setConfirmingRemove(false);
    }
  }

  if (status === "friends") {
    if (confirmingRemove) {
      return (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-neutral-500">{t("removeConfirm")}</span>
          <button onClick={handleRemove} disabled={busy} className="font-medium text-red-600 hover:underline disabled:opacity-50">
            {t("yes")}
          </button>
          <button onClick={() => setConfirmingRemove(false)} className="text-neutral-500 hover:underline">
            {tCommon("cancel")}
          </button>
        </div>
      );
    }
    return (
      <button
        onClick={() => setConfirmingRemove(true)}
        className="rounded-md border border-violet-200 px-4 py-1.5 text-sm font-medium text-violet-700 hover:bg-violet-50"
      >
        {t("friendsCheck")}
      </button>
    );
  }

  if (status === "pending_received") {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleAccept}
          disabled={busy}
          className="rounded-md bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {t("accept")}
        </button>
        <button
          onClick={handleRemove}
          disabled={busy}
          className="rounded-md border border-violet-200 px-4 py-1.5 text-sm font-medium text-neutral-600 hover:bg-violet-50 disabled:opacity-50"
        >
          {t("decline")}
        </button>
      </div>
    );
  }

  if (status === "pending_sent") {
    return (
      <button
        onClick={handleRemove}
        disabled={busy}
        className="rounded-md border border-violet-200 px-4 py-1.5 text-sm font-medium text-neutral-600 hover:bg-violet-50 disabled:opacity-50"
      >
        {t("requestSent")}
      </button>
    );
  }

  return (
    <button
      onClick={handleAdd}
      disabled={busy}
      className="rounded-md border border-violet-200 px-4 py-1.5 text-sm font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-50"
    >
      {t("addFriend")}
    </button>
  );
}
