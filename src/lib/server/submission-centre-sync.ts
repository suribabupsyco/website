import type { FormSubmissionRecord, SubmissionWorkflow } from "@/lib/form-submission-types";
import { createCentreRecord, readCentreStore, updateCentreRecord } from "@/lib/server/centre-store";

function pick(record: FormSubmissionRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = record.data[key];
    if (value !== null && value !== undefined && String(value).trim()) return String(value).trim();
  }
  return "";
}

function normalizeMode(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[_ ]+/g, "-");
  if (normalized === "in-person" || normalized === "inperson") return "In-person";
  if (normalized === "online") return "Online";
  if (normalized === "phone") return "Phone";
  return "Flexible";
}

function enquiryFor(record: FormSubmissionRecord) {
  const explicit = pick(record, "counsellingFor", "programInterested", "careerArea", "serviceInterested");
  if (explicit) return explicit;
  const map: Record<FormSubmissionRecord["formType"], string> = {
    appointment: "Counselling appointment",
    contact: "General contact",
    career: "Career counselling",
    student: "Student counselling",
    family: "Family counselling",
    workshop: "Workshop / training",
    callback: "Callback request",
  };
  return map[record.formType];
}

function leadStage(record: FormSubmissionRecord, hasClient: boolean) {
  if (record.status === "contacted") return "Contacted";
  if (record.status === "scheduled") return "Consultation booked";
  if (record.status === "closed") return hasClient ? "Converted" : "Lost";
  return "New";
}

export async function syncSubmissionToCentre(record: FormSubmissionRecord): Promise<SubmissionWorkflow | null> {
  // Contact messages deliberately remain a separate inbox flow.
  if (record.formType === "contact") return null;

  const fullName = pick(record, "fullName", "name", "studentName", "contactPerson", "parentName") || "Website visitor";
  const phone = pick(record, "phone");
  const email = pick(record, "email");
  const city = pick(record, "cityLocation", "city", "location");
  const rawMode = record.workflow?.scheduledMode || pick(record, "preferredSessionType", "preferredMode", "mode") || "Flexible";
  const mode = normalizeMode(rawMode);
  const service = enquiryFor(record);
  const concern = pick(record, "primaryConcern", "mainConcern", "careerArea", "briefMessage", "message", "requirements", "subject");
  const scheduledDate = record.workflow?.scheduledDate || pick(record, "preferredDate", "appointmentDate", "date");
  const scheduledTime = record.workflow?.scheduledTime || pick(record, "preferredTime", "appointmentTime", "time");
  const nextActionDate = record.workflow?.nextActionDate || "";

  let centreStore = await readCentreStore();
  let client = centreStore.clients.find((item) => item.sourceSubmissionId === record.id);

  // A client profile begins only when the enquiry is booked/active, or if the
  // admin already promoted it manually. New/contacted enquiries stay as leads.
  if (record.status === "scheduled") {
    if (!scheduledDate) throw new Error("Choose the confirmed date before marking this request as Booked / next step.");

    const consentValue = record.data.consent;
    const consentStatus = record.workflow?.consentStatus
      || (consentValue === true || String(consentValue).toLowerCase() === "true" ? "Received" : "Pending");
    const clientPayload = {
      fullName,
      phone,
      alternatePhone: "",
      email,
      dateOfBirth: pick(record, "dateOfBirth"),
      age: pick(record, "age"),
      gender: pick(record, "gender"),
      occupationOrClass: pick(record, "currentClass", "occupation"),
      schoolCollegeOrCompany: pick(record, "schoolCollege", "organizationName", "college", "school"),
      parentGuardianName: pick(record, "parentName", "guardianName"),
      relationship: "",
      city,
      address: pick(record, "address"),
      emergencyContact: "",
      counsellingFor: service,
      primaryConcern: concern,
      preferredLanguage: pick(record, "preferredLanguage"),
      preferredSessionType: rawMode,
      referralSource: `Website — ${record.formName}`,
      assignedCounsellor: "",
      status: "Active",
      consent: consentStatus,
      tags: record.formType,
      documents: "",
      notes: `Continuous website intake ${record.id.slice(0, 8)}. ${record.adminNotes || ""}`.trim(),
      sourceSubmissionId: record.id,
    };

    const syncedClient = client
      ? await updateCentreRecord("clients", client.id, clientPayload)
      : await createCentreRecord("clients", clientPayload);

    if (!syncedClient) throw new Error("Unable to create or update the Command Centre client profile.");
    client = syncedClient as unknown as NonNullable<typeof client>;
    centreStore = await readCentreStore();
  } else if (record.status === "closed" && client) {
    const completedClient = await updateCentreRecord("clients", client.id, {
      status: "Completed",
      consent: record.workflow?.consentStatus || client.consent || "Pending",
      notes: `Website intake closed. ${record.adminNotes || ""}`.trim(),
    });
    if (completedClient) client = completedClient as unknown as NonNullable<typeof client>;
    centreStore = await readCentreStore();
  } else if (client && record.workflow?.consentStatus) {
    const consentUpdatedClient = await updateCentreRecord("clients", client.id, {
      consent: record.workflow.consentStatus,
    });
    if (consentUpdatedClient) client = consentUpdatedClient as unknown as NonNullable<typeof client>;
    centreStore = await readCentreStore();
  }

  const existingLead = centreStore.leads.find((item) => item.sourceSubmissionId === record.id);
  const leadPayload = {
    fullName,
    phone,
    email,
    source: "Website",
    enquiryFor: service,
    preferredMode: rawMode,
    assignedTo: existingLead?.assignedTo || "",
    stage: leadStage(record, Boolean(client)),
    priority: existingLead?.priority || "Normal",
    nextFollowUp: nextActionDate || (record.status === "scheduled" ? scheduledDate : ""),
    estimatedValue: existingLead?.estimatedValue || 0,
    city,
    notes: `Website intake • ${record.formName} • received ${record.submittedAt}${concern ? ` • ${concern}` : ""}`.slice(0, 10_000),
    convertedClientId: record.status === "closed" && client ? client.id : existingLead?.convertedClientId || "",
    sourceSubmissionId: record.id,
  };

  const lead = existingLead
    ? await updateCentreRecord("leads", existingLead.id, leadPayload)
    : await createCentreRecord("leads", leadPayload);
  if (!lead) throw new Error("Unable to sync the website request to the CRM pipeline.");

  let appointmentId = record.workflow?.appointmentId || "";
  if (record.status === "scheduled" && client) {
    centreStore = await readCentreStore();
    const existingAppointment = centreStore.appointments.find((item) => item.sourceSubmissionId === record.id)
      || centreStore.appointments.find((item) => item.clientId === client?.id && item.date === scheduledDate && item.time === scheduledTime);
    const appointmentPayload = {
      clientId: client.id,
      clientName: client.fullName,
      date: scheduledDate,
      time: scheduledTime,
      purpose: concern || service || "Website counselling enquiry",
      counsellor: existingAppointment?.counsellor || "",
      mode,
      location: city,
      status: "Scheduled",
      reminderStatus: existingAppointment?.reminderStatus || "Not sent",
      notes: `Created automatically from ${record.formName}. Website enquiry ID: ${record.id}.`,
      sourceSubmissionId: record.id,
    };
    const appointment = existingAppointment
      ? await updateCentreRecord("appointments", existingAppointment.id, appointmentPayload)
      : await createCentreRecord("appointments", appointmentPayload);
    if (!appointment) throw new Error("Unable to create or update the Command Centre appointment.");
    appointmentId = String((appointment as unknown as Record<string, unknown>).id || "");
  }

  const leadRecord = lead as unknown as Record<string, unknown>;
  return {
    ...record.workflow,
    centreLeadId: String(leadRecord.id || ""),
    centreLeadCode: String(leadRecord.leadCode || ""),
    nextActionDate,
    centreClientId: client?.id || record.workflow?.centreClientId || "",
    centreClientCode: client?.clientCode || record.workflow?.centreClientCode || "",
    appointmentId,
    scheduledDate: record.status === "scheduled" ? scheduledDate : record.workflow?.scheduledDate,
    scheduledTime: record.status === "scheduled" ? scheduledTime : record.workflow?.scheduledTime,
    scheduledMode: record.status === "scheduled" ? mode : record.workflow?.scheduledMode,
    promotedAt: client ? (record.workflow?.promotedAt || new Date().toISOString()) : record.workflow?.promotedAt,
  };
}

// Kept for compatibility with any older code paths.
export async function syncScheduledSubmissionToCentre(record: FormSubmissionRecord) {
  if (record.status !== "scheduled") return null;
  return syncSubmissionToCentre(record);
}
