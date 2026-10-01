import Image from 'next/image';
import Link from 'next/link';
import { RiArrowRightLine, RiCheckLine } from 'react-icons/ri';

import Button from '@/components/ui/button/Button';

import { copy, SIZE } from './copy.id';

// Matikan untuk menyembunyikan seksi harga + link nav-nya.
export const SHOW_PRICING = true;

const gradientClass =
  'bg-gradient-to-r from-brand-600 to-brand-400 text-white shadow-lg shadow-brand-500/30 transition hover:brightness-110';
const ctaClass = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold ${gradientClass}`;
const navCtaClass = `inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold ${gradientClass}`;
const navLinkClass = 'inline-flex min-h-11 items-center hover:text-gray-900';
const footerLinkClass = 'inline-flex min-h-11 items-center hover:text-white';
const wrapClass = 'mx-auto max-w-6xl px-4 sm:px-6';
const sectionClass = 'py-16 md:py-24';
const h2Class = 'text-3xl font-bold tracking-tight text-gray-900 md:text-4xl';
const eyebrowClass = 'mb-3 text-sm font-semibold uppercase tracking-wide text-brand-500';
const imgClass = 'h-auto w-full rounded-xl border border-gray-200 shadow-sm';

export default function LandingPage() {
  const { nav, hero, problem, howItWorks, steps, beforeAfter, method, pricing, faq, closing, footer } = copy;

  return (
    <div id="top" data-landing className="min-h-screen bg-[linear-gradient(180deg,var(--color-brand-50)_0%,var(--color-brand-25)_18%,#ffffff_38%,var(--color-brand-25)_58%,#ffffff_78%,var(--color-brand-50)_100%)] text-gray-700">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-brand-100/70 bg-white/70 backdrop-blur">
        <div className={`${wrapClass} flex h-16 items-center gap-2`}>
          <a href="#top" className="mr-auto shrink-0">
            <Image src="/images/logo/logo.svg" alt="Better Planner" width={218} height={37} className="h-6 w-auto sm:h-8" priority />
          </a>
          <nav className="hidden items-center gap-7 text-sm font-medium text-gray-600 md:flex">
            <a href="#cara-kerja" className={navLinkClass}>{nav.howItWorks}</a>
            {SHOW_PRICING && <a href="#harga" className={navLinkClass}>{nav.pricing}</a>}
            <a href="#faq" className={navLinkClass}>{nav.faq}</a>
          </nav>
          <Link href="/signup" className={`${navCtaClass} md:ml-4`}>{nav.cta}</Link>
        </div>
      </header>

      <main>
        {/* 1 Hero */}
        <section>
          <div className={`${wrapClass} pb-16 pt-12 md:pb-24 md:pt-20`}>
            <div className="mx-auto max-w-3xl text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-4 py-1.5 text-sm font-medium text-brand-600 shadow-sm">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brand-500" />
                {hero.eyebrow}
              </p>
              <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-bold leading-tight tracking-tight text-gray-900 md:text-5xl">
                {hero.titleLead}{' '}
                <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">{hero.titleAccent}</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
                {hero.subtitle.map((part) =>
                  part.bold ? <strong key={part.text} className="font-semibold text-gray-900">{part.text}</strong> : part.text,
                )}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <Link href="/signup" className={`${ctaClass} px-8 text-base`}>
                  {hero.cta}
                  <RiArrowRightLine aria-hidden="true" className="h-5 w-5" />
                </Link>
                <a
                  href="#cara-kerja"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-gray-200 bg-white px-8 py-3 text-base font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
                >
                  {hero.secondaryCta}
                </a>
              </div>
              <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
                {hero.checks.map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <RiCheckLine aria-hidden="true" className="h-4 w-4 text-brand-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-12">
              <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-brand-500/10 md:block">
                <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
                  <span aria-hidden="true" className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-gray-300" />
                    <span className="h-3 w-3 rounded-full bg-gray-300" />
                    <span className="h-3 w-3 rounded-full bg-gray-300" />
                  </span>
                  <span className="rounded-md border border-gray-200 bg-white px-3 py-1 font-mono text-xs text-gray-500">{hero.browserUrl}</span>
                </div>
                <Image
                  src={hero.image.desktop}
                  alt={hero.image.alt}
                  {...SIZE.wide}
                  sizes="(min-width: 1152px) 1152px, 100vw"
                  className="h-auto w-full"
                  priority
                />
              </div>
              <Image
                src={hero.image.mobile}
                alt={hero.image.alt}
                {...SIZE.mobile}
                sizes="(min-width: 768px) 0px, 390px"
                className={`${imgClass} mx-auto max-w-[280px] md:hidden`}
                priority
              />
            </div>
          </div>
        </section>

        {/* 2 Masalah */}
        <section className={sectionClass}>
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
        <section className={sectionClass}>
          <div className={wrapClass}>
            <h2 className={`${h2Class} text-center`}>{beforeAfter.title}</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white/60 p-6 md:p-8">
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
            <figure className="mx-auto mt-14 max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-10">
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
          <section id="harga" className={sectionClass}>
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
        <section id="faq" className={sectionClass}>
          <div className={`${wrapClass} max-w-3xl`}>
            <div className="text-center">
              <p className={`${eyebrowClass} inline-flex items-center gap-2`}>
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                {faq.eyebrow}
              </p>
              <h2 className={h2Class}>{faq.title}</h2>
            </div>
            <div className="mt-10 space-y-3">
              {faq.items.map((item) => (
                <details key={item.q} className="group rounded-2xl border border-gray-200 bg-white px-5 shadow-sm open:shadow-md md:px-6">
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-lg text-brand-500 transition group-open:rotate-45 group-open:bg-gradient-to-r group-open:from-brand-600 group-open:to-brand-400 group-open:text-white"
                    >
                      +
                    </span>
                  </summary>
                  <p className="pb-5 text-gray-600">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 8 Penutup */}
        <section className="relative overflow-hidden bg-gray-950 py-20 text-center md:py-28">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-72 max-w-3xl rounded-full bg-brand-500/30 blur-3xl"
          />
          <div className={`${wrapClass} relative`}>
            <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-white md:text-4xl">{closing.title}</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-300">{closing.subtitle}</p>
            <div className="mt-10">
              <Link href="/signup" className={`${ctaClass} px-8 text-base`}>
                {closing.cta}
                <RiArrowRightLine aria-hidden="true" className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-950 text-gray-400">
        <div className={`${wrapClass} border-t border-white/10 py-14`}>
          <div className="grid gap-10 md:grid-cols-[1fr_auto_auto] md:gap-16">
            <div className="max-w-md">
              <span aria-hidden="true" className="mb-6 block h-1 w-14 rounded-full bg-gradient-to-r from-brand-600 to-brand-400" />
              <Image src="/images/logo/logo-dark.svg" alt="Better Planner" width={218} height={37} className="h-8 w-auto" />
              <p className="mt-4 leading-relaxed">{footer.tagline}</p>
            </div>
            <nav aria-label={footer.productTitle}>
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-white">{footer.productTitle}</p>
              <ul className="space-y-1">
                <li><a href="#cara-kerja" className={footerLinkClass}>{nav.howItWorks}</a></li>
                {SHOW_PRICING && <li><a href="#harga" className={footerLinkClass}>{nav.pricing}</a></li>}
                <li><a href="#faq" className={footerLinkClass}>{nav.faq}</a></li>
              </ul>
            </nav>
            <nav aria-label={footer.accountTitle}>
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-white">{footer.accountTitle}</p>
              <ul className="space-y-1">
                <li><Link href="/signin" className={footerLinkClass}>{footer.signin}</Link></li>
                <li><Link href="/signup" className={footerLinkClass}>{footer.signup}</Link></li>
              </ul>
            </nav>
          </div>
          <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-sm sm:flex-row sm:justify-between">
            <p>{footer.copyright}</p>
            <p className="font-mono text-gray-500">{footer.site}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
