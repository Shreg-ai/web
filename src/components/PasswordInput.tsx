"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface PasswordInputProps {
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
}

/** A password input with a show/hide toggle, so users can verify what they actually typed before submitting. */
export function PasswordInput({ name, value, onChange, placeholder, required, minLength }: PasswordInputProps) {
  const t = useTranslations("common");
  const [visible, setVisible] = useState(false);
  const controlled = value !== undefined;

  return (
    <div className="relative">
      <input
        name={name}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        {...(controlled ? { value, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value) } : {})}
        className="w-full rounded-md border border-violet-200 px-3 py-2 pr-14 text-sm focus:border-violet-400 focus:ring-1 focus:ring-violet-400 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute top-1/2 right-2 -translate-y-1/2 text-xs text-neutral-500 hover:text-violet-700"
        aria-label={visible ? t("hidePassword") : t("showPassword")}
      >
        {visible ? t("hide") : t("show")}
      </button>
    </div>
  );
}
