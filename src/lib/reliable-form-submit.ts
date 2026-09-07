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
 * 1) the site's own JSON/admin intake, and
 * 2) FormSubmit email delivery.
 *
 * A temporary failure in one channel must not incorrectly tell the visitor
 * that their enquiry was lost when the other channel accepted it.
 */
export async function submitWebsiteEnquiry(input: ReliableFormSubmitInput) {
  const [storageResult, emailResult] = await Promise.allSettled([
    saveFormSubmission(input.storage),
    submitToFormSubmit(input.email),
  ]);

  const storageAccepted = storageResult.status === "fulfilled" && storageResult.value;
  const emailAccepted = emailResult.status === "fulfilled";

  if (!storageAccepted && !emailAccepted) {
    const emailReason = emailResult.status === "rejected" ? emailResult.reason : undefined;
    const storageReason = storageResult.status === "rejected" ? storageResult.reason : undefined;
    console.error("Website enquiry could not be accepted by either delivery channel.", {
      storageReason,
      emailReason,
    });
    throw new Error("Unable to submit enquiry.");
  }

  if (!storageAccepted) {
    console.warn("Enquiry email was accepted, but local admin persistence is queued/unavailable.");
  }
  if (!emailAccepted) {
    console.warn("Enquiry was accepted by the admin intake, but the email notification failed.");
  }

  return { storageAccepted: Boolean(storageAccepted), emailAccepted };
}
