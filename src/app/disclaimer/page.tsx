import PageWrapper from "@/components/layouts/PageWrapper";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { PageHero } from "@/components/ui/PageHero";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Disclaimer",
  description: "Important information about the educational content, counselling guidance and services described on the Chetana website.",
  path: "/disclaimer",
});

export default function DisclaimerPage() {
  return (
    <PageWrapper>
      <Breadcrumb items={[{ label: "Disclaimer" }]} />
      <PageHero eyebrow="Important information" title="Disclaimer" description="Please read this information about the educational content and counselling guidance described on the Chetana website." />
      <section className="section-space"><div className="container-shell max-w-4xl"><div className="premium-card prose-premium p-6 sm:p-9">
        <h2>General information only</h2><p>Information on this website is intended to explain Chetana’s counselling, guidance and training services and to provide general educational reading. It does not constitute a medical or psychiatric diagnosis, treatment plan or emergency service.</p>
        <h2>Counselling and guidance</h2><p>Counselling can support reflection, decision-making, communication, coping, personal development and other areas described on the website. The appropriate form of support depends on the individual situation and may sometimes involve referral to another qualified professional or service.</p>
        <h2>No guaranteed outcomes</h2><p>No specific outcome, recovery, result or level of improvement is guaranteed. Individual experiences vary and are influenced by personal circumstances and many other factors.</p>
        <h2>Emergency situations</h2><p>Do not use this website or its enquiry forms for an immediate medical, psychiatric or safety emergency. If there is immediate danger or urgent need for care, contact appropriate local emergency services, a nearby hospital or another suitable emergency resource without waiting for a website response.</p>
        <h2>External websites</h2><p>The website may link to external services such as Google Maps or WhatsApp. Chetana does not control the content, availability or policies of those external services.</p>
        <h2>Service information</h2><p>Working hours, session formats, programs and other practical information can change. Contact the centre to confirm details that are important to your appointment or program planning.</p>
      </div></div></section>
    </PageWrapper>
  );
}
