import Link from 'next/link'
import { Search } from 'lucide-react'
import { Button } from '@stringerly/ui'

const NAV_LINKS = [
  { label: 'Find a Stringer', href: '/discover' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Become a Stringer', href: '/become-stringer' },
  { label: 'About', href: '/about' },
]

export function HomeNav() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 bg-white/95 backdrop-blur-sm shadow-sm">
      <Link href="/" className="flex items-center gap-3">
        <img
          src="/racket-logo.png"
          alt="Stringerly logo"
          width={36}
          height={36}
          className="rounded-full object-cover"
        />
        <span className="text-lg font-bold tracking-tight text-foreground">STRINGERLY</span>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Search"
          className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Search className="h-4 w-4" />
        </button>
        <Link href="/auth/signin">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-primary text-primary hover:bg-primary/10"
          >
            Sign in
          </Button>
        </Link>
        <Link href="/auth/signup">
          <Button size="sm" className="rounded-full">
            Join
          </Button>
        </Link>
      </div>
    </nav>
  )
}
