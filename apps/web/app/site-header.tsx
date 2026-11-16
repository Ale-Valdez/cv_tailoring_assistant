"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ApiStatus } from "./api-status";

const LINKS = [
  { href: "/perfil", label: "Perfil" },
  { href: "/oferta", label: "Oferta" },
  { href: "/revision", label: "Revisión" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-3">
        <Link href="/perfil" className="text-lg font-semibold tracking-tight">
          CV Tailor
        </Link>
        <nav aria-label="Secciones" className="flex gap-1">
          {LINKS.map((link) => {
            const current = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={
                  current
                    ? "rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white"
                    : "rounded-md px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto">
          <ApiStatus />
        </div>
      </div>
    </header>
  );
}
