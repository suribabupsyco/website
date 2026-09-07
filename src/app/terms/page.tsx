import Link from "next/link";
import PageWrapper from "@/components/layouts/PageWrapper";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { PageHero } from "@/components/ui/PageHero";
import { siteConfig } from "@/config/site";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Terms & Conditions",
  description: "Terms for using the Chetana Psychological Counselling Centre website and submitting counselling or training enquiries.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <PageWrapper>
      <Breadcrumb items={[{ label: "Terms & Conditions" }]} />
      <PageHero eyebrow="Website terms" title="Terms & Conditions" description="General terms for using the Chetana website and submitting enquiries through its forms and contact links." />
      <section className="section-space"><div className="container-shell max-w-4xl"><div className="premium-card prose-premium p-6 sm:p-9">
        <h2>1. Website use</h2><p>By using this website, you agree to use it lawfully and for its intended informational and enquiry purposes. Website content may be updated as services, schedules or program information changes.</p>
        <h2>2. Information on this website</h2><p>Website content is provided for general information about counselling, guidance and training services. It is not a substitute for individual medical, psychiatric, legal or emergency advice.</p>
        <h2>3. Appointment requests</h2><p>Submitting a booking form is a request for a session, not an automatic confirmation. Availability, date, time, format and other practical details are confirmed separately by the centre.</p>
        <h2>4. Session formats</h2><p>The website currently describes in-person, phone and online consultation options. Actual availability may depend on scheduling and the nature of the request.</p>
        <h2>5. Outcomes</h2><p>Counselling and training involve individual circumstances, participation and many factors outside the control of the centre. The website does not promise a specific result or guaranteed outcome.</p>
        <h2>6. Privacy and communications</h2><p>Information submitted through the website is handled as described in the <Link href="/privacy-policy" className="font-bold text-primary">Privacy Policy</Link>. When you submit an enquiry, you consent to being contacted about that request using the contact details you provide.</p>
        <h2>7. External links</h2><p>Links to services such as Google Maps, WhatsApp or other external websites are provided for convenience. Their content, availability, privacy practices and terms are controlled by those third parties.</p>
        <h2>8. Website availability</h2><p>Reasonable efforts are made to keep the website available and accurate, but uninterrupted access or error-free operation cannot be guaranteed.</p>
        <h2>9. Contact</h2><p>Questions about these website terms can be sent to <Link href={`mailto:${siteConfig.email}`} className="font-bold text-primary">{siteConfig.email}</Link> or discussed by phone at <Link href={`tel:${siteConfig.phoneRaw}`} className="font-bold text-primary">{siteConfig.phone}</Link>.</p>
        <p className="mt-8 text-xs">Last updated: September 2026.</p>
      </div></div></section>
    </PageWrapper>
  );
}
