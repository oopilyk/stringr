import { Lock, Percent, MapPin } from 'lucide-react'
import { ScrollReveal } from './scroll-reveal'

interface Row {
  icon: React.ComponentType<{ className?: string }>
  eyebrow: string
  title: string
  body: string
  mockupLabel: string
  mockupLines: string[]
}

// TODO: replace mockup panels with real app screenshots
const ROWS: Row[] = [
  {
    icon: Lock,
    eyebrow: 'Payment protection',
    title: 'Your card is authorized, not charged — until you approve the job',
    body:
      'When you book, Stripe places a hold on the full price. Nothing is captured until you tap "Approve" on your finished racquet. If your stringer cancels or you cancel before work starts, the hold is released automatically — no refund request required.',
    mockupLabel: 'Payment status',
    mockupLines: ['Authorized · $32.00', 'Stringing in progress', 'Awaiting your approval'],
  },
  {
    icon: Percent,
    eyebrow: 'Transparent pricing',
    title: 'One flat fee, shown before you book — not buried at pickup',
    body:
      'Stringers keep 88% of every job; Stringerly takes a flat 12% platform fee plus a 5% service charge shown at checkout. Pricing is tiered by stringer certification — Basic ($15–25), Professional ($25–40), and Master ($40–60) — so you know the range before you pick anyone.',
    mockupLabel: 'Price breakdown',
    mockupLines: ['Stringer payout · 88%', 'Platform fee · 12%', 'No hidden shop upcharges'],
  },
  {
    icon: MapPin,
    eyebrow: 'Local & fast',
    title: 'Matched to stringers near you, not a national directory',
    body:
      'Discovery is sorted by distance from your location, with real turnaround windows per stringer. Need it for a match tomorrow? Filter for rush service and get it back in as little as 2 hours. Standard jobs run 24–48 hours.',
    mockupLabel: 'Nearby stringers',
    mockupLines: ['0.8 mi · Rush available', '1.4 mi · 24hr turnaround', '2.1 mi · 48hr turnaround'],
  },
]

export function HowItWorksSection() {
  return (
    <section className="px-6 py-20 md:py-28 border-t border-border/60">
      <ScrollReveal className="mx-auto max-w-3xl text-center mb-16 md:mb-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          How it works, line by line
        </p>
        <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Skeptical about the numbers above? Here&apos;s exactly how they work.
        </h2>
      </ScrollReveal>

      <div className="mx-auto max-w-6xl space-y-20 md:space-y-28">
        {ROWS.map((row, index) => {
          const Icon = row.icon
          const reversed = index % 2 === 1

          return (
            <ScrollReveal key={row.title}>
              <div
                className={`flex flex-col gap-10 md:gap-16 items-center ${
                  reversed ? 'md:flex-row-reverse' : 'md:flex-row'
                }`}
              >
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 text-primary">
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                      {row.eyebrow}
                    </span>
                  </div>
                  <h3 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    {row.title}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    {row.body}
                  </p>
                </div>

                <div className="flex-1 w-full">
                  <div className="rounded-2xl border border-border bg-card shadow-lg p-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {row.mockupLabel}
                    </p>
                    <div className="mt-4 space-y-3">
                      {row.mockupLines.map((line) => (
                        <div
                          key={line}
                          className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-foreground"
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          )
        })}
      </div>
    </section>
  )
}
