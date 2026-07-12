import Link from 'next/link'
import { Button } from '@stringerly/ui'
import { findPublicVideo } from '@/lib/utils/find-public-image'
import { ScrollReveal } from './scroll-reveal'

const HEADLINE_WORDS = ['Book', 'String', 'Play']

export function HeroSection() {
  // Drop a video at apps/web/public/home/hero-background.(mp4|webm|mov) and it
  // plays automatically as a looping background — no code change needed.
  const videoSrc = findPublicVideo('home', 'hero-background')

  return (
    <section
      className={`relative overflow-hidden px-6 pt-24 md:pt-32 pb-32 md:pb-40 min-h-[560px] flex items-center justify-center text-center ${
        videoSrc ? 'text-white' : ''
      }`}
    >
      {videoSrc ? (
        <>
          <video
            className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          />
          <div className="absolute inset-0 bg-black/55" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-green-50/60 to-transparent"
          />
        </>
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[480px] max-w-4xl bg-primary/20 blur-[120px]"
        />
      )}

      <ScrollReveal className="relative z-10 mx-auto max-w-4xl">
        <h1
          className={`text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight ${
            videoSrc ? 'text-white' : 'text-foreground'
          }`}
        >
          {HEADLINE_WORDS.map((word) => (
            <span key={word}>
              {word}
              <span className="text-primary">.</span>{' '}
            </span>
          ))}
        </h1>

        <p
          className={`mx-auto mt-6 max-w-2xl text-lg md:text-xl text-balance ${
            videoSrc ? 'text-white/85' : 'text-muted-foreground'
          }`}
        >
          Stringerly connects players with certified local stringers. See exact pricing up
          front, track your racquet job in real time, and pay once you approve the finished work. 
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/discover">
            <Button size="lg" className="rounded-full px-8 h-12 text-base">
              Find a stringer
            </Button>
          </Link>
          <Link href="/become-stringer">
            <Button
              size="lg"
              variant="outline"
              className={`rounded-full px-8 h-12 text-base ${
                videoSrc
                  ? 'bg-transparent border-white text-white hover:bg-white/10'
                  : 'border-primary text-primary hover:bg-primary/10'
              }`}
            >
              Become a stringer
            </Button>
          </Link>
        </div>
      </ScrollReveal>
    </section>
  )
}
