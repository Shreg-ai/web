"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/Spinner";

interface SubmitButtonProps {
  children: React.ReactNode;
  pendingText: string;
  className?: string;
}

/** Submit button for a <form action={serverAction}> that shows a spinner while the action is pending. Must be rendered inside the form. */
export function SubmitButton({ children, pendingText, className }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <Spinner className="h-4 w-4" />
          {pendingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
