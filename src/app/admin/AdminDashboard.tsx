"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import greenLogo from "../../../logo-green.png";
import {
  CalendarDays,
  CheckCircle2,
  CheckCheck,
  ChevronRight,
  Clock3,
  Download,
  FileJson,
  HardDrive,
  Inbox,
  LayoutDashboard,
  UsersRound,
  NotebookTabs,
  CalendarCheck2,
  BellRing,
  IndianRupee,
  ReceiptText,
  UserCog,
  ListTodo,
  BarChart3,
  DatabaseBackup,
  LogOut,
  Mail,
  MessageCircle,
  Menu,
  Phone,
  Copy,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  UserPlus,
  X,
} from "lucide-react";
import { formTypeLabels, type FormSubmissionRecord, type FormType, type SubmissionCommunication, type SubmissionCommunicationChannel, type SubmissionStatus } from "@/lib/form-submission-types";
import CentreManagement, { centreRouteMeta, isCentreAdminRoute } from "./CentreManagement";

interface SessionState {
  loading: boolean;
  configured: boolean;
  authenticated: boolean;
  username: string;
}

const statusLabels: Record<SubmissionStatus, string> = {
  new: "New request",
  contacted: "Contacted / follow-up",
  scheduled: "Booked / next step",
  closed: "Completed / closed",
};

const contactStatusLabels: Record<SubmissionStatus, string> = {
  new: "New message",
  contacted: "Replied / handling",
  scheduled: "Follow-up needed",
  closed: "Resolved",
};

function submissionStatusLabel(record: FormSubmissionRecord) {
  return (record.formType === "contact" ? contactStatusLabels : statusLabels)[record.status];
}

const statusClasses: Record<SubmissionStatus, string> = {
  new: "bg-amber-50 text-amber-800 border-amber-200",
  contacted: "bg-sky-50 text-sky-800 border-sky-200",
  scheduled: "bg-emerald-50 text-emerald-800 border-emerald-200",
  closed: "bg-slate-100 text-slate-700 border-slate-200",
};

function prettyLabel(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function valueText(value: string | number | boolean | null) {
  if (value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function getIdentity(record: FormSubmissionRecord) {
  const data = record.data;
  const nameKeys = ["fullName", "name", "studentName", "contactPerson", "parentName"];
  const emailKeys = ["email"];
  const phoneKeys = ["phone"];

  const find = (keys: string[]) => {
    for (const key of keys) {
      const value = data[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
  };

  return { name: find(nameKeys) || "Website Visitor", email: find(emailKeys), phone: find(phoneKeys) };
}

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function relativeDay(value: string) {
  const date = new Date(value);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const submitted = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((today - submitted) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}


type ClientMessageTemplate = "received" | "follow-up" | "booking" | "reminder" | "consent-request" | "consent-received" | "completion" | "custom";

const messageTemplateLabels: Record<ClientMessageTemplate, string> = {
  received: "Request received",
  "follow-up": "Follow-up message",
  booking: "Booking confirmation",
  reminder: "Appointment reminder",
  "consent-request": "Consent request",
  "consent-received": "Consent received",
  completion: "Completion / next steps",
  custom: "Custom message",
};

const consentOptions = ["Not recorded", "Not required", "Pending", "Requested", "Received", "Declined"] as const;

function pickSubmissionValue(data: FormSubmissionRecord["data"], ...keys: string[]) {
  for (const key of keys) {
    const value = data[key];
    if (value !== null && value !== undefined && String(value).trim()) return String(value).trim();
  }
  return "";
}

function friendlyDate(value: string) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function normalizeWhatsAppNumber(value: string) {
  let digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 13 && digits.startsWith("091")) digits = digits.slice(1);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  return digits;
}

function inferConsentStatus(record: FormSubmissionRecord) {
  if (record.workflow?.consentStatus) return record.workflow.consentStatus;
  const value = record.data.consent;
  if (value === true || String(value).toLowerCase() === "true" || String(value).toLowerCase() === "yes") return "Received";
  if (value === false || String(value).toLowerCase() === "false" || String(value).toLowerCase() === "no") return "Pending";
  return "Not recorded";
}

function defaultMessageTemplate(status: SubmissionStatus, isContact: boolean): ClientMessageTemplate {
  if (isContact) {
    if (status === "closed") return "completion";
    if (status === "contacted" || status === "scheduled") return "follow-up";
    return "received";
  }
  if (status === "scheduled") return "booking";
  if (status === "contacted") return "follow-up";
  if (status === "closed") return "completion";
  return "received";
}

function buildClientMessage(input: {
  record: FormSubmissionRecord;
  data: FormSubmissionRecord["data"];
  status: SubmissionStatus;
  template: ClientMessageTemplate;
  scheduledDate: string;
  scheduledTime: string;
  scheduledMode: string;
  nextActionDate: string;
  contactNextActionDate: string;
  consentStatus: string;
}) {
  const { record, data, template, scheduledDate, scheduledTime, scheduledMode, nextActionDate, contactNextActionDate, consentStatus } = input;
  const identity = getIdentity({ ...record, data });
  const name = identity.name === "Website Visitor" ? "there" : identity.name.split(/\s+/)[0];
  const service = pickSubmissionValue(data, "counsellingFor", "programInterested", "careerArea", "serviceInterested") || record.formName.replace(/\s*Form$/i, "");
  const sessionDate = friendlyDate(scheduledDate);
  const nextDate = friendlyDate(record.formType === "contact" ? contactNextActionDate : nextActionDate);
  const greeting = `Hello ${name},`;
  const closing = "Regards,\nChetana Psychological Counselling Centre";
  const consentLine = consentStatus === "Pending" || consentStatus === "Requested"
    ? "Please also complete/confirm the required counselling consent before the session. "
    : "";

  if (template === "follow-up") {
    return {
      purpose: "Follow-up",
      subject: `Follow-up from Chetana — ${service}`,
      body: `${greeting}\n\nWe are following up regarding your ${service} request.${nextDate ? ` Our next follow-up is planned for ${nextDate}.` : ""} If you need a different time or have any questions, please reply to this message.\n\n${closing}`,
    };
  }
  if (template === "booking") {
    const timing = sessionDate ? `${sessionDate}${scheduledTime ? ` at ${scheduledTime}` : ""}` : "the confirmed date/time";
    return {
      purpose: "Booking confirmation",
      subject: `Chetana appointment confirmation — ${service}`,
      body: `${greeting}\n\nYour ${service} session is confirmed for ${timing}.${scheduledMode ? ` Mode: ${scheduledMode}.` : ""} ${consentLine}If you need to reschedule, please let us know as early as possible.\n\n${closing}`,
    };
  }
  if (template === "reminder") {
    const timing = sessionDate ? `${sessionDate}${scheduledTime ? ` at ${scheduledTime}` : ""}` : "your scheduled time";
    return {
      purpose: "Appointment reminder",
      subject: `Reminder: Chetana session — ${timing}`,
      body: `${greeting}\n\nThis is a reminder for your ${service} session on ${timing}.${scheduledMode ? ` Mode: ${scheduledMode}.` : ""} ${consentLine}Please be ready / arrive about 10 minutes before the scheduled time.\n\n${closing}`,
    };
  }
  if (template === "consent-request") {
    return {
      purpose: "Consent request",
      subject: `Consent required — Chetana ${service}`,
      body: `${greeting}\n\nBefore we proceed with your ${service} counselling/session, we need your required consent confirmation. Current consent status: ${consentStatus === "Not recorded" ? "Pending" : consentStatus}. Please review the consent information shared by the centre and confirm it before the session. If anything is unclear, reply and we will explain it.\n\n${closing}`,
    };
  }
  if (template === "consent-received") {
    return {
      purpose: "Consent acknowledgement",
      subject: `Consent received — Chetana ${service}`,
      body: `${greeting}\n\nThank you. We have recorded your consent for the ${service} counselling/session. Your consent status is now Received. We will continue with the next scheduled or follow-up step and contact you if anything else is required.\n\n${closing}`,
    };
  }
  if (template === "completion") {
    return {
      purpose: record.formType === "contact" ? "Contact resolved" : "Completion / next steps",
      subject: `Update from Chetana — ${service}`,
      body: `${greeting}\n\nYour current ${record.formType === "contact" ? "message/request" : service + " request"} has been updated as completed. If you need another follow-up, a new appointment, or further support, you can reply to this message and we will assist you.\n\n${closing}`,
    };
  }
  if (template === "custom") return { purpose: "Custom message", subject: `Chetana — ${service}`, body: "" };
  return {
    purpose: "Request acknowledgement",
    subject: `We received your request — Chetana ${service}`,
    body: `${greeting}\n\nWe have received your ${record.formType === "contact" ? "message" : service + " request"}. Our team will review it and contact you about the next step.${nextDate ? ` The next action is planned for ${nextDate}.` : ""}\n\n${closing}`,
  };
}

function localDateTimeParts(value: string) {
  const date = new Date(value);
  const pad = (number: number) => String(number).padStart(2, "0");
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

function LoginScreen({ session, onLogin }: { session: SessionState; onLogin: () => void }) {
  const [username, setUsername] = useState(session.username || "admin");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to sign in.");
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#102f34] px-4 py-8 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 10%, #e3c08d 0, transparent 28%), radial-gradient(circle at 90% 80%, #5d8079 0, transparent 30%)" }} />
      <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)", backgroundSize: "42px 42px" }} />

      <section className="relative w-full max-w-[1040px] overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-[0_40px_120px_rgba(0,0,0,.35)] grid lg:grid-cols-[1.05fr_.95fr]">
        <div className="hidden lg:flex bg-[#173f45] text-white p-12 flex-col justify-between min-h-[650px] relative overflow-hidden">
          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full border border-white/10" />
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold tracking-[0.15em] uppercase text-white/85">
              <Sparkles className="h-3.5 w-3.5" /> Private Admin Portal
            </div>
            <h1 className="mt-8 text-5xl font-semibold leading-[1.05] tracking-[-0.04em]">Every client. Every enquiry.<br />One calm workspace.</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-white/70">Manage website enquiries and the centre's internal client, counselling, appointment and operations records in your own JSON storage.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4"><HardDrive className="h-5 w-5 text-[#e3c08d]" /><div className="mt-3 text-sm font-semibold">JSON Storage</div><div className="mt-1 text-xs text-white/55">No database required</div></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4"><ShieldCheck className="h-5 w-5 text-[#e3c08d]" /><div className="mt-3 text-sm font-semibold">Private Access</div><div className="mt-1 text-xs text-white/55">Password protected</div></div>
          </div>
        </div>

        <div className="p-7 sm:p-10 lg:p-12 flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-full border border-[#173f45]/10 shadow-sm">
              <Image src={greenLogo} alt="Chetana" className="h-full w-full object-cover" />
            </div>
            <div><div className="text-sm font-bold text-[#173f45]">Chetana</div><div className="text-xs text-slate-500">Administration</div></div>
          </div>

          <div className="mt-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5d8079]">Secure sign in</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-slate-900">Welcome back</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to manage website enquiries and centre operations.</p>
          </div>

          {!session.configured && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              Admin credentials are not configured yet. Set <code className="font-semibold">ADMIN_PASSWORD</code> and <code className="font-semibold">ADMIN_SESSION_SECRET</code> using <code className="font-semibold">.env.example</code> before signing in.
            </div>
          )}

          <form onSubmit={login} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Username</span>
              <div className="relative"><UserRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-[#5d8079] focus:bg-white focus:ring-4 focus:ring-[#5d8079]/10" /></div>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
              <div className="relative"><ShieldCheck className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-[#5d8079] focus:bg-white focus:ring-4 focus:ring-[#5d8079]/10" /></div>
            </label>
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <button disabled={submitting || !session.configured} className="h-13 w-full rounded-xl bg-[#173f45] text-sm font-bold text-white shadow-lg shadow-[#173f45]/15 transition hover:bg-[#102f34] disabled:cursor-not-allowed disabled:opacity-50">
              {submitting ? "Signing in…" : "Sign in to dashboard"}
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-slate-400">Protected access • Session expires automatically</p>
        </div>
      </section>
    </main>
  );
}

function DetailPanel({ record, onClose, onSaved }: { record: FormSubmissionRecord; onClose: () => void; onSaved: (record: FormSubmissionRecord) => void }) {
  const [status, setStatus] = useState<SubmissionStatus>(record.status);
  const [notes, setNotes] = useState(record.adminNotes || "");
  const [data, setData] = useState(record.data);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [scheduledMode, setScheduledMode] = useState("In-person");
  const [contactNextActionDate, setContactNextActionDate] = useState("");
  const [nextActionDate, setNextActionDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [clientImporting, setClientImporting] = useState(false);
  const [clientImportedCode, setClientImportedCode] = useState("");
  const [consentStatus, setConsentStatus] = useState("Not recorded");
  const [messageTemplate, setMessageTemplate] = useState<ClientMessageTemplate>(defaultMessageTemplate(record.status, record.formType === "contact"));
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [communicationHistory, setCommunicationHistory] = useState<SubmissionCommunication[]>([]);
  const [communicationBusy, setCommunicationBusy] = useState("");
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const identity = getIdentity({ ...record, data });
  const isContact = record.formType === "contact";

  const pickData = useCallback((...keys: string[]) => {
    for (const key of keys) {
      const value = record.data[key];
      if (value !== null && value !== undefined && String(value).trim()) return String(value).trim();
    }
    return "";
  }, [record.data]);

  useEffect(() => {
    setStatus(record.status);
    setNotes(record.adminNotes || "");
    setData(record.data);
    setScheduledDate(record.workflow?.scheduledDate || pickData("preferredDate", "appointmentDate", "date"));
    setScheduledTime(record.workflow?.scheduledTime || pickData("preferredTime", "appointmentTime", "time"));
    setScheduledMode(record.workflow?.scheduledMode || pickData("preferredSessionType", "mode") || "In-person");
    const loadedScheduledDate = record.workflow?.scheduledDate || pickData("preferredDate", "appointmentDate", "date");
    const loadedScheduledTime = record.workflow?.scheduledTime || pickData("preferredTime", "appointmentTime", "time");
    const loadedScheduledMode = record.workflow?.scheduledMode || pickData("preferredSessionType", "mode") || "In-person";
    const loadedNextActionDate = record.workflow?.nextActionDate || "";
    const loadedContactNextActionDate = record.workflow?.contactNextActionDate || "";
    const loadedConsentStatus = inferConsentStatus(record);
    const loadedTemplate = defaultMessageTemplate(record.status, record.formType === "contact");
    setContactNextActionDate(loadedContactNextActionDate);
    setNextActionDate(loadedNextActionDate);
    setClientImportedCode(record.workflow?.centreClientCode || "");
    setConsentStatus(loadedConsentStatus);
    setCommunicationHistory(record.workflow?.communications || []);
    setMessageTemplate(loadedTemplate);
    const message = buildClientMessage({
      record,
      data: record.data,
      status: record.status,
      template: loadedTemplate,
      scheduledDate: loadedScheduledDate,
      scheduledTime: loadedScheduledTime,
      scheduledMode: loadedScheduledMode,
      nextActionDate: loadedNextActionDate,
      contactNextActionDate: loadedContactNextActionDate,
      consentStatus: loadedConsentStatus,
    });
    setMessageSubject(message.subject);
    setMessageBody(message.body);
    setCopied(false);
    setError("");
  }, [record, pickData]);

  const updateField = (key: string, value: string) => {
    const original = data[key];
    let next: string | number | boolean | null = value;
    if (typeof original === "number") next = value === "" ? 0 : Number(value);
    if (typeof original === "boolean") next = value === "true";
    setData((current) => ({ ...current, [key]: next }));
  };

  const buildCurrentMessage = (template = messageTemplate, statusOverride = status) => buildClientMessage({
    record,
    data,
    status: statusOverride,
    template,
    scheduledDate,
    scheduledTime,
    scheduledMode,
    nextActionDate,
    contactNextActionDate,
    consentStatus,
  });

  const applyMessageTemplate = (template: ClientMessageTemplate) => {
    setMessageTemplate(template);
    if (template === "custom") return;
    const message = buildCurrentMessage(template);
    setMessageSubject(message.subject);
    setMessageBody(message.body);
    setCopied(false);
  };

  const handleStatusChange = (nextStatus: SubmissionStatus) => {
    setStatus(nextStatus);
    const nextTemplate = defaultMessageTemplate(nextStatus, isContact);
    setMessageTemplate(nextTemplate);
    const message = buildCurrentMessage(nextTemplate, nextStatus);
    setMessageSubject(message.subject);
    setMessageBody(message.body);
    setCopied(false);
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageBody);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Unable to copy the message. You can still select and copy the text manually.");
    }
  };

  const persistCommunicationHistory = async (history: SubmissionCommunication[], extraWorkflow: Record<string, unknown> = {}) => {
    const response = await fetch(`/api/form-submissions/${record.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflow: { communications: history, ...extraWorkflow } }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Unable to update communication history.");
    const updated = body.submission as FormSubmissionRecord;
    setCommunicationHistory(updated.workflow?.communications || history);
    onSaved(updated);
    return updated;
  };

  const openCommunication = async (channel: SubmissionCommunicationChannel) => {
    setError("");
    setSuccess("");
    const liveIdentity = getIdentity({ ...record, data });
    const recipient = channel === "whatsapp" ? normalizeWhatsAppNumber(liveIdentity.phone) : liveIdentity.email.trim();
    if (!recipient) {
      setError(channel === "whatsapp" ? "Add a valid client phone number before opening WhatsApp." : "Add a client email address before opening email.");
      return;
    }
    if (!messageBody.trim()) {
      setError("Add a message before sending.");
      return;
    }

    const message = buildCurrentMessage();
    const subject = messageSubject.trim() || message.subject;
    const purpose = messageTemplate === "custom" ? "Custom message" : message.purpose;
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const openedAt = new Date().toISOString();
    const event: SubmissionCommunication = {
      id,
      channel,
      purpose,
      subject,
      message: messageBody.trim(),
      recipient: channel === "whatsapp" ? `+${recipient}` : recipient,
      status: "opened",
      openedAt,
    };
    const nextHistory = [...communicationHistory, event].slice(-100);
    setCommunicationHistory(nextHistory);

    const url = channel === "whatsapp"
      ? `https://wa.me/${recipient}?text=${encodeURIComponent(messageBody.trim())}`
      : `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageBody.trim())}`;
    window.open(url, "_blank", "noopener,noreferrer");

    setCommunicationBusy(channel);
    try {
      const consentPatch = messageTemplate === "consent-request" && consentStatus !== "Received"
        ? { consentStatus: "Requested", consentStatusUpdatedAt: openedAt }
        : {};
      if (messageTemplate === "consent-request" && consentStatus !== "Received") setConsentStatus("Requested");
      await persistCommunicationHistory(nextHistory, consentPatch);
      setSuccess(`${channel === "whatsapp" ? "WhatsApp" : "Email"} opened with the complete message ready. After you press Send in the app, mark it as sent below.`);
    } catch (err) {
      setError(err instanceof Error ? `${err.message} The message window was still opened.` : "The message window was opened, but the history could not be saved.");
    } finally {
      setCommunicationBusy("");
    }
  };

  const markCommunicationSent = async (item: SubmissionCommunication) => {
    if (item.status === "sent") return;
    setCommunicationBusy(item.id);
    setError("");
    setSuccess("");
    const sentAt = new Date().toISOString();
    let nextHistory = communicationHistory.map((entry) => entry.id === item.id ? { ...entry, status: "sent" as const, sentAt } : entry);
    setCommunicationHistory(nextHistory);
    try {
      let updated = await persistCommunicationHistory(nextHistory);
      if (!isContact && !item.centreCommunicationId) {
        const parts = localDateTimeParts(sentAt);
        const centreResponse = await fetch("/api/centre-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            collection: "communications",
            data: {
              clientId: updated.workflow?.centreClientId || "",
              clientName: getIdentity(updated).name,
              sourceSubmissionId: record.id,
              sourceCommunicationId: item.id,
              recipient: item.recipient,
              subject: item.subject,
              communicationDate: parts.date,
              communicationTime: parts.time,
              channel: item.channel === "whatsapp" ? "WhatsApp" : "Email",
              direction: "Outgoing",
              purpose: item.purpose || "Client update",
              staff: "Admin",
              outcome: item.message,
              nextActionDate: updated.workflow?.nextActionDate || "",
              status: "Completed",
              notes: `Sent from website enquiry ${record.id.slice(0, 8)} to ${item.recipient}.`,
            },
          }),
        });
        const centreBody = await centreResponse.json();
        if (centreResponse.ok && centreBody.record?.id) {
          nextHistory = nextHistory.map((entry) => entry.id === item.id ? { ...entry, centreCommunicationId: String(centreBody.record.id) } : entry);
          updated = await persistCommunicationHistory(nextHistory);
        }
      }
      setSuccess(`${item.channel === "whatsapp" ? "WhatsApp" : "Email"} marked as sent${isContact ? " in the Contact Inbox history" : " and added to the communication history"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to mark the message as sent.");
    } finally {
      setCommunicationBusy("");
    }
  };

  const createClientProfile = async () => {
    setClientImporting(true);
    setError("");
    setSuccess("");
    try {
      const pick = (...keys: string[]) => {
        for (const key of keys) {
          const value = data[key];
          if (value !== null && value !== undefined && String(value).trim()) return String(value).trim();
        }
        return "";
      };
      const consentValue = data.consent;
      const clientData = {
        fullName: pick("fullName", "name", "studentName", "contactPerson") || identity.name,
        phone: pick("phone") || identity.phone,
        alternatePhone: "",
        email: pick("email") || identity.email,
        dateOfBirth: "",
        age: pick("age"),
        gender: pick("gender"),
        occupationOrClass: pick("currentClass"),
        schoolCollegeOrCompany: pick("schoolCollege", "organizationName"),
        parentGuardianName: pick("parentName"),
        relationship: "",
        city: pick("cityLocation", "city", "location"),
        address: "",
        emergencyContact: "",
        counsellingFor: pick("counsellingFor", "programInterested") || record.formName.replace(" Form", ""),
        primaryConcern: pick("primaryConcern", "mainConcern", "careerArea", "briefMessage", "message", "requirements"),
        preferredLanguage: pick("preferredLanguage"),
        preferredSessionType: pick("preferredSessionType"),
        referralSource: `Website — ${record.formName}`,
        assignedCounsellor: "",
        status: "New",
        consent: consentStatus !== "Not recorded" ? consentStatus : (consentValue === true || String(consentValue).toLowerCase() === "true" ? "Received" : "Pending"),
        tags: record.formType,
        documents: "",
        notes: `Created from website enquiry received ${dateLabel(record.submittedAt)}.`,
        sourceSubmissionId: record.id,
      };
      const response = await fetch("/api/centre-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: "clients", data: clientData }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to create client profile.");
      setClientImportedCode(body.record?.clientCode || "Created");
      const linkResponse = await fetch(`/api/form-submissions/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow: { centreClientId: body.record?.id || "", centreClientCode: body.record?.clientCode || "" } }),
      });
      const linkBody = await linkResponse.json();
      if (linkResponse.ok && linkBody.submission) onSaved(linkBody.submission);
      setSuccess(`Client profile ${body.record?.clientCode || "created"} is ready in the Command Centre.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create client profile.");
    } finally {
      setClientImporting(false);
    }
  };

  const save = async () => {
    if (!isContact && status === "scheduled" && !scheduledDate) {
      setError("Choose the confirmed date before moving this request to Booked / next step.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/form-submissions/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminNotes: notes,
          data,
          workflow: isContact
            ? { contactNextActionDate }
            : {
                scheduledDate,
                scheduledTime,
                scheduledMode,
                nextActionDate,
                consentStatus,
                ...(record.workflow?.consentStatus !== consentStatus ? { consentStatusUpdatedAt: new Date().toISOString() } : {}),
              },
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to save changes.");
      const updated = body.submission as FormSubmissionRecord;
      setScheduledDate(updated.workflow?.scheduledDate || scheduledDate);
      setScheduledTime(updated.workflow?.scheduledTime || scheduledTime);
      setScheduledMode(updated.workflow?.scheduledMode || scheduledMode);
      setClientImportedCode(updated.workflow?.centreClientCode || clientImportedCode);
      setConsentStatus(updated.workflow?.consentStatus || consentStatus);
      setCommunicationHistory(updated.workflow?.communications || communicationHistory);
      if (isContact) {
        setSuccess("Contact message updated in the separate Contact Inbox flow.");
      } else if (updated.status === "scheduled" && updated.workflow?.appointmentId) {
        setSuccess(`Booked and synced • ${updated.workflow.centreClientCode || "Client"} • appointment is now in Command Centre.`);
      } else if (updated.status === "closed") {
        setSuccess(`Workflow completed${updated.workflow?.centreLeadCode ? ` • ${updated.workflow.centreLeadCode}` : ""}. The history remains in Command Centre.`);
      } else {
        setSuccess(`Workflow synced${updated.workflow?.centreLeadCode ? ` • ${updated.workflow.centreLeadCode}` : ""}. Command Centre CRM is up to date.`);
      }
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const careFlow = [
    { key: "received", label: "Received", note: "Website form saved" },
    { key: "crm", label: "CRM live", note: "Command Centre lead" },
    { key: "followup", label: "Follow-up", note: "Contact & qualify" },
    { key: "booked", label: "Booked", note: "Client + calendar" },
    { key: "complete", label: "Complete", note: "History retained" },
  ];
  const careStep = status === "new" ? 1 : status === "contacted" ? 2 : status === "scheduled" ? 3 : 4;
  const contactFlow = [
    { key: "new", label: "Received", note: "Contact message" },
    { key: "contacted", label: "Responded", note: "Reply / call handled" },
    { key: "scheduled", label: "Follow-up", note: "Another action needed" },
    { key: "closed", label: "Resolved", note: "Contact request complete" },
  ];
  const contactStep = status === "new" ? 0 : status === "contacted" ? 1 : status === "scheduled" ? 2 : 3;
  const visibleData = Object.entries(data).filter(([key]) => !key.startsWith("_admin"));
  const selectableStatuses: SubmissionStatus[] = ["new", "contacted", "scheduled", "closed"];

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/35 backdrop-blur-sm flex justify-end" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="h-full w-full max-w-2xl bg-white shadow-[-30px_0_80px_rgba(15,23,42,.18)] flex flex-col animate-[slideIn_.2s_ease-out]">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-7 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#5d8079]"><Inbox className="h-3.5 w-3.5" /> {record.formName}</div>
            <h2 className="mt-2 truncate text-2xl font-semibold tracking-[-0.03em] text-slate-900">{identity.name}</h2>
            <p className="mt-1 text-sm text-slate-500">Received {dateLabel(record.submittedAt)}</p>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Close details"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          <div className="grid gap-3 sm:grid-cols-2">
            {identity.phone && <a href={`tel:${identity.phone}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-[#5d8079]/40"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400"><Phone className="h-3.5 w-3.5" /> Phone</div><div className="mt-2 text-sm font-semibold text-slate-800">{identity.phone}</div></a>}
            {identity.email && <a href={`mailto:${identity.email}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-[#5d8079]/40"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400"><Mail className="h-3.5 w-3.5" /> Email</div><div className="mt-2 truncate text-sm font-semibold text-slate-800">{identity.email}</div></a>}
          </div>

          <section className={`mt-5 rounded-2xl border p-4 ${isContact ? "border-sky-100 bg-sky-50/60" : "border-[#5d8079]/15 bg-[#173f45]/[0.035]"}`}>
            <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-bold text-slate-800">{isContact ? "Contact-only workflow" : "Continuous enquiry → centre flow"}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{isContact ? "General contact messages stay in their own inbox and never mix with counselling records automatically." : "Every service request is mirrored to CRM immediately. Each status change updates the same Command Centre flow; booking then creates the client and calendar item."}</p></div><CheckCircle2 className={`h-5 w-5 shrink-0 ${isContact ? "text-sky-600" : "text-[#5d8079]"}`} /></div>
            <div className={`mt-4 grid gap-2 ${isContact ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-5"}`}>
              {(isContact ? contactFlow : careFlow).map((step, index) => {
                const complete = isContact ? index < contactStep : index < careStep;
                const active = isContact ? index === contactStep : index === careStep;
                return <div key={step.key} className={`rounded-xl border px-3 py-3 ${complete || active ? "border-[#5d8079]/25 bg-white" : "border-slate-200/80 bg-white/50"}`}><div className="flex items-center gap-2"><span className={`grid h-5 w-5 place-items-center rounded-full text-[9px] font-bold ${complete ? "bg-emerald-100 text-emerald-700" : active ? "bg-[#173f45] text-white" : "bg-slate-100 text-slate-400"}`}>{complete ? "✓" : index + 1}</span><span className="text-[11px] font-bold text-slate-700">{step.label}</span></div><div className="mt-1.5 text-[10px] leading-4 text-slate-400">{step.note}</div></div>;
              })}
            </div>
          </section>

          <div className="mt-7">
            <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-slate-900">Submission details</h3><span className="text-[11px] font-semibold text-slate-400">Editable • saved to JSON</span></div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {visibleData.map(([key, value]) => (
                <label key={key} className={String(value ?? "").length > 80 ? "sm:col-span-2" : ""}>
                  <span className="mb-1.5 block text-xs font-bold text-slate-500">{prettyLabel(key)}</span>
                  {typeof value === "boolean" ? (
                    <select value={String(value)} onChange={(e) => updateField(key, e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#5d8079] focus:ring-4 focus:ring-[#5d8079]/10"><option value="true">Yes</option><option value="false">No</option></select>
                  ) : String(value ?? "").length > 80 ? (
                    <textarea rows={4} value={value === null ? "" : String(value)} onChange={(e) => updateField(key, e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-[#5d8079] focus:ring-4 focus:ring-[#5d8079]/10" />
                  ) : (
                    <input value={value === null ? "" : String(value)} onChange={(e) => updateField(key, e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#5d8079] focus:ring-4 focus:ring-[#5d8079]/10" />
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <label><span className="mb-2 block text-sm font-bold text-slate-800">{isContact ? "Contact status" : "Workflow stage"}</span><select value={status} onChange={(e) => handleStatusChange(e.target.value as SubmissionStatus)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-[#5d8079] focus:ring-4 focus:ring-[#5d8079]/10">{selectableStatuses.map((value) => <option key={value} value={value}>{isContact ? contactStatusLabels[value] : statusLabels[value]}</option>)}</select></label>
            <div><span className="mb-2 block text-sm font-bold text-slate-800">Record ID</span><div className="h-12 flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 font-mono text-xs text-slate-500 truncate">{record.id}</div></div>
          </div>


          {!isContact && status !== "scheduled" && status !== "closed" && (
            <section className="mt-5 rounded-2xl border border-[#5d8079]/15 bg-[#173f45]/[0.03] p-4">
              <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-bold text-slate-800">Next action</h3><p className="mt-1 text-xs leading-5 text-slate-500">Keep the same request moving. This date is written directly to the CRM lead so the Command Centre knows what needs attention next.</p></div><Clock3 className="h-5 w-5 shrink-0 text-[#5d8079]" /></div>
              <label className="mt-3 block max-w-xs"><span className="mb-1.5 block text-xs font-bold text-slate-600">Next follow-up date</span><input type="date" value={nextActionDate} onChange={(e) => setNextActionDate(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#5d8079] focus:ring-4 focus:ring-[#5d8079]/10" /></label>
              {record.workflow?.centreLeadCode && <div className="mt-3 text-[11px] font-semibold text-emerald-700">CRM linked • {record.workflow.centreLeadCode}</div>}
            </section>
          )}
          {!isContact && status === "scheduled" && (
            <section className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
              <div className="flex items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><CalendarCheck2 className="h-4 w-4" /></div><div><h3 className="text-sm font-bold text-slate-800">Book the next step</h3><p className="mt-1 text-xs leading-5 text-slate-500">The CRM lead already exists. Confirming the schedule now creates/reuses the client profile and places the appointment in the Command Centre calendar.</p></div></div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label><span className="mb-1.5 block text-xs font-bold text-slate-600">Date *</span><input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="h-11 w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-emerald-100" /></label>
                <label><span className="mb-1.5 block text-xs font-bold text-slate-600">Time</span><input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="h-11 w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-emerald-100" /></label>
                <label><span className="mb-1.5 block text-xs font-bold text-slate-600">Mode</span><select value={scheduledMode} onChange={(e) => setScheduledMode(e.target.value)} className="h-11 w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-emerald-100"><option>In-person</option><option>Online</option><option>Phone</option><option>Flexible</option></select></label>
              </div>
              {record.workflow?.appointmentId && <div className="mt-3 rounded-xl bg-white px-3 py-2 text-[11px] font-semibold text-emerald-700">Already linked to Command Centre • {record.workflow.centreClientCode || "Client profile"} • Appointment synced</div>}
            </section>
          )}

          {isContact && status !== "closed" && (
            <section className="mt-5 rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
              <h3 className="text-sm font-bold text-slate-800">Contact follow-up</h3><p className="mt-1 text-xs leading-5 text-slate-500">This stays only in the Contact Inbox. It does not create CRM, client, appointment or counselling records automatically.</p>
              <label className="mt-3 block max-w-xs"><span className="mb-1.5 block text-xs font-bold text-slate-600">Next action date</span><input type="date" value={contactNextActionDate} onChange={(e) => setContactNextActionDate(e.target.value)} className="h-11 w-full rounded-xl border border-sky-200 bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-sky-100" /></label>
            </section>
          )}

          {!isContact && (
            <section className="mt-5 rounded-2xl border border-violet-200 bg-violet-50/45 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-violet-700" /><h3 className="text-sm font-bold text-slate-800">Consent tracking</h3></div>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">Track whether consent is required, requested, received or declined for this client journey. The status stays with the same website request and can be included in client messages.</p>
                </div>
                <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold ${consentStatus === "Received" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : consentStatus === "Declined" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>{consentStatus}</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <label><span className="mb-1.5 block text-xs font-bold text-slate-600">Consent status</span><select value={consentStatus} onChange={(e) => setConsentStatus(e.target.value)} className="h-11 w-full rounded-xl border border-violet-200 bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-violet-100">{consentOptions.map((value) => <option key={value}>{value}</option>)}</select></label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => applyMessageTemplate("consent-request")} className="inline-flex h-11 items-center gap-2 rounded-xl border border-violet-200 bg-white px-3 text-xs font-bold text-violet-700 hover:bg-violet-50"><Mail className="h-4 w-4" /> Prepare consent request</button>
                  {consentStatus === "Received" && <button type="button" onClick={() => applyMessageTemplate("consent-received")} className="inline-flex h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-50"><CheckCheck className="h-4 w-4" /> Acknowledge consent</button>}
                </div>
              </div>
              <p className="mt-3 text-[10px] leading-4 text-slate-400">{record.workflow?.consentStatusUpdatedAt ? `Last consent update: ${dateLabel(record.workflow.consentStatusUpdatedAt)}` : data.consent !== undefined ? "Initial consent state was read from the submitted form; save to confirm any admin change." : "This form did not capture a consent field, so the admin can track it here when required."}</p>
            </section>
          )}

          <section className="mt-5 overflow-hidden rounded-2xl border border-[#173f45]/15 bg-white">
            <div className="border-b border-slate-100 bg-[#173f45]/[0.035] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2"><Send className="h-4 w-4 text-[#5d8079]" /><h3 className="text-sm font-bold text-slate-800">Client communication centre</h3></div>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">Prepare clear updates for timings, bookings, follow-ups, consent and completion. WhatsApp and email open with the message already filled in.</p>
                </div>
                <span className="inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">No paid messaging API</span>
              </div>
              <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] leading-4 text-slate-500"><strong className="text-slate-700">Free-service model:</strong> existing FormSubmit remains for incoming website forms. Outgoing WhatsApp uses WhatsApp click-to-chat and email uses the device email client, so there is no per-message API charge. The final Send action is completed in WhatsApp/email itself.</div>
            </div>

            <div className="p-4">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <label><span className="mb-1.5 block text-xs font-bold text-slate-600">Message type</span><select value={messageTemplate} onChange={(e) => applyMessageTemplate(e.target.value as ClientMessageTemplate)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#5d8079] focus:ring-4 focus:ring-[#5d8079]/10">{Object.entries(messageTemplateLabels).filter(([value]) => !isContact || ["received", "follow-up", "completion", "custom"].includes(value)).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <button type="button" onClick={() => applyMessageTemplate(messageTemplate)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-600 hover:bg-white"><RefreshCw className="h-4 w-4" /> Refresh from latest details</button>
              </div>

              {!isContact && <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => applyMessageTemplate("booking")} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:border-emerald-200 hover:text-emerald-700">Booking confirmation</button>
                <button type="button" onClick={() => applyMessageTemplate("reminder")} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:border-sky-200 hover:text-sky-700">Appointment reminder</button>
                <button type="button" onClick={() => applyMessageTemplate("follow-up")} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:border-sky-200 hover:text-sky-700">Follow-up</button>
                <button type="button" onClick={() => applyMessageTemplate("consent-request")} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:border-violet-200 hover:text-violet-700">Consent request</button>
                <button type="button" onClick={() => applyMessageTemplate("completion")} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:border-slate-300 hover:text-slate-800">Completion</button>
              </div>}

              <label className="mt-4 block"><span className="mb-1.5 block text-xs font-bold text-slate-600">Email subject</span><input value={messageSubject} onChange={(e) => setMessageSubject(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#5d8079] focus:ring-4 focus:ring-[#5d8079]/10" /></label>
              <label className="mt-3 block"><span className="mb-1.5 block text-xs font-bold text-slate-600">Message</span><textarea rows={7} value={messageBody} onChange={(e) => { setMessageBody(e.target.value); setMessageTemplate("custom"); }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-[#5d8079] focus:ring-4 focus:ring-[#5d8079]/10" /></label>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <button type="button" onClick={copyMessage} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50">{copied ? <CheckCheck className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy message"}</button>
                <button type="button" onClick={() => openCommunication("whatsapp")} disabled={!normalizeWhatsAppNumber(identity.phone) || Boolean(communicationBusy)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"><MessageCircle className="h-4 w-4" /> {communicationBusy === "whatsapp" ? "Opening…" : identity.phone ? "WhatsApp client" : "No WhatsApp number"}</button>
                <button type="button" onClick={() => openCommunication("email")} disabled={!identity.email || Boolean(communicationBusy)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#173f45] px-3 text-xs font-bold text-white hover:bg-[#102f34] disabled:cursor-not-allowed disabled:opacity-40"><Mail className="h-4 w-4" /> {communicationBusy === "email" ? "Opening…" : identity.email ? "Email client" : "No email address"}</button>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[10px] text-slate-400"><span>WhatsApp: {identity.phone || "not provided"}</span><span>Email: {identity.email || "not provided"}</span>{scheduledDate && <span>Schedule: {friendlyDate(scheduledDate)} {scheduledTime}</span>}</div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between gap-3"><div><h4 className="text-xs font-bold text-slate-700">Message history</h4><p className="mt-0.5 text-[10px] text-slate-400">Opened messages are recorded first; mark them sent only after you actually press Send in WhatsApp/email.</p></div><span className="text-[10px] font-bold text-slate-400">{communicationHistory.length} total</span></div>
              {communicationHistory.length === 0 ? <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white px-3 py-4 text-center text-xs text-slate-400">No client messages recorded yet.</div> : <div className="mt-3 space-y-2">{[...communicationHistory].reverse().slice(0, 6).map((item) => <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${item.channel === "whatsapp" ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"}`}>{item.channel === "whatsapp" ? "WhatsApp" : "Email"}</span><span className="truncate text-xs font-bold text-slate-700">{item.purpose}</span><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${item.status === "sent" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{item.status === "sent" ? "Sent" : "Opened"}</span></div><div className="mt-1 truncate text-[10px] text-slate-400">{item.recipient} • {dateLabel(item.sentAt || item.openedAt)}</div></div>{item.status !== "sent" && <button type="button" onClick={() => markCommunicationSent(item)} disabled={Boolean(communicationBusy)} className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-[10px] font-bold text-emerald-700 disabled:opacity-50"><CheckCheck className="h-3.5 w-3.5" /> {communicationBusy === item.id ? "Saving…" : "Mark sent"}</button>}</div></div>)}</div>}
            </div>
          </section>

          <label className="mt-5 block"><span className="mb-2 block text-sm font-bold text-slate-800">Private admin notes</span><textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={isContact ? "Add reply outcome, callback note or reason for closing…" : "Add call outcome, counselling notes or scheduling details…"} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-[#5d8079] focus:ring-4 focus:ring-[#5d8079]/10" /></label>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-500">
            <div><span className="font-bold text-slate-700">Email subject:</span> {record.subject}</div>
            <div><span className="font-bold text-slate-700">Source page:</span> {record.sourcePath || "—"}</div>
            <div><span className="font-bold text-slate-700">Last updated:</span> {dateLabel(record.updatedAt)}</div>
          </div>
          {success && <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</p>}
          {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        </div>

        <div className="border-t border-slate-100 bg-white px-5 py-4 sm:px-7 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">{isContact ? "Separate Contact Inbox • no automatic centre records" : record.workflow?.appointmentId ? <span className="font-semibold text-emerald-700">Client + calendar linked • {record.workflow.centreClientCode || "Client"}</span> : record.workflow?.centreLeadCode ? <span className="font-semibold text-emerald-700">CRM linked • {record.workflow.centreLeadCode}</span> : clientImportedCode ? <span className="font-semibold text-emerald-700">Client profile ready: {clientImportedCode}</span> : "This request will sync to CRM automatically."}</div>
          <div className="flex flex-wrap gap-2">
            {!isContact && status !== "scheduled" && status !== "closed" && !record.workflow?.centreClientId && <button onClick={createClientProfile} disabled={clientImporting} className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#173f45]/15 bg-[#173f45]/[0.05] px-4 text-xs font-bold text-[#173f45] hover:bg-[#173f45]/10 disabled:opacity-60"><UserPlus className="h-4 w-4" /> {clientImporting ? "Creating…" : "Promote to client now"}</button>}
            <button onClick={save} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#173f45] px-5 text-sm font-bold text-white hover:bg-[#102f34] disabled:opacity-60"><Save className="h-4 w-4" /> {saving ? "Saving…" : isContact ? "Save contact update" : status === "scheduled" ? "Save booking & sync" : status === "closed" ? "Complete workflow" : "Save & update CRM"}</button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function AdminDashboard() {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionState>({ loading: true, configured: true, authenticated: false, username: "admin" });
  const [records, setRecords] = useState<FormSubmissionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | FormType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | SubmissionStatus>("all");
  const [selected, setSelected] = useState<FormSubmissionRecord | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const routedView = useMemo(() => {
    if (pathname === "/admin/new") {
      return { type: "all" as const, status: "new" as const, scope: "counselling" as const, days: 0, title: "New / needs action", subtitle: "Fresh service requests already synced to CRM and waiting for the first response" };
    }
    if (pathname === "/admin/follow-up") {
      return { type: "all" as const, status: "contacted" as const, scope: "counselling" as const, days: 0, title: "Follow-up active", subtitle: "Requests already contacted and waiting for the next admin action" };
    }
    if (pathname === "/admin/scheduled") {
      return { type: "all" as const, status: "scheduled" as const, scope: "counselling" as const, days: 0, title: "Booked / next step", subtitle: "Website requests now linked into client and calendar handling" };
    }
    if (pathname === "/admin/completed") {
      return { type: "all" as const, status: "closed" as const, scope: "counselling" as const, days: 0, title: "Completed / closed", subtitle: "Finished service requests retained with their CRM and centre history" };
    }
    if (pathname === "/admin/last-30-days") {
      return { type: "all" as const, status: "all" as const, scope: "counselling" as const, days: 30, title: "Last 30 days", subtitle: "Recent counselling, appointment, career, student, family, workshop and callback enquiries" };
    }
    if (pathname === "/admin/contact-inbox") {
      return { type: "contact" as const, status: "all" as const, scope: "contact" as const, days: 0, title: "Contact inbox", subtitle: "General contact-form messages kept separate from the counselling workflow" };
    }
    const formMatch = pathname.match(/^\/admin\/forms\/([^/]+)$/);
    if (formMatch && formMatch[1] in formTypeLabels) {
      const formType = formMatch[1] as FormType;
      return { type: formType, status: "all" as const, scope: formType === "contact" ? "contact" as const : "counselling" as const, days: 0, title: formTypeLabels[formType], subtitle: `Submissions received through the ${formTypeLabels[formType]}` };
    }
    return { type: "all" as const, status: "all" as const, scope: "counselling" as const, days: 0, title: "Website enquiry flow", subtitle: "One continuous path from website request to CRM, booking and centre care" };
  }, [pathname]);

  const centreRoute = isCentreAdminRoute(pathname);
  const headerView = centreRoute ? centreRouteMeta[pathname] : routedView;

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/session", { cache: "no-store" });
      const body = await response.json();
      setSession({ loading: false, configured: Boolean(body.configured), authenticated: Boolean(body.authenticated), username: body.username || "admin" });
    } catch {
      setSession((current) => ({ ...current, loading: false, authenticated: false }));
    }
  }, []);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/form-submissions", { cache: "no-store" });
      if (response.status === 401) {
        setSession((current) => ({ ...current, authenticated: false }));
        return;
      }
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load enquiries.");
      setRecords(body.submissions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load enquiries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkSession(); }, [checkSession]);
  useEffect(() => { if (session.authenticated) loadRecords(); }, [session.authenticated, loadRecords]);
  useEffect(() => {
    setTypeFilter(routedView.type);
    setStatusFilter(routedView.status);
    setSearch("");
    setSelected(null);
    setSidebarOpen(false);
  }, [routedView]);

  const scopedRecords = useMemo(() => records.filter((record) => {
    if (routedView.scope === "counselling" && record.formType === "contact") return false;
    if (routedView.scope === "contact" && record.formType !== "contact") return false;
    return true;
  }), [records, routedView.scope]);

  const stats = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const thirtyDays = now.getTime() - 30 * 86_400_000;
    return {
      total: scopedRecords.length,
      newCount: scopedRecords.filter((r) => r.status === "new").length,
      scheduled: scopedRecords.filter((r) => r.status === "scheduled").length,
      today: scopedRecords.filter((r) => new Date(r.submittedAt).getTime() >= startToday).length,
      last30: scopedRecords.filter((r) => new Date(r.submittedAt).getTime() >= thirtyDays).length,
    };
  }, [scopedRecords]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const cutoff = routedView.days ? Date.now() - routedView.days * 86_400_000 : 0;
    return scopedRecords.filter((record) => {
      if (routedView.days && new Date(record.submittedAt).getTime() < cutoff) return false;
      if (typeFilter !== "all" && record.formType !== typeFilter) return false;
      if (statusFilter !== "all" && record.status !== statusFilter) return false;
      if (!term) return true;
      const identity = getIdentity(record);
      const haystack = [record.formName, record.subject, identity.name, identity.email, identity.phone, ...Object.values(record.data).map(valueText)].join(" ").toLowerCase();
      return haystack.includes(term);
    });
  }, [scopedRecords, search, typeFilter, statusFilter, routedView.days]);

  const handleAdminUnauthorized = useCallback(() => {
    setSession((current) => ({ ...current, authenticated: false }));
  }, []);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    setRecords([]);
    setSession((current) => ({ ...current, authenticated: false }));
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), submissions: records }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `chetana-form-submissions-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleSaved = (updated: FormSubmissionRecord) => {
    setRecords((current) => current.map((item) => item.id === updated.id ? updated : item));
    setSelected(updated);
  };

  if (session.loading) {
    return <main className="min-h-screen bg-[#102f34] grid place-items-center"><div className="flex items-center gap-3 text-sm font-semibold text-white/80"><RefreshCw className="h-5 w-5 animate-spin" /> Loading secure admin…</div></main>;
  }
  if (!session.authenticated) return <LoginScreen session={session} onLogin={checkSession} />;

  return (
    <main className="min-h-screen bg-[#f4f5f3] text-slate-900">
      {sidebarOpen && <button className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[278px] bg-[#12373d] text-white transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col overflow-y-auto p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="h-11 w-11 overflow-hidden rounded-full border border-white/15"><Image src={greenLogo} alt="Chetana" className="h-full w-full object-cover" /></div><div><div className="text-sm font-bold">Chetana</div><div className="text-[11px] text-white/50">Admin Console</div></div></div>
            <button onClick={() => setSidebarOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-white/60 hover:bg-white/10 lg:hidden"><X className="h-4 w-4" /></button>
          </div>

          <nav className="mt-9 space-y-1.5">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Website enquiry flow</div>
            <Link href="/admin" onClick={() => setSidebarOpen(false)} className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${pathname === "/admin" ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/[0.07] hover:text-white"}`}><LayoutDashboard className={`h-4 w-4 ${pathname === "/admin" ? "text-[#e3c08d]" : ""}`} /> Enquiry pipeline</Link>
            <Link href="/admin/new" onClick={() => setSidebarOpen(false)} className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition ${pathname === "/admin/new" ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/[0.07] hover:text-white"}`}><span className="flex items-center gap-3"><Inbox className={`h-4 w-4 ${pathname === "/admin/new" ? "text-[#e3c08d]" : ""}`} /> New / needs action</span><span className="rounded-full bg-[#e3c08d] px-2 py-0.5 text-[10px] font-bold text-[#173f45]">{records.filter((r) => r.formType !== "contact" && r.status === "new").length}</span></Link>
            <Link href="/admin/follow-up" onClick={() => setSidebarOpen(false)} className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition ${pathname === "/admin/follow-up" ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/[0.07] hover:text-white"}`}><span className="flex items-center gap-3"><Clock3 className={`h-4 w-4 ${pathname === "/admin/follow-up" ? "text-[#e3c08d]" : ""}`} /> Follow-up active</span><span className="text-[10px] text-white/35">{records.filter((r) => r.formType !== "contact" && r.status === "contacted").length}</span></Link>
            <Link href="/admin/scheduled" onClick={() => setSidebarOpen(false)} className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition ${pathname === "/admin/scheduled" ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/[0.07] hover:text-white"}`}><span className="flex items-center gap-3"><CalendarCheck2 className={`h-4 w-4 ${pathname === "/admin/scheduled" ? "text-[#e3c08d]" : ""}`} /> Booked / next step</span><span className="text-[10px] text-white/35">{records.filter((r) => r.formType !== "contact" && r.status === "scheduled").length}</span></Link>
            <Link href="/admin/completed" onClick={() => setSidebarOpen(false)} className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition ${pathname === "/admin/completed" ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/[0.07] hover:text-white"}`}><span className="flex items-center gap-3"><CheckCircle2 className={`h-4 w-4 ${pathname === "/admin/completed" ? "text-[#e3c08d]" : ""}`} /> Completed / closed</span><span className="text-[10px] text-white/35">{records.filter((r) => r.formType !== "contact" && r.status === "closed").length}</span></Link>
            <Link href="/admin/last-30-days" onClick={() => setSidebarOpen(false)} className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${pathname === "/admin/last-30-days" ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/[0.07] hover:text-white"}`}><CalendarDays className={`h-4 w-4 ${pathname === "/admin/last-30-days" ? "text-[#e3c08d]" : ""}`} /> Last 30 days</Link>
            <Link href="/admin/contact-inbox" onClick={() => setSidebarOpen(false)} className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition ${pathname === "/admin/contact-inbox" ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/[0.07] hover:text-white"}`}><span className="flex items-center gap-3"><Mail className={`h-4 w-4 ${pathname === "/admin/contact-inbox" ? "text-[#e3c08d]" : ""}`} /> Contact inbox</span><span className="text-[10px] text-white/35">{records.filter((r) => r.formType === "contact" && r.status !== "closed").length}</span></Link>
          </nav>

          <div className="mt-7 border-t border-white/10 pt-6">
            <div className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Command centre</div>
            <div className="mt-2 space-y-0.5">
              {[
                ["/admin/centre", "Executive overview", LayoutDashboard],
                ["/admin/today", "Today desk", CalendarCheck2],
                ["/admin/calendar", "Centre calendar", CalendarDays],
                ["/admin/leads", "CRM pipeline", UserPlus],
              ].map(([href, label, Icon]) => { const active = pathname === href; return <Link key={String(href)} href={String(href)} onClick={() => setSidebarOpen(false)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs transition ${active ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/[0.05] hover:text-white"}`}><Icon className={`h-4 w-4 ${active ? "text-[#e3c08d]" : ""}`} /><span>{String(label)}</span></Link>; })}
            </div>

            <div className="mt-5 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Client care</div>
            <div className="mt-2 space-y-0.5">
              {[
                ["/admin/clients", "Clients", UsersRound],
                ["/admin/sessions", "Counselling records", NotebookTabs],
                ["/admin/care-plans", "Care plans & packages", Sparkles],
                ["/admin/communications", "Communication log", Mail],
                ["/admin/documents", "Client documents", FileJson],
                ["/admin/appointments", "Appointments", CalendarCheck2],
                ["/admin/follow-ups", "Follow-ups", BellRing],
              ].map(([href, label, Icon]) => { const active = pathname === href; return <Link key={String(href)} href={String(href)} onClick={() => setSidebarOpen(false)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs transition ${active ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/[0.05] hover:text-white"}`}><Icon className={`h-4 w-4 ${active ? "text-[#e3c08d]" : ""}`} /><span>{String(label)}</span></Link>; })}
            </div>

            <div className="mt-5 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Business operations</div>
            <div className="mt-2 space-y-0.5">
              {[
                ["/admin/tasks", "Centre tasks", ListTodo],
                ["/admin/services", "Services & fees", Sparkles],
                ["/admin/payments", "Payments", IndianRupee],
                ["/admin/expenses", "Expenses", ReceiptText],
                ["/admin/finance", "Finance command", BarChart3],
                ["/admin/inventory", "Inventory & supplies", HardDrive],
                ["/admin/staff", "Staff", UserCog],
              ].map(([href, label, Icon]) => { const active = pathname === href; return <Link key={String(href)} href={String(href)} onClick={() => setSidebarOpen(false)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs transition ${active ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/[0.05] hover:text-white"}`}><Icon className={`h-4 w-4 ${active ? "text-[#e3c08d]" : ""}`} /><span>{String(label)}</span></Link>; })}
            </div>

            <div className="mt-5 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Control & insights</div>
            <div className="mt-2 space-y-0.5">
              {[
                ["/admin/reports", "Reports", BarChart3],
                ["/admin/archive", "Archive", DatabaseBackup],
                ["/admin/data", "Data & backup", DatabaseBackup],
              ].map(([href, label, Icon]) => { const active = pathname === href; return <Link key={String(href)} href={String(href)} onClick={() => setSidebarOpen(false)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs transition ${active ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/[0.05] hover:text-white"}`}><Icon className={`h-4 w-4 ${active ? "text-[#e3c08d]" : ""}`} /><span>{String(label)}</span></Link>; })}
            </div>
          </div>

          <div className="mt-7 border-t border-white/10 pt-6"><div className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Website service forms</div><div className="mt-2 space-y-0.5">{Object.entries(formTypeLabels).filter(([type]) => type !== "contact").map(([type, label]) => { const count = records.filter((r) => r.formType === type).length; const href = `/admin/forms/${type}`; const active = pathname === href; return <Link key={type} href={href} onClick={() => { setTypeFilter(type as FormType); setStatusFilter("all"); setSidebarOpen(false); }} className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs transition ${active ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/[0.05] hover:text-white"}`}><span className="truncate">{label}</span><span className={`ml-2 text-[10px] ${active ? "text-[#e3c08d]" : "text-white/35"}`}>{count}</span></Link>; })}</div></div>

          <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.06] p-4"><div className="flex items-center gap-2 text-xs font-semibold"><HardDrive className="h-4 w-4 text-[#e3c08d]" /> JSON storage active</div><p className="mt-2 text-[11px] leading-5 text-white/45">Website enquiries and centre records are read from and updated in private server JSON files.</p></div>
          <button onClick={logout} className="mt-3 flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-white/55 hover:bg-white/[0.06] hover:text-white"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      </aside>

      <section className="min-h-screen lg:pl-[278px]">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#f4f5f3]/90 backdrop-blur-xl">
          <div className="flex h-[76px] items-center justify-between gap-4 px-4 sm:px-7 lg:px-9">
            <div className="flex items-center gap-3"><button onClick={() => setSidebarOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white lg:hidden"><Menu className="h-4 w-4" /></button><div><h1 className="text-lg font-semibold tracking-[-0.025em] text-slate-900">{headerView.title}</h1><p className="hidden text-xs text-slate-500 sm:block">{headerView.subtitle}</p></div></div>
            <div className="flex items-center gap-2">{centreRoute && <div className="hidden items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Private JSON live</div>}{!centreRoute && <><button onClick={loadRecords} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" aria-label="Refresh"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button><button onClick={downloadJson} className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:inline-flex"><Download className="h-4 w-4" /> Export JSON</button></> }<div className="ml-1 grid h-10 w-10 place-items-center rounded-xl bg-[#173f45] text-xs font-bold text-white shadow-lg shadow-[#173f45]/10">AD</div></div>
          </div>
        </header>

        {centreRoute ? (
          <CentreManagement pathname={pathname} onUnauthorized={handleAdminUnauthorized} websiteRecords={records} />
        ) : (
        <div className="px-4 py-6 sm:px-7 lg:px-9 lg:py-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full border border-[#5d8079]/15 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#5d8079]"><Sparkles className="h-3 w-3" /> Live overview</div><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-4xl">{routedView.title}</h2><p className="mt-2 text-sm text-slate-500">{routedView.subtitle}. Review, update and follow up without a database.</p></div><div className="text-xs text-slate-400">Last refreshed {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div></div>

          <section className={`mt-6 rounded-2xl border p-5 ${routedView.scope === "contact" ? "border-sky-200 bg-sky-50/60" : "border-[#5d8079]/20 bg-white"}`}>
            {routedView.scope === "contact" ? (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2 text-sm font-bold text-slate-800"><Mail className="h-4 w-4 text-sky-600" /> Separate contact-form flow</div><p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">General messages stay here: <strong>Received → Responded → Follow-up → Resolved</strong>. They remain completely separate from CRM, clients, appointments and counselling records.</p></div><span className="inline-flex w-fit rounded-full border border-sky-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-700">Contact only</span></div>
            ) : (
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between"><div><div className="flex items-center gap-2 text-sm font-bold text-slate-800"><Sparkles className="h-4 w-4 text-[#5d8079]" /> Continuous website → centre workflow</div><p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">Every counselling/service request enters the CRM automatically as soon as the website form is submitted. From there, each status change updates the same Command Centre record; booking creates the client and calendar item without duplicate entry.</p><div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-bold"><span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-600">1. Website intake</span><ChevronRight className="h-3.5 w-3.5 text-slate-300"/><span className="rounded-lg bg-[#173f45]/[0.07] px-2.5 py-1.5 text-[#173f45]">2. CRM live</span><ChevronRight className="h-3.5 w-3.5 text-slate-300"/><span className="rounded-lg bg-sky-50 px-2.5 py-1.5 text-sky-700">3. Follow-up</span><ChevronRight className="h-3.5 w-3.5 text-slate-300"/><span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-emerald-700">4. Book / client</span><ChevronRight className="h-3.5 w-3.5 text-slate-300"/><span className="rounded-lg bg-[#173f45] px-2.5 py-1.5 text-white">5. Ongoing centre care</span></div></div><Link href="/admin/centre" className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[#173f45] px-4 text-xs font-bold text-white">Open Command Centre <ChevronRight className="h-4 w-4" /></Link></div>
            )}
          </section>

          <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-5">
            {[
              { label: routedView.scope === "contact" ? "Contact messages" : "Pipeline enquiries", value: stats.total, icon: Inbox, note: routedView.scope === "contact" ? "All contact history" : "All service requests" },
              { label: routedView.scope === "contact" ? "New messages" : "Needs action", value: stats.newCount, icon: Clock3, note: "Waiting for first action" },
              { label: routedView.scope === "contact" ? "Follow-up" : "Booked / next step", value: stats.scheduled, icon: CalendarCheck2, note: routedView.scope === "contact" ? "Messages needing another action" : "Client + calendar handoff" },
              { label: "Today", value: stats.today, icon: CalendarDays, note: "Received today" },
              { label: "Last 30 days", value: stats.last30, icon: CheckCircle2, note: "Recent activity" },
            ].map((item) => <div key={item.label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,.03)] sm:p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-slate-500">{item.label}</p><div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-900">{item.value}</div></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#173f45]/[0.07] text-[#173f45]"><item.icon className="h-4 w-4" /></div></div><p className="mt-4 text-[11px] text-slate-400">{item.note}</p></div>)}
          </div>

          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_36px_rgba(15,23,42,.035)]">
            <div className="border-b border-slate-100 p-4 sm:p-5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative w-full xl:max-w-md"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, email or form data…" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-[#5d8079] focus:bg-white focus:ring-4 focus:ring-[#5d8079]/10" /></div>
                <div className="flex flex-wrap gap-2"><select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as "all" | FormType)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none"><option value="all">All forms</option>{Object.entries(formTypeLabels).filter(([value]) => routedView.scope === "contact" ? value === "contact" : value !== "contact").map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | SubmissionStatus)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none"><option value="all">All statuses</option>{Object.entries(routedView.scope === "contact" ? contactStatusLabels : statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button onClick={downloadJson} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 sm:hidden"><FileJson className="h-4 w-4" /> JSON</button></div>
              </div>
            </div>

            {error && <div className="m-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {loading && records.length === 0 ? (
              <div className="grid min-h-64 place-items-center"><div className="flex items-center gap-3 text-sm text-slate-500"><RefreshCw className="h-4 w-4 animate-spin" /> Loading enquiries…</div></div>
            ) : filtered.length === 0 ? (
              <div className="grid min-h-72 place-items-center px-6 text-center"><div><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Inbox className="h-6 w-6" /></div><h3 className="mt-4 text-base font-semibold text-slate-800">No matching enquiries</h3><p className="mt-1 text-sm text-slate-400">Try changing the search or filters.</p></div></div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[880px] text-left">
                    <thead><tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400"><th className="px-5 py-3.5">Person</th><th className="px-5 py-3.5">Form</th><th className="px-5 py-3.5">Contact</th><th className="px-5 py-3.5">Received</th><th className="px-5 py-3.5">Status</th><th className="px-5 py-3.5 text-right">View</th></tr></thead>
                    <tbody>{filtered.map((record) => { const identity = getIdentity(record); return <tr key={record.id} onClick={() => setSelected(record)} className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-[#173f45]/[0.025]"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#173f45]/[0.07] text-xs font-bold text-[#173f45]">{identity.name.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><div className="max-w-[220px] truncate text-sm font-semibold text-slate-800">{identity.name}</div><div className="mt-0.5 text-[11px] text-slate-400">{record.id.slice(0, 8)}</div></div></div></td><td className="px-5 py-4"><div className="max-w-[210px] truncate text-xs font-semibold text-slate-600">{record.formName}</div></td><td className="px-5 py-4"><div className="text-xs font-medium text-slate-600">{identity.phone || "—"}</div><div className="mt-1 max-w-[190px] truncate text-[11px] text-slate-400">{identity.email || "No email"}</div></td><td className="px-5 py-4"><div className="text-xs font-semibold text-slate-600">{relativeDay(record.submittedAt)}</div><div className="mt-1 text-[11px] text-slate-400">{dateLabel(record.submittedAt)}</div></td><td className="px-5 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClasses[record.status]}`}>{submissionStatusLabel(record)}</span></td><td className="px-5 py-4 text-right"><button className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-700"><ChevronRight className="h-4 w-4" /></button></td></tr>; })}</tbody>
                  </table>
                </div>
                <div className="divide-y divide-slate-100 md:hidden">{filtered.map((record) => { const identity = getIdentity(record); return <button key={record.id} onClick={() => setSelected(record)} className="w-full p-4 text-left hover:bg-slate-50"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#173f45]/[0.07] text-xs font-bold text-[#173f45]">{identity.name.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><div className="truncate text-sm font-semibold text-slate-800">{identity.name}</div><div className="mt-0.5 truncate text-xs text-slate-400">{record.formName}</div></div></div><ChevronRight className="mt-2 h-4 w-4 shrink-0 text-slate-300" /></div><div className="mt-3 flex items-center justify-between gap-3"><div className="text-xs text-slate-500">{identity.phone || identity.email || "No contact"}</div><span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClasses[record.status]}`}>{submissionStatusLabel(record)}</span></div><div className="mt-2 text-[11px] text-slate-400">{dateLabel(record.submittedAt)}</div></button>; })}</div>
              </>
            )}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-[11px] text-slate-400 sm:px-5"><span>Showing {filtered.length} of {routedView.days ? stats.last30 : scopedRecords.length}</span><span>JSON-backed storage</span></div>
          </section>
        </div>
        )}
      </section>

      {!centreRoute && selected && <DetailPanel record={selected} onClose={() => setSelected(null)} onSaved={handleSaved} />}
    </main>
  );
}
