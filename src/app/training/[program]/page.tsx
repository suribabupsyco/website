import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Building2, Check, GraduationCap, MessageCircle, Presentation } from "lucide-react";
import PageWrapper from "@/components/layouts/PageWrapper";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { PageHero } from "@/components/ui/PageHero";
import { trainingPrograms } from "@/data/trainingData";
import { createPageMetadata } from "@/lib/seo";

interface ProgramPageProps { params: Promise<{ program: string }> }

export async function generateStaticParams() {
  return trainingPrograms.map((program) => ({ program: program.slug }));
}

export async function generateMetadata({ params }: ProgramPageProps): Promise<Metadata> {
  const { program } = await params;
  const item = trainingPrograms.find((entry) => entry.slug === program);
  if (!item) return { title: "Training Program Not Found", robots: { index: false, follow: false } };
  return createPageMetadata({
    title: item.title,
    description: item.description,
    path: `/training/${item.slug}`,
  });
}

export default async function TrainingProgramPage({ params }: ProgramPageProps) {
  const { program } = await params;
  const item = trainingPrograms.find((entry) => entry.slug === program);
  if (!item) notFound();

  const audience = item.category === "Schools & Colleges" ? "Schools, colleges, students, teachers and parent groups" : item.category === "HRD Training" ? "Organizations, teams, professionals and managers" : "Students, young adults and development-focused groups";
  const themes = item.description.split(",").map((part) => part.replace(/^.*? on /i, "").replace(/\.$/, "").trim()).filter(Boolean).slice(0, 6);

  return (
    <PageWrapper>
      <Breadcrumb items={[{ label: "Training", href: "/training" }, { label: item.title }]} />
      <PageHero eyebrow={item.category} title={item.title} description={item.description} aside={<div className="rounded-[1.45rem] bg-primary p-5 sm:rounded-[1.7rem] sm:p-7 text-white"><Presentation className="h-6 w-6 text-accent" /><h2 className="mt-5 text-2xl font-extrabold">Customisable program format</h2><p className="mt-3 text-sm leading-6 text-white/65">Duration, examples and delivery style can be discussed around the audience and context.</p><Link href="/training#request" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-extrabold text-primary">Request this program</Link></div>} />

      <section className="section-space">
        <div className="container-shell grid gap-7 sm:gap-10 lg:grid-cols-[1fr_330px]">
          <div>
            <div className="eyebrow mb-5">Program focus</div>
            <h2 className="section-title">What the session can be built around</h2>
            <div className="mt-7 grid gap-2.5 sm:mt-8 sm:grid-cols-2 sm:gap-3">
              {(themes.length > 2 ? themes : [item.shortDescription, "Practical examples and guided reflection", "Action-oriented takeaways", "Audience participation and discussion"]).map((theme) => (
                <div key={theme} className="flex items-start gap-3 rounded-2xl border border-primary/8 bg-white p-4"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/7 text-primary"><Check className="h-3.5 w-3.5" /></span><span className="text-sm font-semibold leading-6 text-foreground/78">{theme}</span></div>
              ))}
            </div>

            <div className="mt-10 rounded-[1.45rem] bg-[#f0eee8] p-5 sm:mt-14 sm:rounded-[1.8rem] sm:p-9">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-primary">{item.category === "HRD Training" ? <Building2 className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}</div>
              <h2 className="mt-5 text-2xl font-extrabold text-primary">Designed for the audience in front of us</h2>
              <p className="mt-3 text-sm leading-7 text-muted">Suitable audience: {audience}. Final topic depth and examples can be adapted based on age group, professional context, participant count and available session time.</p>
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="premium-card p-5 sm:p-6">
              <p className="text-xs font-extrabold uppercase tracking-[.12em] text-secondary">Interested in this program?</p>
              <h3 className="mt-3 text-xl font-extrabold text-primary">Discuss the requirement directly</h3>
              <p className="mt-3 text-sm leading-6 text-muted">Share your organization, audience, location and preferred date through the training enquiry form.</p>
              <Link href="/training#request" className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-extrabold text-white"><MessageCircle className="h-4 w-4" /> Enquire now</Link>
            </div>
            <Link href="/training" className="mt-4 flex items-center gap-2 px-2 text-sm font-extrabold text-primary"><ArrowLeft className="h-4 w-4" /> All training programs</Link>
          </aside>
        </div>
      </section>
    </PageWrapper>
  );
}
