import Image from 'next/image'
import { ListChecks, QrCode, MapPinned, Star } from 'lucide-react'
import { findPublicImage } from '@/lib/utils/find-public-image'
import { ScrollReveal } from './scroll-reveal'

interface Spotlight {
  eyebrow: string
  title: string
  hook: string
  description: string
  bullets: { icon: React.ComponentType<{ className?: string }>; text: string }[]
  imageBaseName: string
}

// Drop a screenshot at apps/web/public/home/<imageBaseName>.(jpg|jpeg|png|webp)
// and it replaces the placeholder box automatically — no code change needed.
const SPOTLIGHTS: Spotlight[] = [
  {
    eyebrow: 'Signature feature',
    title: 'Live job tracking',
    hook: 'Watch your racquet get strung, step by step.',
    description:
      'Most local stringers give you zero visibility once you hand over your racquet. Stringerly stringers work through a guided task checklist — pending, accepted, in progress, ready — and can upload progress photos straight from their phone via a QR code, so you always know exactly where your racquet is.',
    bullets: [
      { icon: ListChecks, text: 'Guided, multi-step stringing checklist per job' },
      { icon: QrCode, text: 'QR-code photo upload for real-time progress shots' },
    ],
    imageBaseName: 'feature-live-tracking',
  },
  {
    eyebrow: 'Signature feature',
    title: 'Local stringers, ranked by distance',
    hook: 'A real map of nearby stringers.',
    description:
      'Search results are sorted by how close a stringer actually is to you, with verified profiles, certification tier, and reviews from real jobs — so you can compare quality and turnaround before you book, not after.',
    bullets: [
      { icon: MapPinned, text: 'Distance-sorted discovery, town-level filtering' },
      { icon: Star, text: 'Verified reviews tied to completed jobs' },
    ],
    imageBaseName: 'feature-local-stringers',
  },
]

export function FeatureSpotlightsSection() {
  return (
    <section className="px-6 py-20 md:py-28 border-t border-border/60">
      <ScrollReveal className="mx-auto max-w-3xl text-center mb-16 md:mb-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          What makes Stringerly different
        </p>
        <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Built for players who actually care about their strings
        </h2>
      </ScrollReveal>

      <div className="mx-auto max-w-6xl space-y-24 md:space-y-32">
        {SPOTLIGHTS.map((spotlight, index) => {
          const imageSrc = findPublicImage('home', spotlight.imageBaseName)

          return (
          <ScrollReveal key={spotlight.title}>
            <div
              className={`flex flex-col gap-10 md:gap-16 items-center ${
                index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'
              }`}
            >
              <div className="flex-1 w-full">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {spotlight.eyebrow}
                </p>
                <h3 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                  {spotlight.title}
                </h3>
                <p className="mt-3 text-lg font-medium text-foreground/90">{spotlight.hook}</p>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  {spotlight.description}
                </p>

                <ul className="mt-6 space-y-3">
                  {spotlight.bullets.map((bullet) => {
                    const Icon = bullet.icon
                    return (
                      <li key={bullet.text} className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-medium text-foreground">{bullet.text}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div className="flex-1 w-full">
                {imageSrc ? (
                  <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border shadow-lg">
                    <Image
                      src={imageSrc}
                      alt={`${spotlight.title} app preview`}
                      fill
                      className="object-contain"
                      sizes="(min-width: 768px) 50vw, 100vw"
                    />
                  </div>
                ) : (
                  <div className="rounded-3xl border border-border bg-card shadow-lg p-8 aspect-[4/3] flex items-center justify-center">
                    <span className="text-sm font-medium text-muted-foreground text-center">
                      App preview — {spotlight.title}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>
          )
        })}
      </div>
    </section>
  )
}
