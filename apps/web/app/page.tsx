import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import { HomeNav } from '@/components/home/home-nav'
import { HeroSection } from '@/components/home/hero-section'
import { BrandCarousel } from '@/components/home/brand-carousel'
import { ValueCardsSection } from '@/components/home/value-cards-section'
import { HowItWorksSection } from '@/components/home/how-it-works-section'
import { FeatureSpotlightsSection } from '@/components/home/feature-spotlights-section'
import { TestimonialsSection } from '@/components/home/testimonials-section'
import { FaqSection } from '@/components/home/faq-section'
import { FinalCtaSection } from '@/components/home/final-cta-section'
import { HomeFooter } from '@/components/home/home-footer'

export default async function HomePage() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect('/discover')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 text-foreground">
      <HomeNav />
      <main>
        <HeroSection />
        <BrandCarousel />
        <ValueCardsSection />
        <FeatureSpotlightsSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <HomeFooter />
    </div>
  )
}
