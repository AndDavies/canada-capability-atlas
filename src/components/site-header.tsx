import Link from "next/link";
import { Code2, Database, FileText, MapPinned } from "lucide-react";

const links = [
  { href: "/", label: "Explore", icon: MapPinned },
  { href: "/methodology", label: "How it works", icon: FileText },
  { href: "/sources", label: "Data sources", icon: Database },
] as const;

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--line)] bg-[var(--canvas)]/96 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1520px] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="grid h-8 w-8 place-items-center border border-[var(--ink)] bg-[var(--ink)] text-xs font-black text-[var(--canvas)]">
            CA
          </span>
          <span className="truncate text-sm font-black uppercase tracking-[0.08em]">Canada Capability Atlas</span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="nav-link">
              <Icon size={15} strokeWidth={1.8} />
              {label}
            </Link>
          ))}
        </nav>
        <Link
          className="nav-link"
          href="/sources"
          aria-label="Open the public source list"
        >
          <Code2 size={15} strokeWidth={1.8} />
          <span className="hidden md:inline">Source list</span>
        </Link>
      </div>
    </header>
  );
}
