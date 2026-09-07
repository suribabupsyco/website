"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { familyCounsellingSchema } from "@/schemas/familyCounsellingSchema";
import type { FamilyCounsellingFormValues } from "@/schemas/familyCounsellingSchema";
import { cn } from "@/lib/utils";
import { submitWebsiteEnquiry } from "@/lib/reliable-form-submit";
import { useFormSuccessScroll } from "@/hooks/useFormSuccessScroll";
import { siteConfig, formSubjects, successMessages } from "@/config/site";
import { useState } from "react";
import { CheckCircle, User, Phone, Mail, Users, MessageSquare, Globe } from "lucide-react";

interface FamilyFormProps {
  onSuccess?: () => void;
}

export const FamilyForm = ({ onSuccess }: FamilyFormProps) => {
  const [submitStatus, setSubmitStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [submittedName, setSubmittedName] = useState("");
  useFormSuccessScroll(submitStatus, "family-form-success");
  const methods = useForm<FamilyCounsellingFormValues>({
    resolver: zodResolver(familyCounsellingSchema),
  });

  const onSubmit = async (data: FamilyCounsellingFormValues) => {
    setSubmitStatus("sending");
    try {
      await submitWebsiteEnquiry({
        storage: {
          formType: "family",
          formName: "Family Counselling Form",
          subject: formSubjects.family,
          data,
        },
        email: {
          _subject: formSubjects.family,
          "Form Name": "Family Counselling Form",
          Name: data.name,
          "Mobile Number": data.phone,
          "Email Address": data.email || "",
          "Primary Concern": data.primaryConcern,
          "Family Members": data.familyMembers.toString(),
          "Preferred Language": data.preferredLanguage,
          Message: data.message,
        }
      });

      setSubmittedName(data.name);
      setSubmitStatus("success");
      onSuccess?.();
    } catch {
      setSubmitStatus("error");
    }
  };

  if (submitStatus === "success") {
    return (
      <div id="family-form-success" role="status" aria-live="polite" tabIndex={-1} className="text-center py-12 outline-none">
        <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
        <h3 className="text-xl font-bold text-primary mb-2">Thank you, {submittedName}!</h3>
        <p className="font-medium text-foreground mb-3">Your family counselling enquiry was submitted successfully.</p>
        <p className="text-muted">{successMessages.family}</p>
      </div>
    );
  }

  return (
    <form onSubmit={methods.handleSubmit(onSubmit)} className="form-shell space-y-6">
      <div>
        <label className="block text-sm text-muted mb-2">Name *</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            {...methods.register("name")}
            type="text"
            className={cn("w-full rounded-xl pl-10 pr-4 py-3 bg-card border border-border/30", "focus:outline-none focus:ring-2 focus:ring-primary")}
            placeholder="Enter your name"
          />
        </div>
        {methods.formState.errors.name && <p className="text-xs text-red-500 mt-1">{methods.formState.errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-muted mb-2">Phone *</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              {...methods.register("phone")}
              type="tel"
              className={cn("w-full rounded-xl pl-10 pr-4 py-3 bg-card border border-border/30", "focus:outline-none focus:ring-2 focus:ring-primary")}
              placeholder="+91 99494 54939"
            />
          </div>
          {methods.formState.errors.phone && <p className="text-xs text-red-500 mt-1">{methods.formState.errors.phone.message}</p>}
        </div>

        <div>
          <label className="block text-sm text-muted mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              {...methods.register("email")}
              type="email"
              className={cn("w-full rounded-xl pl-10 pr-4 py-3 bg-card border border-border/30", "focus:outline-none focus:ring-2 focus:ring-primary")}
              placeholder="name@example.com"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm text-muted mb-2">Primary Concern *</label>
        <select
          {...methods.register("primaryConcern")}
          className={cn("w-full rounded-xl px-4 py-3 bg-card border border-border/30", "focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-10")}
        >
          <option value="">Select primary concern</option>
          <option value="communication-problems">Communication Problems</option>
          <option value="relationship-challenges">Relationship Challenges</option>
          <option value="emotional-disconnect">Emotional Disconnect</option>
          <option value="adjustment-difficulties">Adjustment Difficulties</option>
          <option value="parent-child-concerns">Parent-Child Concerns</option>
          <option value="conflict-management">Conflict Management</option>
        </select>
        {methods.formState.errors.primaryConcern && <p className="text-xs text-red-500 mt-1">{methods.formState.errors.primaryConcern.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-muted mb-2">Number of Family Members *</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              {...methods.register("familyMembers", { valueAsNumber: true })}
              type="number"
              className={cn("w-full rounded-xl pl-10 pr-4 py-3 bg-card border border-border/30", "focus:outline-none focus:ring-2 focus:ring-primary")}
              placeholder="e.g. 4"
              min={1}
              max={20}
            />
          </div>
          {methods.formState.errors.familyMembers && <p className="text-xs text-red-500 mt-1">{methods.formState.errors.familyMembers.message}</p>}
        </div>

        <div>
          <label className="block text-sm text-muted mb-2">Preferred Language *</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <select
              {...methods.register("preferredLanguage")}
              className={cn("w-full rounded-xl pl-10 pr-4 py-3 bg-card border border-border/30", "focus:outline-none focus:ring-2 focus:ring-primary appearance-none")}
            >
              <option value="">Select language</option>
              {siteConfig.languages.map((lang) => (
                <option key={lang} value={lang.toLowerCase()}>{lang}</option>
              ))}
            </select>
          </div>
          {methods.formState.errors.preferredLanguage && <p className="text-xs text-red-500 mt-1">{methods.formState.errors.preferredLanguage.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm text-muted mb-2">Message *</label>
        <div className="relative">
          <MessageSquare className="absolute left-3 top-4 w-4 h-4 text-muted" />
          <textarea
            {...methods.register("message")}
            rows={4}
            className={cn("w-full rounded-xl pl-10 pr-4 py-3 bg-card border border-border/30 resize-y", "focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]")}
            placeholder="How can we help your family?"
          />
        </div>
        {methods.formState.errors.message && <p className="text-xs text-red-500 mt-1">{methods.formState.errors.message.message}</p>}
      </div>

      <p className="text-xs text-muted/80">Your information will be used only to respond to your counselling enquiry and will be treated respectfully and confidentially.</p>

      <button
        type="submit"
        disabled={methods.formState.isSubmitting}
        className={cn("w-full rounded-full px-8 py-4 text-sm font-medium text-white", "bg-primary hover:bg-primary/90 disabled:opacity-60", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary")}
      >
        {methods.formState.isSubmitting ? "Sending..." : "Request Family Counselling"}
      </button>
    </form>
  );
};
