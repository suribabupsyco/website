"use client";

import type { FormType } from "@/lib/form-submission-types";
import { saveFormSubmission } from "@/lib/form-storage-client";
import { submitToFormSubmit } from "@/lib/form-submit-client";

interface ReliableFormSubmitInput {
  storage: {
    formType: FormType;
    formName: string;
    subject: string;
    data: Record<string, unknown>;
  };
  email: Record<string, string>;
}

/**
 * Send each website enquiry through two independent channels:
 * 1) the site's own persistent admin intake, and
 * 2) FormSubmit email delivery.
 *
 * Admin persistence is the acknowledgement source. Email remains independent,
 * but an email-only result must not be shown as an admin-panel success.
 */
export async function submitWebsiteEnquiry(input: ReliableFormSubmitInput) {
  const [storageResult, emailResult] = await Promise.allSettled([
    saveFormSubmission(input.storage),
    submitToFormSubmit(input.email),
  ]);

  const storageAccepted = storageResult.status === "fulfilled" && storageResult.value;
  const emailAccepted = emailResult.status === "fulfilled";

  if (!storageAccepted) {
    const emailReason = emailResult.status === "rejected" ? emailResult.reason : undefined;
    const storageReason = storageResult.status === "rejected" ? storageResult.reason : undefined;
    console.error("Website enquiry did not reach the admin intake.", {
      storageReason,
      emailReason,
    });
    throw new Error("Unable to submit enquiry.");
  }

  if (!emailAccepted) {
    console.warn("Enquiry was accepted by the admin intake, but the email notification failed.");
  }

  return { storageAccepted: Boolean(storageAccepted), emailAccepted };
}
