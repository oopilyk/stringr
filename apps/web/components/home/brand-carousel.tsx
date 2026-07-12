import { ScrollReveal } from './scroll-reveal'

// Real racquet brands commonly serviced on Stringerly. Text wordmarks are used
// instead of official logo artwork (no logo files are bundled/licensed here) —
// TODO: swap for licensed brand logo SVGs if/when brand permission is secured.
const BRANDS = ['Wilson', 'Babolat', 'Yonex', 'Head', 'Prince', 'Dunlop', 'Tecnifibe', 'Volkl']

export function BrandCarousel() {
  const track = [...BRANDS, ...BRANDS]

  return (
    <section className="pb-16 md:pb-24">
      <ScrollReveal className="mx-auto max-w-6xl px-6">
        <p className="mt-24 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Supporting these brands
        </p>

        <div
          className="relative mt-8 overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          }}
        >
          <div className="flex w-max animate-marquee items-center gap-16">
            {track.map((brand, index) => (
              <span
                key={`${brand}-${index}`}
                className="shrink-0 text-2xl md:text-3xl font-bold tracking-tight text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}
