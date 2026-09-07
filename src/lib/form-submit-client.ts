"use client";

import { siteConfig } from "@/config/site";

type FormSubmitFields = Record<string, string>;

type FormSubmitResult = {
  success?: boolean | string;
  message?: string;
};

/**
 * Submit to FormSubmit without navigating away from the current page.
 *
 * FormSubmit recommends sending the exact form URL when a browser/referrer
 * policy prevents it from determining where the form originated. Without
 * this value FormSubmit can return "Unable to submit form" even though the
 * request itself is otherwise valid.
 */
export async function submitToFormSubmit(fields: FormSubmitFields) {
  const endpoint = siteConfig.formSubmitEndpoint.replace(
    "https://formsubmit.co/",
    "https://formsubmit.co/ajax/"
  );

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15_000);

  try {
    const payload: FormSubmitFields = {
      ...fields,
      _template: "table",
      // This fixes FormSubmit's common "Unable to submit form" error when
      // referrer information is restricted by the browser or hosting layer.
      _url: window.location.href,
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const result = (await response.json().catch(() => null)) as FormSubmitResult | null;
    const explicitlyFailed = result?.success === false || result?.success === "false";

    if (!response.ok || explicitlyFailed) {
      throw new Error(result?.message || `FormSubmit returned ${response.status}.`);
    }

    return true;
  } finally {
    window.clearTimeout(timeout);
  }
}
