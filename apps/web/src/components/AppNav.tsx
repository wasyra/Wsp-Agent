"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/chats", label: "Chats", icon: "💬" },
  { href: "/leads", label: "Leads", icon: "📋" },
  { href: "/estado", label: "Estado", icon: "📡" },
  { href: "/configuracion", label: "Ajustes", icon: "⚙" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/chats") return pathname === "/chats" || pathname.startsWith("/chats/");
  if (href === "/leads") return pathname === "/leads" || pathname.startsWith("/leads/");
  if (href === "/estado") return pathname === "/estado" || pathname.startsWith("/estado/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--wa-header-dark)] bg-gradient-to-r from-[#008069] via-[#00916f] to-[#008069] shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
      <div className="mx-auto flex max-w-[1600px] items-center gap-1 px-3 py-2 sm:px-5">
        <Link
          href="/chats"
          className="mr-2 flex items-center gap-2 rounded-xl pr-2 transition hover:bg-white/10 sm:border-r sm:border-white/20 sm:pr-4"
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-lg shadow-inner ring-1 ring-white/20"
            aria-hidden
          >
            💬
          </span>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate font-[family-name:var(--font-display)] text-sm font-semibold leading-tight text-white">
              Wsp Agent
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/75">
              Inbox
            </p>
          </div>
        </Link>
        <nav className="flex flex-1 items-center justify-end gap-0.5 sm:justify-start sm:gap-1">
          {items.map(({ href, label, icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-black/25 text-white shadow-inner ring-1 ring-white/10"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <span className="text-base opacity-90" aria-hidden>
                  {icon}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
