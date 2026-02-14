"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard/feed", label: "Feed" },
  { href: "/dashboard/map", label: "Map" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`text-sm font-medium ${pathname === href ? "text-accent" : "text-stone-700 hover:text-ink"}`}
        >
          {label}
        </Link>
      ))}
    </>
  );
}
