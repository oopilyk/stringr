'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { ScrollReveal } from './scroll-reveal'

interface Faq {
  question: string
  answer: string
}

const FAQS: Faq[] = [
  {
    question: 'How much does stringing cost?',
    answer:
      'Pricing depends on your stringer\'s certification tier: Basic ($15–25), Professional ($25–40), or Master ($40–60). The exact price is shown before you confirm a booking — no surprises at pickup.',
  },
  {
    question: 'When am I actually charged?',
    answer:
      'Your card is authorized (held, not charged) when you book. The charge is only captured once you approve the finished work. If you cancel before your stringer starts, the hold is released automatically and you\'re never charged.',
  },
  {
    question: 'How fast can I get my racquet back?',
    answer:
      'Standard jobs run 24–48 hours. If you need it sooner, filter for stringers offering rush service — some can turn a job around in as little as 2 hours, depending on availability near you.',
  },
  {
    question: 'Can I cancel a request?',
    answer:
      'Yes. Cancel before your stringer starts work for a full, automatic refund. Once work is in progress, cancellation is handled case-by-case with your stringer through in-app messaging.',
  },
  {
    question: 'How do I become a stringer on Stringerly?',
    answer:
      'Apply through the "Become a Stringer" flow: a short onboarding covering your background, equipment, pricing, and availability. You\'ll connect a Stripe account so payouts land directly with you — Stringerly never holds your earnings.',
  },
  {
    question: 'Is Stringerly available in my area?',
    answer:
      'Stringerly matches you with stringers active near your town. Coverage depends on how many stringers have signed up in your area — the platform is actively expanding, so check discovery to see who\'s nearby right now.',
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="px-6 py-20 md:py-28 border-t border-border/60">
      <ScrollReveal className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary text-center">
          Frequently asked questions
        </p>

        <div className="mt-10 divide-y divide-border">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div key={faq.question} className="py-5">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 text-left"
                >
                  <span className="text-base md:text-lg font-medium text-foreground">
                    {faq.question}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                {isOpen && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </ScrollReveal>
    </section>
  )
}
