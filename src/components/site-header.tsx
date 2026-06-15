import Link from "next/link";
import { BookOpen, Database, FileText, Layers3, MapPinned, Scale } from "lucide-react";

const links = [
  { href: "/", label: "Explore", icon: MapPinned },
  { href: "/capabilities", label: "Capabilities", icon: Layers3 },
  { href: "/regions", label: "Regions", icon: MapPinned },
  { href: "/methodology", label: "Evidence model", icon: FileText },
  { href: "/evidence", label: "Evidence", icon: Scale },
  { href: "/briefs/naval-autonomy-nova-scotia", label: "Evidence briefs", icon: BookOpen },
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
          href="/data-library"
          aria-label="Open the data library"
        >
          <Database size={15} strokeWidth={1.8} />
          <span className="hidden md:inline">Data library</span>
        </Link>
      </div>
    </header>
  );
}
