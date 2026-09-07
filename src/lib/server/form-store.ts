import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { formTypeLabels, type FormSubmissionRecord, type FormSubmissionStore, type FormType, type SubmissionCommunication, type SubmissionStatus, type SubmissionWorkflow } from "@/lib/form-submission-types";

const EMPTY_STORE: FormSubmissionStore = { version: 1, updatedAt: null, submissions: [] };
let mutationQueue: Promise<unknown> = Promise.resolve();

function getFilePath() {
  const configured = process.env.FORM_SUBMISSIONS_FILE?.trim();
  return configured ? path.resolve(configured) : path.join(process.cwd(), "data", "form-submissions.json");
}

function getBackupPath(filePath: string) {
  const ext = path.extname(filePath) || ".json";
  return filePath.slice(0, -ext.length) + ".backup" + ext;
}

async function ensureStoreFile() {
  const filePath = getFilePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(EMPTY_STORE, null, 2) + "\n", "utf8");
  }
  return filePath;
}

async function parseStore(filePath: string): Promise<FormSubmissionStore> {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as Partial<FormSubmissionStore>;
  if (parsed.version !== 1 || !Array.isArray(parsed.submissions)) throw new Error("Invalid form submission store format.");
  return { version: 1, updatedAt: parsed.updatedAt || null, submissions: parsed.submissions as FormSubmissionRecord[] };
}

export async function readStore(): Promise<FormSubmissionStore> {
  const filePath = await ensureStoreFile();
  try {
    return await parseStore(filePath);
  } catch (mainError) {
    const backupPath = getBackupPath(filePath);
    try {
      const backup = await parseStore(backupPath);
      await fs.writeFile(filePath, JSON.stringify(backup, null, 2) + "\n", "utf8");
      return backup;
    } catch {
      throw mainError;
    }
  }
}

async function writeStore(store: FormSubmissionStore) {
  const filePath = await ensureStoreFile();
  const backupPath = getBackupPath(filePath);
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;

  try {
    const current = await fs.readFile(filePath, "utf8");
    await fs.writeFile(backupPath, current, "utf8");
  } catch {
    // First write may not have a useful backup yet.
  }

  const serialized = JSON.stringify(store, null, 2) + "\n";
  await fs.writeFile(tempPath, serialized, "utf8");
  try {
    await fs.rename(tempPath, filePath);
  } catch {
    // Windows may reject replacing an existing file with rename; backup still protects the prior state.
    await fs.rm(filePath, { force: true });
    await fs.rename(tempPath, filePath);
  }

  // Keep a second complete copy of the latest successfully written state.
  const backupTempPath = `${backupPath}.${process.pid}.${Date.now()}.tmp`;
  try {
    await fs.writeFile(backupTempPath, serialized, "utf8");
    try {
      await fs.rename(backupTempPath, backupPath);
    } catch {
      await fs.rm(backupPath, { force: true });
      await fs.rename(backupTempPath, backupPath);
    }
  } catch {
    await fs.rm(backupTempPath, { force: true }).catch(() => undefined);
  }
}

function queueMutation<T>(operation: () => Promise<T>) {
  const run = mutationQueue.then(operation, operation);
  mutationQueue = run.then(() => undefined, () => undefined);
  return run;
}

function isFormType(value: unknown): value is FormType {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(formTypeLabels, value);
}

function cleanScalar(value: unknown): string | number | boolean | null {
  if (value === null) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : String(value);
  if (typeof value === "string") return value.slice(0, 5000);
  if (value === undefined) return null;
  return String(value).slice(0, 5000);
}

function cleanData(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Submission data must be an object.");
  const entries = Object.entries(input as Record<string, unknown>).slice(0, 60);
  return Object.fromEntries(entries.map(([key, value]) => [key.slice(0, 100), cleanScalar(value)]));
}

function cleanCommunications(value: unknown): SubmissionCommunication[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.slice(-100).flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const source = item as Record<string, unknown>;
    const channel = source.channel === "whatsapp" || source.channel === "email" ? source.channel : null;
    const status = source.status === "sent" ? "sent" : source.status === "opened" ? "opened" : null;
    if (!channel || !status) return [];
    const text = (key: string, max: number) => typeof source[key] === "string" ? String(source[key]).slice(0, max) : "";
    return [{
      id: text("id", 120) || randomUUID(),
      channel,
      purpose: text("purpose", 120),
      subject: text("subject", 240),
      message: text("message", 5000),
      recipient: text("recipient", 240),
      status,
      openedAt: text("openedAt", 50) || new Date().toISOString(),
      sentAt: text("sentAt", 50) || undefined,
      centreCommunicationId: text("centreCommunicationId", 120) || undefined,
    }];
  });
}

function cleanWorkflow(input: unknown): SubmissionWorkflow {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const source = input as Record<string, unknown>;
  const text = (key: string, max = 200) => typeof source[key] === "string" ? String(source[key]).slice(0, max) : undefined;
  const cleaned: SubmissionWorkflow = {
    centreLeadId: text("centreLeadId", 120),
    centreLeadCode: text("centreLeadCode", 80),
    scheduledDate: text("scheduledDate", 20),
    scheduledTime: text("scheduledTime", 20),
    scheduledMode: text("scheduledMode", 80),
    nextActionDate: text("nextActionDate", 20),
    centreClientId: text("centreClientId", 120),
    centreClientCode: text("centreClientCode", 80),
    appointmentId: text("appointmentId", 120),
    promotedAt: text("promotedAt", 40),
    contactNextActionDate: text("contactNextActionDate", 20),
    consentStatus: text("consentStatus", 40),
    consentStatusUpdatedAt: text("consentStatusUpdatedAt", 50),
    communications: cleanCommunications(source.communications),
  };
  return Object.fromEntries(Object.entries(cleaned).filter(([, value]) => value !== undefined)) as SubmissionWorkflow;
}

export async function addSubmission(input: {
  formType: unknown;
  formName?: unknown;
  subject?: unknown;
  sourcePath?: unknown;
  clientSubmittedAt?: unknown;
  clientSubmissionId?: unknown;
  data: unknown;
}) {
  if (!isFormType(input.formType)) throw new Error("Unknown form type.");
  const formType = input.formType;
  const data = cleanData(input.data);

  return queueMutation(async () => {
    const store = await readStore();
    const clientSubmissionId = typeof input.clientSubmissionId === "string" ? input.clientSubmissionId.slice(0, 120) : "";
    if (clientSubmissionId) {
      const existing = store.submissions.find((item) => item.clientSubmissionId === clientSubmissionId);
      if (existing) return existing;
    }
    const now = new Date().toISOString();
    const clientDate = typeof input.clientSubmittedAt === "string" && !Number.isNaN(Date.parse(input.clientSubmittedAt))
      ? new Date(input.clientSubmittedAt).toISOString()
      : now;
    const record: FormSubmissionRecord = {
      id: randomUUID(),
      clientSubmissionId: clientSubmissionId || undefined,
      formType,
      formName: typeof input.formName === "string" ? input.formName.slice(0, 120) : formTypeLabels[formType],
      subject: typeof input.subject === "string" ? input.subject.slice(0, 200) : formTypeLabels[formType],
      submittedAt: clientDate,
      updatedAt: now,
      status: "new",
      adminNotes: "",
      sourcePath: typeof input.sourcePath === "string" ? input.sourcePath.slice(0, 300) : "",
      data,
    };
    store.submissions.push(record);
    store.updatedAt = now;
    await writeStore(store);
    return record;
  });
}

const allowedStatuses: SubmissionStatus[] = ["new", "contacted", "scheduled", "closed"];

export async function updateSubmission(id: string, patch: { status?: unknown; adminNotes?: unknown; data?: unknown; workflow?: unknown }) {
  return queueMutation(async () => {
    const store = await readStore();
    const record = store.submissions.find((item) => item.id === id);
    if (!record) return null;

    if (patch.status !== undefined) {
      if (typeof patch.status !== "string" || !allowedStatuses.includes(patch.status as SubmissionStatus)) {
        throw new Error("Invalid status.");
      }
      record.status = patch.status as SubmissionStatus;
    }
    if (patch.adminNotes !== undefined) {
      if (typeof patch.adminNotes !== "string") throw new Error("Invalid admin notes.");
      record.adminNotes = patch.adminNotes.slice(0, 5000);
    }
    if (patch.data !== undefined) record.data = cleanData(patch.data);
    if (patch.workflow !== undefined) record.workflow = { ...(record.workflow || {}), ...cleanWorkflow(patch.workflow) };

    const now = new Date().toISOString();
    record.updatedAt = now;
    store.updatedAt = now;
    await writeStore(store);
    return record;
  });
}
