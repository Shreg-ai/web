"use client";

import { useState } from "react";

interface PasswordInputProps {
  name: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
}

/** A password input with a show/hide toggle, so users can verify what they actually typed before submitting. */
export function PasswordInput({ name, placeholder = "Password", required, minLength }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        name={name}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="w-full rounded-md border border-violet-200 px-3 py-2 pr-14 text-sm focus:border-violet-400 focus:ring-1 focus:ring-violet-400 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute top-1/2 right-2 -translate-y-1/2 text-xs text-neutral-500 hover:text-violet-700"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
