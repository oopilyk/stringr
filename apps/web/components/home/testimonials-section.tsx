import { ScrollReveal } from './scroll-reveal'

interface Testimonial {
  quote: string
  name: string
  title: string
}

// Fictional placeholder quotes/names for layout purposes only — swap for real
// player/stringer testimonials before this ever goes in front of real users.
const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'I booked a rush job the night before regionals and had my racquet back in under two hours. Saved my tournament.',
    name: 'Marcus Chen',
    title: 'Player',
  },
  {
    quote:
      'Being able to see exactly where a job sits in my queue changed how I plan my whole week.',
    name: 'Priya Nair',
    title: 'Stringer',
  },
  {
    quote:
      'Payment only releases once I approve the work, so there\'s never an argument about quality afterward.',
    name: 'Sofia Álvarez',
    title: 'Player',
  },
]

export function TestimonialsSection() {
  return (
    <section className="px-6 py-20 md:py-28 border-t border-border/60">
      <ScrollReveal className="mx-auto max-w-3xl text-center mb-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          What people are saying
        </p>
      </ScrollReveal>

      <div className="mx-auto max-w-6xl grid gap-10 md:grid-cols-3">
        {TESTIMONIALS.map((testimonial, index) => (
          <ScrollReveal key={testimonial.name + index} delayMs={index * 100}>
            <figure className="h-full">
              <span aria-hidden="true" className="block text-5xl font-serif text-primary leading-none">
                &ldquo;
              </span>
              <blockquote className="mt-2 text-lg leading-relaxed text-foreground">
                {testimonial.quote}
              </blockquote>
              <figcaption className="mt-6 text-sm">
                <span className="font-semibold text-foreground">{testimonial.name}</span>
                <span className="text-muted-foreground"> — {testimonial.title}</span>
              </figcaption>
            </figure>
          </ScrollReveal>
        ))}
      </div>
    </section>
  )
}
