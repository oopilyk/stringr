import Link from 'next/link'
import { Instagram, Twitter } from 'lucide-react'

const FOOTER_COLUMNS = [
  {
    heading: 'Product',
    links: [
      { label: 'Find a stringer', href: '/discover' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Become a stringer', href: '/become-stringer' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      // TODO: build real /privacy and /terms pages — none exist yet
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
    ],
  },
]

export function HomeFooter() {
  return (
    <footer className="border-t border-border/60 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/racket-logo.png"
                alt="Stringerly logo"
                width={28}
                height={28}
                className="rounded-full object-cover"
              />
              <span className="text-sm font-bold tracking-tight text-foreground">STRINGERLY</span>
            </Link>
            {/* Social accounts don't exist yet — icons are inert with a "coming soon" hint */}
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                disabled
                title="Coming soon"
                aria-label="Stringerly on Instagram — coming soon"
                className="text-muted-foreground/40 cursor-not-allowed"
              >
                <Instagram className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled
                title="Coming soon"
                aria-label="Stringerly on Twitter — coming soon"
                className="text-muted-foreground/40 cursor-not-allowed"
              >
                <Twitter className="h-4 w-4" />
              </button>
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {column.heading}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Stringerly. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
