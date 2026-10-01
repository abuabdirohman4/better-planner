import Image from 'next/image';
import Link from 'next/link';
import { RiCheckLine } from 'react-icons/ri';

import Button from '@/components/ui/button/Button';

import { copy, SIZE } from './copy.id';

// Matikan untuk menyembunyikan seksi harga + link nav-nya.
export const SHOW_PRICING = true;

const ctaClass =
  'inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-600';
const navCtaClass =
  'inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600';
const textLinkClass =
  'inline-flex min-h-11 items-center px-2 text-sm font-medium text-gray-700 hover:text-gray-900';
const wrapClass = 'mx-auto max-w-6xl px-4 sm:px-6';
const sectionClass = 'py-16 md:py-24';
const h2Class = 'text-3xl font-bold tracking-tight text-gray-900 md:text-4xl';
const eyebrowClass = 'mb-3 text-sm font-semibold uppercase tracking-wide text-brand-500';
const imgClass = 'h-auto w-full rounded-xl border border-gray-200 shadow-sm';

export default function LandingPage() {
  const { nav, hero, problem, howItWorks, steps, beforeAfter, method, pricing, faq, closing, footer } = copy;

  return (
    <div className="min-h-screen bg-white text-gray-700">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className={`${wrapClass} flex h-16 items-center justify-between gap-2`}>
          <Link href="/" className="shrink-0">
            <Image src="/images/logo/logo.svg" alt="Better Planner" width={218} height={37} className="h-6 w-auto sm:h-8" priority />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
            <a href="#cara-kerja" className="hover:text-gray-900">{nav.howItWorks}</a>
            {SHOW_PRICING && <a href="#harga" className="hover:text-gray-900">{nav.pricing}</a>}
            <a href="#tanya-jawab" className="hover:text-gray-900">{nav.faq}</a>
          </nav>
          <div className="flex items-center gap-1 sm:gap-3">
            <Link href="/signin" className={textLinkClass}>{nav.signin}</Link>
            <Link href="/signup" className={navCtaClass}>{nav.cta}</Link>
          </div>
        </div>
      </header>

      <main>
        {/* 1 Hero */}
        <section className={`${wrapClass} pb-16 pt-12 md:pb-24 md:pt-20`}>
          <div className="mx-auto max-w-3xl text-center">
            <p className={eyebrowClass}>{hero.eyebrow}</p>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-6xl">{hero.title}</h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">{hero.subtitle}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
              <Link href="/signup" className={ctaClass}>{hero.cta}</Link>
              <span className="text-sm text-gray-600">
                {hero.signinPrompt}{' '}
                <Link href="/signin" className="font-semibold text-brand-500 hover:text-brand-600">{hero.signin}</Link>
              </span>
            </div>
            <p className="mt-4 text-sm text-gray-500">{hero.note}</p>
          </div>
          <div className="mt-12">
            <Image
              src={hero.image.desktop}
              alt={hero.image.alt}
              {...SIZE.wide}
              sizes="(min-width: 1152px) 1152px, 100vw"
              className={`${imgClass} hidden md:block`}
              priority
            />
            <Image
              src={hero.image.mobile}
              alt={hero.image.alt}
              {...SIZE.mobile}
              sizes="(min-width: 768px) 0px, 390px"
              className={`${imgClass} mx-auto max-w-[280px] md:hidden`}
              priority
            />
          </div>
        </section>

        {/* 2 Masalah */}
        <section className={`${sectionClass} bg-gray-50`}>
          <div className={`${wrapClass} grid items-center gap-10 md:grid-cols-2`}>
            <div>
              <p className={eyebrowClass}>{problem.eyebrow}</p>
              <h2 className={h2Class}>{problem.title}</h2>
              <p className="mt-5 text-lg text-gray-600">{problem.body}</p>
              <p className="mt-6 border-l-4 border-brand-500 pl-4 text-lg font-bold text-gray-900">{problem.punchline}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-gray-900">{problem.todo.title}</p>
              <ul className="space-y-3 text-sm">
                {problem.todo.items.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span aria-hidden="true" className="h-4 w-4 shrink-0 rounded border border-gray-300" />
                    {item}
                  </li>
                ))}
                {problem.todo.faded.map((item) => (
                  <li key={item} className="flex items-center gap-3 opacity-50">
                    <span aria-hidden="true" className="h-4 w-4 shrink-0 rounded border border-gray-300" />
                    {item}
                  </li>
                ))}
                <li className="flex items-center gap-3 opacity-30">
                  <span aria-hidden="true" className="h-4 w-4 shrink-0 rounded border border-gray-300" />
                  {problem.todo.more}
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3 Cara kerja */}
        <section id="cara-kerja" className={sectionClass}>
          <div className={wrapClass}>
            <div className="mx-auto max-w-3xl text-center">
              <p className={eyebrowClass}>{howItWorks.eyebrow}</p>
              <h2 className={h2Class}>{howItWorks.title}</h2>
              <p className="mt-5 text-lg text-gray-600">{howItWorks.subtitle}</p>
            </div>

            <div className="mt-14 space-y-16 md:space-y-20">
              {steps.map((step) => (
                <div key={step.tag}>
                  <div className="grid items-center gap-8 rounded-2xl border border-gray-200 bg-white p-6 md:grid-cols-5 md:p-10">
                    <div className="md:col-span-2">
                      <p className={eyebrowClass}>{step.tag}</p>
                      <h3 className="text-2xl font-bold tracking-tight text-gray-900">{step.title}</h3>
                      <p className="mt-4 text-gray-600">{step.body}</p>
                    </div>
                    <div className="min-w-0 md:col-span-3">
                      <Image
                        src={step.image.src}
                        alt={step.image.alt}
                        {...SIZE.wide}
                        sizes="(min-width: 1152px) 640px, 100vw"
                        className={imgClass}
                      />
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    {step.cards.map((card) => (
                      <div key={card.title} className="rounded-2xl border border-gray-200 bg-white p-5">
                        <h4 className="font-semibold text-gray-900">{card.title}</h4>
                        <p className="mb-4 mt-2 text-sm text-gray-600">{card.body}</p>
                        <Image
                          src={card.image.src}
                          alt={card.image.alt}
                          {...SIZE.card}
                          sizes="(min-width: 768px) 360px, 100vw"
                          className="h-auto w-full rounded-lg border border-gray-200"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4 Sebelum / Sesudah */}
        <section className={`${sectionClass} bg-gray-50`}>
          <div className={wrapClass}>
            <h2 className={`${h2Class} text-center`}>{beforeAfter.title}</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-gray-100 p-6 md:p-8">
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">{beforeAfter.before.label}</p>
                <p className="mt-3 text-lg text-gray-700">{beforeAfter.before.body}</p>
              </div>
              <div className="rounded-2xl border-2 border-brand-500 bg-white p-6 md:p-8">
                <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">{beforeAfter.after.label}</p>
                <p className="mt-3 text-lg text-gray-900">{beforeAfter.after.body}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5 Metode + pembuat */}
        <section className={sectionClass}>
          <div className={wrapClass}>
            <div className="mx-auto max-w-3xl text-center">
              <p className={eyebrowClass}>{method.eyebrow}</p>
              <h2 className={h2Class}>{method.title}</h2>
              <p className="mt-5 text-lg text-gray-600">{method.subtitle}</p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {method.points.map((point) => (
                <div key={point.title}>
                  <h3 className="text-lg font-semibold text-gray-900">{point.title}</h3>
                  <p className="mt-2 text-gray-600">{point.body}</p>
                </div>
              ))}
            </div>
            <figure className="mx-auto mt-14 max-w-3xl rounded-2xl border border-gray-200 bg-gray-50 p-6 md:p-10">
              <blockquote className="text-lg italic text-gray-800">{method.quote}</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white"
                >
                  {method.initials}
                </span>
                <span className="text-sm text-gray-600">
                  <strong className="text-gray-900">{method.author}</strong> — {method.role}
                </span>
              </figcaption>
            </figure>
          </div>
        </section>

        {/* 6 Harga */}
        {SHOW_PRICING && (
          <section id="harga" className={`${sectionClass} bg-gray-50`}>
            <div className={wrapClass}>
              <h2 className={`${h2Class} text-center`}>{pricing.title}</h2>
              <div className="mx-auto mt-10 grid max-w-3xl gap-4 md:grid-cols-2">
                <div className="flex flex-col rounded-2xl border-2 border-brand-500 bg-white p-6 md:p-8">
                  <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">{pricing.free.name}</p>
                  <p className="mt-3 text-4xl font-bold text-gray-900">{pricing.free.price}</p>
                  <p className="mt-1 text-sm text-gray-600">{pricing.free.note}</p>
                  <ul className="my-6 flex-1 space-y-3 text-sm">
                    {pricing.free.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <RiCheckLine aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className={ctaClass}>{pricing.free.cta}</Link>
                </div>
                <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
                  <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                    {pricing.pro.name}
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs normal-case text-gray-600">{pricing.pro.badge}</span>
                  </p>
                  <p className="mt-3 text-2xl font-bold text-gray-900">{pricing.pro.price}</p>
                  <p className="mt-1 flex-1 text-sm text-gray-600">{pricing.pro.note}</p>
                  <div className="mt-6">
                    <Button variant="outline" disabled className="min-h-11 w-full">{pricing.pro.cta}</Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 7 Tanya jawab */}
        <section id="tanya-jawab" className={sectionClass}>
          <div className={`${wrapClass} grid gap-8 md:grid-cols-3`}>
            <h2 className={h2Class}>{faq.title}</h2>
            <div className="md:col-span-2">
              {faq.items.map((item) => (
                <details key={item.q} className="group border-b border-gray-200 py-4">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-medium text-gray-900 [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span aria-hidden="true" className="text-xl text-gray-400 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-gray-600">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 8 Penutup */}
        <section className={`${sectionClass} bg-gray-50`}>
          <div className={`${wrapClass} text-center`}>
            <h2 className={`${h2Class} mx-auto max-w-3xl`}>{closing.title}</h2>
            <div className="mt-8">
              <Link href="/signup" className={ctaClass}>{closing.cta}</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-8">
        <div className={`${wrapClass} flex flex-col items-center justify-between gap-2 text-sm text-gray-500 sm:flex-row`}>
          <p>{footer.copyright}</p>
          <div className="flex gap-2">
            <Link href="/signin" className={textLinkClass}>{footer.signin}</Link>
            <Link href="/signup" className={textLinkClass}>{footer.signup}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
