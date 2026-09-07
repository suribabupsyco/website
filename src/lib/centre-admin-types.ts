export const centreCollections = [
  "clients",
  "leads",
  "sessions",
  "appointments",
  "followUps",
  "carePlans",
  "communications",
  "documents",
  "services",
  "payments",
  "expenses",
  "inventory",
  "staff",
  "tasks",
] as const;

export type CentreCollection = (typeof centreCollections)[number];
export type CentreRecordValue = string | number | boolean | null;

export interface CentreRecordBase {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientRecord extends CentreRecordBase {
  clientCode: string;
  fullName: string;
  phone: string;
  alternatePhone: string;
  email: string;
  dateOfBirth: string;
  age: string;
  gender: string;
  occupationOrClass: string;
  schoolCollegeOrCompany: string;
  parentGuardianName: string;
  relationship: string;
  city: string;
  address: string;
  emergencyContact: string;
  counsellingFor: string;
  primaryConcern: string;
  preferredLanguage: string;
  preferredSessionType: string;
  referralSource: string;
  assignedCounsellor: string;
  status: string;
  consent: string;
  tags: string;
  notes: string;
  documents: string;
  sourceSubmissionId: string;
}

export interface LeadRecord extends CentreRecordBase {
  leadCode: string;
  fullName: string;
  phone: string;
  email: string;
  source: string;
  enquiryFor: string;
  preferredMode: string;
  assignedTo: string;
  stage: string;
  priority: string;
  nextFollowUp: string;
  estimatedValue: number;
  city: string;
  notes: string;
  convertedClientId: string;
  sourceSubmissionId?: string;
}

export interface SessionRecord extends CentreRecordBase {
  clientId: string;
  clientName: string;
  sessionDate: string;
  sessionTime: string;
  counsellor: string;
  sessionType: string;
  mode: string;
  concern: string;
  sessionSummary: string;
  observations: string;
  actionPlan: string;
  homeworkRecommendations: string;
  nextFollowUp: string;
  durationMinutes: string;
  status: string;
  confidentialNotes: string;
}

export interface AppointmentRecord extends CentreRecordBase {
  clientId: string;
  clientName: string;
  date: string;
  time: string;
  purpose: string;
  counsellor: string;
  mode: string;
  location: string;
  status: string;
  reminderStatus: string;
  notes: string;
  sourceSubmissionId?: string;
}

export interface FollowUpRecord extends CentreRecordBase {
  clientId: string;
  clientName: string;
  dueDate: string;
  dueTime: string;
  followUpType: string;
  purpose: string;
  assignedTo: string;
  priority: string;
  status: string;
  outcome: string;
  notes: string;
  sourceSubmissionId?: string;
}

export interface CarePlanRecord extends CentreRecordBase {
  planCode: string;
  clientId: string;
  clientName: string;
  service: string;
  counsellor: string;
  startDate: string;
  endDate: string;
  sessionsPlanned: number;
  sessionsCompleted: number;
  totalFee: number;
  amountPaid: number;
  nextDueDate: string;
  status: string;
  goals: string;
  notes: string;
}

export interface CommunicationRecord extends CentreRecordBase {
  clientId: string;
  clientName: string;
  sourceSubmissionId?: string;
  sourceCommunicationId?: string;
  recipient?: string;
  subject?: string;
  communicationDate: string;
  communicationTime: string;
  channel: string;
  direction: string;
  purpose: string;
  staff: string;
  outcome: string;
  nextActionDate: string;
  status: string;
  notes: string;
}

export interface DocumentRecord extends CentreRecordBase {
  clientId: string;
  clientName: string;
  documentType: string;
  documentName: string;
  reference: string;
  receivedDate: string;
  expiryDate: string;
  verificationStatus: string;
  notes: string;
}

export interface ServiceRecord extends CentreRecordBase {
  serviceCode: string;
  name: string;
  category: string;
  durationMinutes: string;
  fee: number;
  status: string;
  description: string;
  notes: string;
}

export interface PaymentRecord extends CentreRecordBase {
  clientId: string;
  clientName: string;
  receiptNo: string;
  paymentDate: string;
  service: string;
  amount: number;
  discount: number;
  paymentMethod: string;
  paymentStatus: string;
  referenceNo: string;
  collectedBy: string;
  notes: string;
}

export interface ExpenseRecord extends CentreRecordBase {
  expenseDate: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  vendor: string;
  referenceNo: string;
  recordedBy: string;
  notes: string;
}

export interface InventoryRecord extends CentreRecordBase {
  itemCode: string;
  itemName: string;
  category: string;
  quantity: number;
  minimumStock: number;
  unit: string;
  vendor: string;
  unitCost: number;
  lastRestocked: string;
  status: string;
  notes: string;
}

export interface StaffRecord extends CentreRecordBase {
  staffCode: string;
  fullName: string;
  role: string;
  phone: string;
  email: string;
  joiningDate: string;
  workingHours: string;
  specialization: string;
  status: string;
  address: string;
  emergencyContact: string;
  notes: string;
}

export interface TaskRecord extends CentreRecordBase {
  title: string;
  category: string;
  dueDate: string;
  dueTime: string;
  assignedTo: string;
  priority: string;
  status: string;
  relatedClientId: string;
  relatedClientName: string;
  description: string;
  notes: string;
}

export interface ActivityRecord {
  id: string;
  action: "created" | "updated" | "archived" | "restored";
  collection: CentreCollection;
  recordId: string;
  label: string;
  at: string;
}

export interface ArchivedCentreRecord {
  archiveId: string;
  collection: CentreCollection;
  archivedAt: string;
  record: CentreRecord;
}

export interface CentreAdminStore {
  version: 1;
  updatedAt: string | null;
  clients: ClientRecord[];
  leads: LeadRecord[];
  sessions: SessionRecord[];
  appointments: AppointmentRecord[];
  followUps: FollowUpRecord[];
  carePlans: CarePlanRecord[];
  communications: CommunicationRecord[];
  documents: DocumentRecord[];
  services: ServiceRecord[];
  payments: PaymentRecord[];
  expenses: ExpenseRecord[];
  inventory: InventoryRecord[];
  staff: StaffRecord[];
  tasks: TaskRecord[];
  archives: ArchivedCentreRecord[];
  activity: ActivityRecord[];
}

export type CentreRecord =
  | ClientRecord
  | LeadRecord
  | SessionRecord
  | AppointmentRecord
  | FollowUpRecord
  | CarePlanRecord
  | CommunicationRecord
  | DocumentRecord
  | ServiceRecord
  | PaymentRecord
  | ExpenseRecord
  | InventoryRecord
  | StaffRecord
  | TaskRecord;
