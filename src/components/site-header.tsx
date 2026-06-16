"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, Menu, X } from "lucide-react";

const primaryLinks = [
  { href: "/", label: "Explore" },
  { href: "/capabilities", label: "Capabilities" },
  { href: "/regions", label: "Regions" },
  { href: "/evidence", label: "Evidence" },
  { href: "/methodology", label: "Methodology" },
  { href: "/about", label: "About" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-header-bar">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">CA</span>
          <span className="brand-name">Canada Capability Atlas</span>
        </Link>

        <nav className="primary-nav" aria-label="Primary">
          {primaryLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${isActive(pathname, href) ? "active" : ""}`}
              aria-current={isActive(pathname, href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <Link
            className={`nav-link data-link ${isActive(pathname, "/data-library") ? "active" : ""}`}
            href="/data-library"
          >
            <Database size={15} strokeWidth={1.8} />
            <span className="data-link-label">Data library</span>
          </Link>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open ? (
        <nav id="mobile-nav" className="mobile-nav" aria-label="Mobile">
          {[...primaryLinks, { href: "/data-library", label: "Data library" } as const].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`mobile-nav-link ${isActive(pathname, href) ? "active" : ""}`}
              aria-current={isActive(pathname, href) ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
