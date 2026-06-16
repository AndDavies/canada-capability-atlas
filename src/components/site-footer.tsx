import Link from "next/link";

const footerGroups = [
  {
    title: "Explore",
    links: [
      { href: "/", label: "Explore the map" },
      { href: "/capabilities", label: "Capabilities" },
      { href: "/regions", label: "Regions" },
      { href: "/compare", label: "Compare regions" },
      { href: "/briefs", label: "Evidence briefs" },
    ],
  },
  {
    title: "Evidence",
    links: [
      { href: "/evidence", label: "What we measure" },
      { href: "/evidence/gaps", label: "Missing layers" },
      { href: "/evidence/contracts", label: "Contract sources" },
      { href: "/itb-opportunity", label: "ITB lens" },
      { href: "/data-library", label: "Data library" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/methodology", label: "How to read the Atlas" },
      { href: "/about", label: "About the project" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand">
          <span className="brand-mark">CA</span>
          <p>
            A public, source-linked map of Canada&apos;s defence and dual-use
            industrial capability. Built from open data.
          </p>
        </div>
        <div className="footer-links">
          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2>{group.title}</h2>
              <ul>
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <p className="footer-note">
        Built from public, aggregate, source-linked data. Not procurement advice.
        Not classified analysis. Independent and open source.
      </p>
    </footer>
  );
}
