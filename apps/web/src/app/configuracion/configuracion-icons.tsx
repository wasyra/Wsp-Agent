"use client";

import { useId } from "react";

export function IconSpark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function IconOpenAI({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3c-2.5 2.8-4 6.3-4 10a8 8 0 1 0 8-8h-4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 3v7m0 4v7M8 9h8M8 15h5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconGemini({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const gradId = `gemini-grad-${uid}`;
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="55%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradId})`}
        d="M12 2l1.9 5.7h6l-4.9 3.6 1.9 5.7L12 14.3 6.1 17l1.9-5.7L3.1 7.7h6L12 2z"
      />
    </svg>
  );
}

export function IconKey({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15.5 7.5a3.5 3.5 0 1 0-4.9 4.9L5 18v3h3v-2h2v-2h2l2.6-2.6a3.5 3.5 0 0 0 .9-6.9z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function IconChip({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function IconSliders({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M9 9h6M5 7H3m18 4h-5M11 17H3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconBot({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="8" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9.5" cy="13" r="1" fill="currentColor" />
      <circle cx="14.5" cy="13" r="1" fill="currentColor" />
      <path d="M12 5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
