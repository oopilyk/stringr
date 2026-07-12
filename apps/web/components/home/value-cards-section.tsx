import Image from 'next/image'
import { findPublicImage } from '@/lib/utils/find-public-image'
import { ScrollReveal } from './scroll-reveal'

interface ValueCard {
  number: string
  category: string
  stat: string
  statSuffix?: string
  description: string
  gradientClass: string
  imageBaseName: string
}

// Drop a photo at apps/web/public/home/<imageBaseName>.(jpg|jpeg|png|webp) and it
// replaces the gradient automatically — no code change needed.
const CARDS: ValueCard[] = [
  {
    number: '01',
    category: 'Payment protection',
    stat: '100',
    statSuffix: '%',
    description:
      'Your payment is authorized up front and only captured once you approve the finished stringing. Cancel before work starts for a full, automatic refund.',
    gradientClass: 'from-primary to-emerald-800',
    imageBaseName: 'value-card-01',
  },
  {
    number: '02',
    category: 'Stringer payout',
    stat: '88',
    statSuffix: '%',
    description:
      'Of every job goes straight to your stringer — a flat, transparent fee, not a marketplace cut buried in the price.',
    gradientClass: 'from-emerald-700 to-emerald-900',
    imageBaseName: 'value-card-02',
  },
  {
    number: '03',
    category: 'Rush service',
    stat: '2',
    statSuffix: ' HR',
    description:
      'Tournament-rush turnaround available, filtered to stringers actually near you. Standard jobs run 24–48 hours.',
    gradientClass: 'from-emerald-600 to-primary',
    imageBaseName: 'value-card-03',
  },
]

export function ValueCardsSection() {
  return (
    <section className="px-6 pb-20 md:pb-28">
      <div className="mx-auto max-w-6xl grid gap-6 md:grid-cols-3">
        {CARDS.map((card, index) => {
          const imageSrc = findPublicImage('home', card.imageBaseName)

          return (
            <ScrollReveal key={card.number} delayMs={index * 100}>
              <article className="relative flex h-full min-h-[420px] flex-col justify-between overflow-hidden rounded-3xl p-8">
                {imageSrc ? (
                  <>
                    <Image
                      src={imageSrc}
                      alt=""
                      fill
                      className="object-cover -z-20"
                      sizes="(min-width: 768px) 33vw, 100vw"
                    />
                    <div
                      className={`absolute inset-0 -z-10 bg-gradient-to-br ${card.gradientClass} opacity-70`}
                    />
                  </>
                ) : (
                  <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${card.gradientClass}`} />
                )}

                <span className="text-xs font-semibold tracking-widest text-white/60">
                  — {card.number}
                </span>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                    {card.category}
                  </p>
                  <p className="mt-3 text-6xl md:text-7xl font-extrabold tracking-tight text-white">
                    {card.stat}
                    <span className="text-emerald-100">{card.statSuffix}</span>
                  </p>
                  <p className="mt-5 text-sm leading-relaxed text-white/80">{card.description}</p>
                </div>
              </article>
            </ScrollReveal>
          )
        })}
      </div>
    </section>
  )
}
