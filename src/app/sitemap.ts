import type { MetadataRoute } from "next";
import { blogData } from "@/data/blogData";
import { servicesData } from "@/data/servicesData";
import { trainingPrograms } from "@/data/trainingData";
import { absoluteUrl } from "@/lib/seo";

const staticRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" },
  { path: "/about/counsellor", priority: 0.8, changeFrequency: "monthly" },
  { path: "/services", priority: 0.9, changeFrequency: "monthly" },
  { path: "/training", priority: 0.8, changeFrequency: "monthly" },
  { path: "/training/schools-colleges", priority: 0.8, changeFrequency: "monthly" },
  { path: "/training/hrd", priority: 0.8, changeFrequency: "monthly" },
  { path: "/resources", priority: 0.7, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.7, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.9, changeFrequency: "monthly" },
  { path: "/book-session", priority: 0.9, changeFrequency: "monthly" },
  { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/disclaimer", priority: 0.3, changeFrequency: "yearly" },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(route.path),
      priority: route.priority,
      changeFrequency: route.changeFrequency,
    })),
    ...servicesData.map((service) => ({
      url: absoluteUrl(`/services/${service.slug}`),
      priority: 0.8,
      changeFrequency: "monthly" as const,
    })),
    ...trainingPrograms.map((program) => ({
      url: absoluteUrl(`/training/${program.slug}`),
      priority: 0.7,
      changeFrequency: "monthly" as const,
    })),
    ...blogData.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.publishedAt,
      priority: 0.6,
      changeFrequency: "monthly" as const,
    })),
  ];
}
