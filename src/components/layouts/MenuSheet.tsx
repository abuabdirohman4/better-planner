"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { cn } from "@/lib/utils";
import { navGroups } from "./navItems";

// Habits punya tab saudara (/habits/today, /habits/monthly) — satu entri menu.
const isActivePath = (path: string, pathname: string) =>
  path === pathname || (path.startsWith("/habits/") && pathname.startsWith("/habits/"));

export default function MenuSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  // Tutup otomatis saat pindah halaman.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div className={cn("md:hidden", !open && "pointer-events-none")} aria-hidden={!open}>
      <div
        data-testid="menu-sheet-overlay"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-[60] bg-black/50 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        data-testid="menu-sheet"
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[61] max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white dark:bg-gray-900 shadow-xl transition-transform duration-300 ease-out pb-safe",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Menu</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-4 pb-6 space-y-4">
          {navGroups.map((group) => (
            <section key={group.title}>
              <h3 className="px-1 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {group.title}
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {group.items.map((item) => {
                  const active = !!item.path && isActivePath(item.path, pathname);
                  return (
                    <Link
                      key={item.path}
                      href={item.path!}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-center",
                        active
                          ? "bg-brand-50 text-brand-500 dark:bg-brand-500/15"
                          : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                      )}
                    >
                      {/* Ikon SVGR tanpa viewBox: biarkan ukuran asli agar tidak terpotong. */}
                      <span className="flex h-6 w-6 items-center justify-center">{item.icon}</span>
                      <span className="text-[11px] leading-tight font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
