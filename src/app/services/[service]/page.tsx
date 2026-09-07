import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Check, CircleUserRound, HeartHandshake, Languages, MonitorSmartphone, PhoneCall, Sparkles } from "lucide-react";
import PageWrapper from "@/components/layouts/PageWrapper";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { PageHero } from "@/components/ui/PageHero";
import { AppointmentCTA } from "@/components/home/AppointmentCTA";
import { services, servicesData } from "@/data/servicesData";
import { siteConfig } from "@/config/site";
import { parentGuidanceContent } from "@/data/brochureContent";
import { createPageMetadata } from "@/lib/seo";

interface ServicePageProps { params: Promise<{ service: string }> }

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { service } = await params;
  const svc = services[service];
  return svc
    ? createPageMetadata({
        title: svc.seo.title.replace(/\s*\|\s*Chetana.*$/, ""),
        description: svc.seo.description,
        path: `/services/${svc.slug}`,
      })
    : { title: "Service Not Found", robots: { index: false, follow: false } };
}

export async function generateStaticParams() {
  return servicesData.map((service) => ({ service: service.slug }));
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { service } = await params;
  const svc = services[service];
  if (!svc) notFound();

  return (
    <PageWrapper>
      <Breadcrumb items={[{ label: "Counselling Services", href: "/services" }, { label: svc.title }]} />
      <PageHero
        eyebrow="Counselling service"
        title={svc.title}
        description={svc.description}
        aside={
          <div className="rounded-[1.4rem] bg-primary p-5 text-white sm:rounded-[1.6rem] sm:p-7 shadow-[0_22px_70px_rgba(23,63,69,.2)]">
            <Sparkles className="h-6 w-6 text-accent" />
            <h2 className="mt-5 text-2xl font-extrabold">A session shaped around your situation</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">You can request this service in Telugu, English or Hindi, with in-person, phone and online options.</p>
            <Link href={`/book-session?service=${svc.slug}`} className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-extrabold text-primary">Book this service</Link>
          </div>
        }
      />

      <section className="section-space">
        <div className="container-shell grid gap-7 sm:gap-10 lg:grid-cols-[1fr_330px] lg:items-start">
          <div>
            <div className="text-left">
              <div className="eyebrow mb-5">Areas we can explore</div>
              <h2 className="section-title">What this service can focus on</h2>
            </div>
            <div className="mt-7 grid gap-2.5 sm:mt-8 sm:grid-cols-2 sm:gap-3">
              {svc.benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3 rounded-[1.05rem] border border-primary/8 bg-white p-3.5 sm:rounded-2xl sm:p-4">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/7 text-primary"><Check className="h-3.5 w-3.5" /></span>
                  <span className="text-sm font-semibold leading-6 text-foreground/78">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 sm:mt-14">
              <div className="text-left">
                <div className="eyebrow mb-5">Who may benefit</div>
                <h2 className="section-title">This may be useful if you relate to any of these situations</h2>
              </div>
              <div className="mt-6 grid gap-2 sm:mt-7 sm:gap-3 sm:grid-cols-2">
                {svc.whoCanBenefit.map((item) => (
                  <div key={item} className="flex items-center gap-3 border-b border-primary/8 py-3 text-sm font-semibold text-muted"><CircleUserRound className="h-4.5 w-4.5 shrink-0 text-secondary" />{item}</div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28">
            <div className="premium-card p-5 sm:p-6">
              <p className="text-xs font-extrabold uppercase tracking-[.12em] text-secondary">Session options</p>
              <div className="mt-5 space-y-4">
                <div className="flex gap-3"><Languages className="mt-0.5 h-5 w-5 text-primary" /><div><div className="text-sm font-extrabold text-primary">Languages</div><div className="mt-1 text-xs leading-5 text-muted">{siteConfig.languages.join(" · ")}</div></div></div>
                <div className="flex gap-3"><MonitorSmartphone className="mt-0.5 h-5 w-5 text-primary" /><div><div className="text-sm font-extrabold text-primary">Formats</div><div className="mt-1 text-xs leading-5 text-muted">In-person · Phone · Online</div></div></div>
                <div className="flex gap-3"><PhoneCall className="mt-0.5 h-5 w-5 text-primary" /><div><div className="text-sm font-extrabold text-primary">Need help choosing?</div><Link href={`tel:${siteConfig.phoneRaw}`} className="mt-1 block text-xs font-bold text-secondary">Call {siteConfig.phone}</Link></div></div>
              </div>
              <Link href={`/book-session?service=${svc.slug}`} className="mt-6 flex min-h-12 items-center justify-center rounded-full bg-primary px-5 text-sm font-extrabold text-white">Request a session</Link>
            </div>
            <Link href="/services" className="flex items-center gap-2 px-2 text-sm font-extrabold text-primary"><ArrowLeft className="h-4 w-4" /> All counselling services</Link>
          </aside>
        </div>
      </section>

      {svc.slug === "parent-guidance" && (
        <section className="section-space bg-[#f0eee8]">
          <div className="container-shell">
            <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
              <div className="rounded-[1.5rem] bg-primary p-5 text-white sm:p-7 lg:sticky lg:top-28">
                <HeartHandshake className="h-6 w-6 text-accent" />
                <p className="mt-5 text-xs font-extrabold uppercase tracking-[.12em] text-accent">How a counsellor can help a parent</p>
                <div className="mt-4 space-y-3">
                  {parentGuidanceContent.helpPoints.map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm leading-6 text-white/72">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-accent" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["Childhood mental-health issues and concerns", parentGuidanceContent.childhoodIssues],
                  ["Common adolescent issues and concerns", parentGuidanceContent.adolescentIssues],
                ].map(([title, items]) => (
                  <div key={title as string} className="premium-card p-5 sm:p-6">
                    <h2 className="text-lg font-extrabold text-primary">{title as string}</h2>
                    <div className="mt-4 space-y-2.5">
                      {(items as readonly string[]).map((item, index) => (
                        <div key={item} className="grid grid-cols-[26px_1fr] gap-2.5 text-sm leading-6 text-muted">
                          <span className="font-black text-secondary">{index + 1}.</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <AppointmentCTA />
    </PageWrapper>
  );
}
