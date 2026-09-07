import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock3, MessageCircle } from "lucide-react";
import PageWrapper from "@/components/layouts/PageWrapper";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { blogData } from "@/data/blogData";
import { createPageMetadata } from "@/lib/seo";

interface BlogPostPageProps { params: Promise<{ slug: string }> }
export const dynamic = "force-static";
export async function generateStaticParams() { return blogData.map((post) => ({ slug: post.slug })); }
export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = blogData.find((item) => item.slug === slug);
  return post
    ? createPageMetadata({
        title: post.title,
        description: post.excerpt,
        path: `/blog/${post.slug}`,
        type: "article",
        publishedTime: `${post.publishedAt}T00:00:00+05:30`,
        authors: ["Mr. Suri Babu Saragadam"],
      })
    : { title: "Article Not Found", robots: { index: false, follow: false } };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = blogData.find((item) => item.slug === slug);
  if (!post) notFound();
  const paragraphs = [...post.content.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((match) => match[1].trim());
  return (
    <PageWrapper>
      <Breadcrumb items={[{ label: "Resources", href: "/resources" }, { label: "Articles", href: "/blog" }, { label: post.title }]} />
      <article>
        <header className="relative overflow-hidden bg-[linear-gradient(135deg,#edf2ef,#f5eee4)]"><div className="container-shell max-w-4xl py-11 text-left sm:py-20 sm:text-center"><div className="eyebrow mb-5">{post.category}</div><h1 className="text-[clamp(2.25rem,10vw,3.15rem)] sm:text-[clamp(2.4rem,5vw,4.6rem)] font-[760] leading-[1.03] text-primary text-balance">{post.title}</h1><p className="lead-copy mt-6 max-w-2xl sm:mx-auto">{post.excerpt}</p><div className="mt-6 flex flex-wrap items-center justify-start gap-3 text-[10.5px] font-bold text-muted sm:mt-7 sm:justify-center sm:gap-4 sm:text-xs"><span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{new Date(`${post.publishedAt}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span><span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{post.readingTime}</span></div></div></header>
        <div className="container-shell grid max-w-5xl gap-8 py-10 sm:gap-10 sm:py-20 lg:grid-cols-[1fr_270px]">
          <div className="prose-premium text-[15px] sm:text-[16px]">{paragraphs.map((paragraph, index) => <p key={index} className="mb-6">{paragraph}</p>)}</div>
          <aside className="lg:sticky lg:top-28 lg:self-start"><div className="premium-card p-5 sm:p-6"><MessageCircle className="h-5 w-5 text-secondary" /><h2 className="mt-4 text-lg font-extrabold text-primary">Want to discuss this personally?</h2><p className="mt-2 text-sm leading-6 text-muted">Educational information is general. A counselling session can focus on your specific context.</p><Link href="/book-session" className="mt-5 flex min-h-11 items-center justify-center rounded-full bg-primary px-4 text-sm font-extrabold text-white">Book a session</Link></div></aside>
        </div>
        <div className="container-shell max-w-5xl pb-16"><Link href="/blog" className="inline-flex items-center gap-2 text-sm font-extrabold text-primary"><ArrowLeft className="h-4 w-4" /> Back to articles</Link></div>
      </article>
    </PageWrapper>
  );
}
