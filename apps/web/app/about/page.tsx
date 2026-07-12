import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@stringerly/ui'
import { findPublicImage } from '@/lib/utils/find-public-image'
import { HomeNav } from '@/components/home/home-nav'
import { HomeFooter } from '@/components/home/home-footer'

export default function AboutPage() {
  // Drop a photo at apps/web/public/about/founder.(jpg|jpeg|png|webp) and it
  // replaces the placeholder panel automatically — no code change needed.
  const photoSrc = findPublicImage('about', 'founder')

  return (
    <div className="min-h-screen bg-white">
      <HomeNav />

      <div className="grid md:grid-cols-2">
        <div className="flex flex-col justify-center px-8 md:px-16 py-16 md:py-24 order-2 md:order-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Founder
          </p>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
            Built by a player, for players.
          </h1>

          <p className="mt-6 text-gray-600 leading-relaxed">
            Hi, I&apos;m Owen Akers, a Computer Science and Computer Engineering student at Johns
            Hopkins University. I've been a tennis player for my whole life and even played on the
            team at Hopkins.
          </p>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Stringerly exists because I got tired of guessing who to trust with my racquet. It
            connects players with certified local stringers, with transparent pricing and payment
            that only releases once you approve the finished work.
          </p>

          <div className="mt-8">
            <Link href="/contact">
              <Button size="lg" className="rounded-full px-8 h-12 text-base">
                Get in touch
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative min-h-[420px] md:min-h-screen order-1 md:order-2">
          {photoSrc ? (
            <Image
              src={photoSrc}
              alt="Owen Akers, founder of Stringerly"
              fill
              className="object-cover"
              sizes="(min-width: 768px) 50vw, 100vw"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
              <span className="text-8xl font-bold text-white">OA</span>
            </div>
          )}
        </div>
      </div>

      <HomeFooter />
    </div>
  )
}
