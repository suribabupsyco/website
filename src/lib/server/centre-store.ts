import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import {
  centreCollections,
  type ActivityRecord,
  type CentreAdminStore,
  type CentreCollection,
  type CentreRecord,
} from "@/lib/centre-admin-types";

const EMPTY_STORE: CentreAdminStore = {
  version: 1,
  updatedAt: null,
  clients: [],
  leads: [],
  sessions: [],
  appointments: [],
  followUps: [],
  carePlans: [],
  communications: [],
  documents: [],
  services: [],
  payments: [],
  expenses: [],
  inventory: [],
  staff: [],
  tasks: [],
  archives: [],
  activity: [],
};

let mutationQueue: Promise<unknown> = Promise.resolve();

function getFilePath() {
  const configured = process.env.CENTRE_ADMIN_FILE?.trim();
  return configured ? path.resolve(configured) : path.join(process.cwd(), "data", "centre-admin.json");
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

function normalizeStore(input: Partial<CentreAdminStore>): CentreAdminStore {
  return {
    version: 1,
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : null,
    clients: Array.isArray(input.clients) ? input.clients : [],
    leads: Array.isArray(input.leads) ? input.leads : [],
    sessions: Array.isArray(input.sessions) ? input.sessions : [],
    appointments: Array.isArray(input.appointments) ? input.appointments : [],
    followUps: Array.isArray(input.followUps) ? input.followUps : [],
    carePlans: Array.isArray(input.carePlans) ? input.carePlans : [],
    communications: Array.isArray(input.communications) ? input.communications : [],
    documents: Array.isArray(input.documents) ? input.documents : [],
    services: Array.isArray(input.services) ? input.services : [],
    payments: Array.isArray(input.payments) ? input.payments : [],
    expenses: Array.isArray(input.expenses) ? input.expenses : [],
    inventory: Array.isArray(input.inventory) ? input.inventory : [],
    staff: Array.isArray(input.staff) ? input.staff : [],
    tasks: Array.isArray(input.tasks) ? input.tasks : [],
    archives: Array.isArray(input.archives) ? input.archives : [],
    activity: Array.isArray(input.activity) ? input.activity : [],
  };
}

async function parseStore(filePath: string): Promise<CentreAdminStore> {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as Partial<CentreAdminStore>;
  if (parsed.version !== 1) throw new Error("Invalid centre admin store format.");
  return normalizeStore(parsed);
}

export async function readCentreStore(): Promise<CentreAdminStore> {
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

async function writeCentreStore(store: CentreAdminStore) {
  const filePath = await ensureStoreFile();
  const backupPath = getBackupPath(filePath);
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;

  try {
    const current = await fs.readFile(filePath, "utf8");
    await fs.writeFile(backupPath, current, "utf8");
  } catch {
    // No useful backup may exist on the first write.
  }

  const serialized = JSON.stringify(store, null, 2) + "\n";
  await fs.writeFile(tempPath, serialized, "utf8");
  try {
    await fs.rename(tempPath, filePath);
  } catch {
    await fs.rm(filePath, { force: true });
    await fs.rename(tempPath, filePath);
  }

  const backupTemp = `${backupPath}.${process.pid}.${Date.now()}.tmp`;
  try {
    await fs.writeFile(backupTemp, serialized, "utf8");
    try {
      await fs.rename(backupTemp, backupPath);
    } catch {
      await fs.rm(backupPath, { force: true });
      await fs.rename(backupTemp, backupPath);
    }
  } catch {
    await fs.rm(backupTemp, { force: true }).catch(() => undefined);
  }
}

function queueMutation<T>(operation: () => Promise<T>) {
  const run = mutationQueue.then(operation, operation);
  mutationQueue = run.then(() => undefined, () => undefined);
  return run;
}

export function isCentreCollection(value: unknown): value is CentreCollection {
  return typeof value === "string" && centreCollections.includes(value as CentreCollection);
}

function cleanValue(value: unknown): string | number | boolean | null {
  if (value === null) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") return value.trim().slice(0, 10_000);
  if (value === undefined) return "";
  return String(value).slice(0, 10_000);
}

function cleanRecord(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Record data must be an object.");
  const entries = Object.entries(input as Record<string, unknown>).slice(0, 80);
  return Object.fromEntries(entries.map(([key, value]) => [key.slice(0, 120), cleanValue(value)]));
}

function nextSequence(records: CentreRecord[], field: string, prefix: string) {
  let max = 0;
  for (const item of records) {
    const value = String((item as unknown as Record<string, unknown>)[field] || "");
    const match = value.match(/(\d+)$/);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}

function recordLabel(collection: CentreCollection, record: Record<string, unknown>) {
  if (collection === "clients") return String(record.fullName || record.clientCode || "Client");
  if (collection === "leads") return String(record.fullName || record.leadCode || "Lead");
  if (collection === "carePlans") return String(record.clientName || record.planCode || "Care plan");
  if (collection === "communications") return String(record.clientName || record.purpose || "Communication");
  if (collection === "documents") return String(record.documentName || record.clientName || "Document");
  if (collection === "inventory") return String(record.itemName || record.itemCode || "Inventory item");
  if (collection === "sessions") return String(record.clientName || "Counselling session");
  if (collection === "appointments") return String(record.clientName || record.purpose || "Appointment");
  if (collection === "followUps") return String(record.clientName || record.purpose || "Follow-up");
  if (collection === "services") return String(record.name || record.serviceCode || "Service");
  if (collection === "payments") return String(record.clientName || record.receiptNo || "Payment");
  if (collection === "expenses") return String(record.description || record.category || "Expense");
  if (collection === "staff") return String(record.fullName || record.staffCode || "Staff");
  return String(record.title || "Task");
}

function addActivity(store: CentreAdminStore, action: ActivityRecord["action"], collection: CentreCollection, record: Record<string, unknown>) {
  store.activity.push({
    id: randomUUID(),
    action,
    collection,
    recordId: String(record.id || ""),
    label: recordLabel(collection, record).slice(0, 180),
    at: new Date().toISOString(),
  });
}

export async function createCentreRecord(collection: CentreCollection, input: unknown) {
  const cleaned = cleanRecord(input);
  return queueMutation(async () => {
    const store = await readCentreStore();
    const records = store[collection] as CentreRecord[];
    const sourceSubmissionId = String(cleaned.sourceSubmissionId || "");
    const sourceCommunicationId = String(cleaned.sourceCommunicationId || "");
    if (sourceSubmissionId && ["clients", "leads", "appointments", "followUps"].includes(collection)) {
      const existing = records.find((item) => String((item as unknown as Record<string, unknown>).sourceSubmissionId || "") === sourceSubmissionId);
      if (existing) return existing;
    }
    if (collection === "communications" && sourceCommunicationId) {
      const existing = records.find((item) => String((item as unknown as Record<string, unknown>).sourceCommunicationId || "") === sourceCommunicationId);
      if (existing) return existing;
    }
    const now = new Date().toISOString();
    const record: Record<string, unknown> = { ...cleaned, id: randomUUID(), createdAt: now, updatedAt: now };

    if (collection === "clients" && !record.clientCode) record.clientCode = nextSequence(records, "clientCode", "CHT");
    if (collection === "leads" && !record.leadCode) record.leadCode = nextSequence(records, "leadCode", "LEAD");
    if (collection === "carePlans" && !record.planCode) record.planCode = nextSequence(records, "planCode", "PLAN");
    if (collection === "inventory" && !record.itemCode) record.itemCode = nextSequence(records, "itemCode", "INV");
    if (collection === "staff" && !record.staffCode) record.staffCode = nextSequence(records, "staffCode", "STF");
    if (collection === "services" && !record.serviceCode) record.serviceCode = nextSequence(records, "serviceCode", "SRV");
    if (collection === "payments" && !record.receiptNo) record.receiptNo = nextSequence(records, "receiptNo", "RCT");

    records.push(record as unknown as CentreRecord);
    store.updatedAt = now;
    addActivity(store, "created", collection, record);
    await writeCentreStore(store);
    return record;
  });
}

export async function updateCentreRecord(collection: CentreCollection, id: string, input: unknown) {
  const cleaned = cleanRecord(input);
  return queueMutation(async () => {
    const store = await readCentreStore();
    const records = store[collection] as CentreRecord[];
    const index = records.findIndex((item) => item.id === id);
    if (index < 0) return null;
    const current = records[index] as unknown as Record<string, unknown>;
    const updated = { ...current, ...cleaned, id: current.id, createdAt: current.createdAt, updatedAt: new Date().toISOString() };
    records[index] = updated as unknown as CentreRecord;
    store.updatedAt = String(updated.updatedAt);
    addActivity(store, "updated", collection, updated);
    await writeCentreStore(store);
    return updated;
  });
}

export async function archiveCentreRecord(collection: CentreCollection, id: string) {
  return queueMutation(async () => {
    const store = await readCentreStore();
    const records = store[collection] as CentreRecord[];
    const index = records.findIndex((item) => item.id === id);
    if (index < 0) return null;
    const record = records[index] as unknown as Record<string, unknown>;
    records.splice(index, 1);
    const now = new Date().toISOString();
    store.archives.push({ archiveId: randomUUID(), collection, archivedAt: now, record: record as unknown as CentreRecord });
    store.updatedAt = now;
    addActivity(store, "archived", collection, record);
    await writeCentreStore(store);
    return record;
  });
}


export async function restoreCentreRecord(archiveId: string) {
  return queueMutation(async () => {
    const store = await readCentreStore();
    const index = store.archives.findIndex((item) => item.archiveId === archiveId);
    if (index < 0) return null;
    const archived = store.archives[index];
    const records = store[archived.collection] as CentreRecord[];
    const restored = { ...(archived.record as unknown as Record<string, unknown>), updatedAt: new Date().toISOString() } as unknown as CentreRecord;
    if (!records.some((item) => item.id === restored.id)) records.push(restored);
    store.archives.splice(index, 1);
    store.updatedAt = restored.updatedAt;
    addActivity(store, "restored", archived.collection, restored as unknown as Record<string, unknown>);
    await writeCentreStore(store);
    return restored;
  });
}
