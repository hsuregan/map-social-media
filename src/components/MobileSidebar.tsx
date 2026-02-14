"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

const links = [
  { href: "/dashboard/feed", label: "Feed" },
  { href: "/dashboard/map", label: "Map" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close sidebar when viewport grows past mobile breakpoint (640px)
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 640px)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Hamburger button — visible only on mobile */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center sm:hidden"
        aria-label="Open menu"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-ink"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Overlay — z-[10000] to sit above Leaflet map (z ~1000) */}
      {open && (
        <div
          className="fixed inset-0 z-[10000] bg-black/30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`fixed right-0 top-0 z-[10001] flex h-full w-64 flex-col bg-ivory shadow-lg transition-transform duration-200 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close button */}
        <div className="flex items-center justify-end border-b border-linen px-6 py-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-ink"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-1 flex-col gap-1 px-4 py-4">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                pathname === href
                  ? "bg-accent/10 text-accent"
                  : "text-stone-700 hover:bg-linen"
              }`}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/dashboard/new"
            className="rounded-full bg-accent px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-accent-hover mt-2"
          >
            New Entry
          </Link>
        </nav>

        {/* Logout at bottom */}
        <div className="border-t border-linen px-4 py-4">
          <LogoutButton />
        </div>
      </div>
    </>
  );
}
