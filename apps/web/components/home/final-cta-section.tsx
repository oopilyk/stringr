import Link from 'next/link'
import { Button } from '@stringerly/ui'
import { ScrollReveal } from './scroll-reveal'

export function FinalCtaSection() {
  return (
    <section className="px-6 py-24 md:py-32 border-t border-border/60 text-center">
      <ScrollReveal className="mx-auto max-w-3xl">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Your racquet, strung right, paid for only when you approve it.
        </h2>
        <div className="mt-10">
          <Link href="/auth/signup">
            <Button size="lg" className="rounded-full px-10 h-12 text-base">
              Get started
            </Button>
          </Link>
        </div>
      </ScrollReveal>
    </section>
  )
}
