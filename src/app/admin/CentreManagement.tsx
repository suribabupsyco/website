"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeIndianRupee,
  CalendarCheck2,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock3,
  DatabaseBackup,
  FolderOpen,
  Download,
  FileText,
  HeartHandshake,
  MessageSquare,
  IndianRupee,
  Inbox,
  ListTodo,
  Package,
  NotebookTabs,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Wallet,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import type { FormSubmissionRecord } from "@/lib/form-submission-types";
import type {
  CentreAdminStore,
  CentreCollection,
  CentreRecord,
  ClientRecord,
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

type FieldType = "text" | "email" | "tel" | "date" | "time" | "number" | "textarea" | "select";
interface FieldDef {
  key: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  wide?: boolean;
}

interface CollectionConfig {
  collection: CentreCollection;
  path: string;
  title: string;
  singular: string;
  subtitle: string;
  description: string;
  fields: FieldDef[];
  columns: { key: string; label: string }[];
}

const configs: Record<string, CollectionConfig> = {
  clients: {
    collection: "clients",
    path: "/admin/clients",
    title: "Client records",
    singular: "Client",
    subtitle: "Complete patient / customer profiles and counselling intake details",
    description: "Maintain each person's contact, family, counselling, consent and private centre notes in one record.",
    columns: [
      { key: "clientCode", label: "Client ID" },
      { key: "fullName", label: "Client" },
      { key: "phone", label: "Phone" },
      { key: "counsellingFor", label: "Counselling" },
      { key: "assignedCounsellor", label: "Counsellor" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "clientCode", label: "Client ID", placeholder: "Auto-generated if blank" },
      { key: "fullName", label: "Full name", required: true },
      { key: "phone", label: "Primary phone", type: "tel", required: true },
      { key: "alternatePhone", label: "Alternate phone", type: "tel" },
      { key: "email", label: "Email", type: "email" },
      { key: "dateOfBirth", label: "Date of birth", type: "date" },
      { key: "age", label: "Age" },
      { key: "gender", label: "Gender", type: "select", options: ["Female", "Male", "Non-binary", "Prefer not to say", "Other"] },
      { key: "occupationOrClass", label: "Occupation / class" },
      { key: "schoolCollegeOrCompany", label: "School / college / company" },
      { key: "parentGuardianName", label: "Parent / guardian name" },
      { key: "relationship", label: "Relationship" },
      { key: "city", label: "City" },
      { key: "address", label: "Address", type: "textarea", wide: true },
      { key: "emergencyContact", label: "Emergency contact" },
      { key: "counsellingFor", label: "Counselling for", type: "select", options: ["Individual counselling", "Student counselling", "Career counselling", "Family counselling", "Couple counselling", "Parent counselling", "Well-being / emotional support", "Other"] },
      { key: "primaryConcern", label: "Primary concern / reason", type: "textarea", wide: true },
      { key: "preferredLanguage", label: "Preferred language", type: "select", options: ["Telugu", "English", "Hindi", "Other"] },
      { key: "preferredSessionType", label: "Preferred session", type: "select", options: ["In-person", "Online", "Phone", "Flexible"] },
      { key: "referralSource", label: "How they heard about centre" },
      { key: "assignedCounsellor", label: "Assigned counsellor" },
      { key: "status", label: "Client status", type: "select", options: ["Active", "New", "Follow-up", "On hold", "Completed", "Closed"], required: true },
      { key: "consent", label: "Consent / privacy acknowledgement", type: "select", options: ["Received", "Pending", "Not applicable"] },
      { key: "tags", label: "Tags", placeholder: "e.g. student, anxiety, career" },
      { key: "documents", label: "Document references", type: "textarea", placeholder: "Document names / secure file references only", wide: true },
      { key: "notes", label: "General private notes", type: "textarea", wide: true },
      { key: "sourceSubmissionId", label: "Website submission ID" },
    ],
  },
  leads: {
    collection: "leads",
    path: "/admin/leads",
    title: "CRM pipeline",
    singular: "Lead",
    subtitle: "Website, walk-in, call, referral and centre enquiries in one pipeline",
    description: "Track website and offline enquiries from first contact through follow-up, booking, conversion or closure.",
    columns: [
      { key: "leadCode", label: "Lead ID" },
      { key: "fullName", label: "Lead" },
      { key: "phone", label: "Phone" },
      { key: "enquiryFor", label: "Interested in" },
      { key: "assignedTo", label: "Owner" },
      { key: "stage", label: "Stage" },
    ],
    fields: [
      { key: "leadCode", label: "Lead ID", placeholder: "Auto-generated if blank" },
      { key: "fullName", label: "Full name", required: true },
      { key: "phone", label: "Phone", type: "tel", required: true },
      { key: "email", label: "Email", type: "email" },
      { key: "source", label: "Lead source", type: "select", options: ["Website", "Walk-in", "Phone", "WhatsApp", "Referral", "Google", "Social media", "Event / workshop", "Other"] },
      { key: "enquiryFor", label: "Enquiry for", type: "select", options: ["Individual counselling", "Student counselling", "Career counselling", "Family counselling", "Couple counselling", "Parent counselling", "Workshop / training", "Assessment", "Other"] },
      { key: "preferredMode", label: "Preferred mode", type: "select", options: ["In-person", "Online", "Phone", "Flexible"] },
      { key: "assignedTo", label: "Assigned to" },
      { key: "stage", label: "Pipeline stage", type: "select", options: ["New", "Contacted", "Qualified", "Consultation booked", "Converted", "Lost"], required: true },
      { key: "priority", label: "Priority", type: "select", options: ["Low", "Normal", "High", "Urgent"] },
      { key: "nextFollowUp", label: "Next follow-up", type: "date" },
      { key: "estimatedValue", label: "Estimated value (₹)", type: "number" },
      { key: "city", label: "City" },
      { key: "convertedClientId", label: "Converted client ID" },
      { key: "sourceSubmissionId", label: "Website submission ID" },
      { key: "notes", label: "Lead notes", type: "textarea", wide: true },
    ],
  },
  sessions: {
    collection: "sessions",
    path: "/admin/sessions",
    title: "Counselling records",
    singular: "Counselling record",
    subtitle: "Session history, observations, action plans and follow-up notes",
    description: "Store the centre's internal counselling history separately from website enquiries.",
    columns: [
      { key: "clientName", label: "Client" },
      { key: "sessionDate", label: "Date" },
      { key: "counsellor", label: "Counsellor" },
      { key: "sessionType", label: "Session type" },
      { key: "nextFollowUp", label: "Next follow-up" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "clientId", label: "Client", type: "select", required: true },
      { key: "sessionDate", label: "Session date", type: "date", required: true },
      { key: "sessionTime", label: "Session time", type: "time" },
      { key: "counsellor", label: "Counsellor", required: true },
      { key: "sessionType", label: "Session type", type: "select", options: ["Initial assessment", "Individual counselling", "Student counselling", "Career counselling", "Family counselling", "Couple counselling", "Parent counselling", "Review / follow-up", "Other"] },
      { key: "mode", label: "Mode", type: "select", options: ["In-person", "Online", "Phone"] },
      { key: "durationMinutes", label: "Duration (minutes)", type: "number" },
      { key: "status", label: "Session status", type: "select", options: ["Scheduled", "Completed", "Cancelled", "No-show"], required: true },
      { key: "concern", label: "Concern / focus", type: "textarea", wide: true },
      { key: "sessionSummary", label: "Session summary", type: "textarea", wide: true },
      { key: "observations", label: "Counsellor observations", type: "textarea", wide: true },
      { key: "actionPlan", label: "Action plan", type: "textarea", wide: true },
      { key: "homeworkRecommendations", label: "Recommendations / exercises", type: "textarea", wide: true },
      { key: "nextFollowUp", label: "Next follow-up", type: "date" },
      { key: "confidentialNotes", label: "Confidential notes", type: "textarea", wide: true },
    ],
  },
  appointments: {
    collection: "appointments",
    path: "/admin/appointments",
    title: "Appointments",
    singular: "Appointment",
    subtitle: "Manage the centre calendar, visit purpose and appointment status",
    description: "Track in-person, phone and online appointments for every client.",
    columns: [
      { key: "clientName", label: "Client" },
      { key: "date", label: "Date" },
      { key: "time", label: "Time" },
      { key: "purpose", label: "Purpose" },
      { key: "counsellor", label: "Counsellor" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "clientId", label: "Client", type: "select", required: true },
      { key: "date", label: "Appointment date", type: "date", required: true },
      { key: "time", label: "Time", type: "time", required: true },
      { key: "purpose", label: "Purpose", required: true },
      { key: "counsellor", label: "Counsellor" },
      { key: "mode", label: "Mode", type: "select", options: ["In-person", "Online", "Phone"] },
      { key: "location", label: "Room / meeting link" },
      { key: "status", label: "Status", type: "select", options: ["Scheduled", "Confirmed", "Completed", "Cancelled", "No-show"], required: true },
      { key: "reminderStatus", label: "Reminder", type: "select", options: ["Not sent", "Sent", "Confirmed by client"] },
      { key: "notes", label: "Notes", type: "textarea", wide: true },
    ],
  },
  "follow-ups": {
    collection: "followUps",
    path: "/admin/follow-ups",
    title: "Follow-ups",
    singular: "Follow-up",
    subtitle: "Calls, WhatsApp, email and counselling follow-up work",
    description: "Keep due dates, ownership and outcome notes so no client follow-up is missed.",
    columns: [
      { key: "clientName", label: "Client" },
      { key: "dueDate", label: "Due" },
      { key: "followUpType", label: "Type" },
      { key: "assignedTo", label: "Assigned to" },
      { key: "priority", label: "Priority" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "clientId", label: "Client", type: "select", required: true },
      { key: "dueDate", label: "Due date", type: "date", required: true },
      { key: "dueTime", label: "Due time", type: "time" },
      { key: "followUpType", label: "Follow-up type", type: "select", options: ["Phone call", "WhatsApp", "Email", "In-person", "Session review", "Other"] },
      { key: "purpose", label: "Purpose", required: true },
      { key: "assignedTo", label: "Assigned to" },
      { key: "priority", label: "Priority", type: "select", options: ["Low", "Normal", "High", "Urgent"] },
      { key: "status", label: "Status", type: "select", options: ["Pending", "In progress", "Completed", "Cancelled"] },
      { key: "outcome", label: "Outcome", type: "textarea", wide: true },
      { key: "notes", label: "Notes", type: "textarea", wide: true },
    ],
  },
  "care-plans": {
    collection: "carePlans",
    path: "/admin/care-plans",
    title: "Care plans & packages",
    singular: "Care plan",
    subtitle: "Client service plans, session utilisation, fees and due dates",
    description: "Manage structured counselling plans and packages with session progress and fee commitments in one place.",
    columns: [
      { key: "planCode", label: "Plan ID" },
      { key: "clientName", label: "Client" },
      { key: "service", label: "Service / package" },
      { key: "sessionsPlanned", label: "Sessions" },
      { key: "totalFee", label: "Plan fee" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "planCode", label: "Plan ID", placeholder: "Auto-generated if blank" },
      { key: "clientId", label: "Client", type: "select", required: true },
      { key: "service", label: "Service / package", required: true },
      { key: "counsellor", label: "Counsellor / owner" },
      { key: "startDate", label: "Start date", type: "date", required: true },
      { key: "endDate", label: "Target end date", type: "date" },
      { key: "sessionsPlanned", label: "Sessions planned", type: "number" },
      { key: "sessionsCompleted", label: "Sessions completed", type: "number" },
      { key: "totalFee", label: "Total plan fee (₹)", type: "number" },
      { key: "amountPaid", label: "Amount paid (₹)", type: "number" },
      { key: "nextDueDate", label: "Next fee due date", type: "date" },
      { key: "status", label: "Plan status", type: "select", options: ["Draft", "Active", "On hold", "Completed", "Cancelled"], required: true },
      { key: "goals", label: "Goals / intended outcomes", type: "textarea", wide: true },
      { key: "notes", label: "Internal plan notes", type: "textarea", wide: true },
    ],
  },
  communications: {
    collection: "communications",
    path: "/admin/communications",
    title: "Communication log",
    singular: "Communication",
    subtitle: "Calls, WhatsApp, email and front-desk contact history",
    description: "Keep a searchable client communication timeline, including messages launched from website enquiries, so every administrator knows what was sent, when and what happens next.",
    columns: [
      { key: "clientName", label: "Client / contact" },
      { key: "communicationDate", label: "Date" },
      { key: "channel", label: "Channel" },
      { key: "recipient", label: "Recipient" },
      { key: "purpose", label: "Purpose" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "clientId", label: "Linked client", type: "select" },
      { key: "clientName", label: "Client / contact name", required: true },
      { key: "communicationDate", label: "Date", type: "date", required: true },
      { key: "communicationTime", label: "Time", type: "time" },
      { key: "channel", label: "Channel", type: "select", options: ["Phone call", "WhatsApp", "Email", "SMS", "In-person", "Other"] },
      { key: "direction", label: "Direction", type: "select", options: ["Incoming", "Outgoing"] },
      { key: "recipient", label: "Recipient / destination" },
      { key: "subject", label: "Subject" },
      { key: "purpose", label: "Purpose", required: true },
      { key: "staff", label: "Handled by" },
      { key: "status", label: "Outcome status", type: "select", options: ["Completed", "Awaiting response", "Follow-up needed", "No response"] },
      { key: "nextActionDate", label: "Next action date", type: "date" },
      { key: "outcome", label: "Message / outcome", type: "textarea", wide: true },
      { key: "notes", label: "Private notes", type: "textarea", wide: true },
    ],
  },
  documents: {
    collection: "documents",
    path: "/admin/documents",
    title: "Client documents",
    singular: "Document record",
    subtitle: "Consent, assessments and secure document references",
    description: "Track document metadata and secure file references without placing binary files inside the JSON database-free store.",
    columns: [
      { key: "clientName", label: "Client" },
      { key: "documentName", label: "Document" },
      { key: "documentType", label: "Type" },
      { key: "receivedDate", label: "Received" },
      { key: "expiryDate", label: "Expiry" },
      { key: "verificationStatus", label: "Verification" },
    ],
    fields: [
      { key: "clientId", label: "Client", type: "select", required: true },
      { key: "documentType", label: "Document type", type: "select", options: ["Consent form", "Assessment", "Report", "Referral", "ID / identity reference", "Receipt / invoice", "Counselling worksheet", "Other"] },
      { key: "documentName", label: "Document name", required: true },
      { key: "reference", label: "Secure file / folder reference", placeholder: "SharePoint/Drive/private storage path or file name" },
      { key: "receivedDate", label: "Received date", type: "date" },
      { key: "expiryDate", label: "Expiry / review date", type: "date" },
      { key: "verificationStatus", label: "Verification", type: "select", options: ["Pending", "Verified", "Needs update", "Not applicable"] },
      { key: "notes", label: "Document notes", type: "textarea", wide: true },
    ],
  },
  services: {
    collection: "services",
    path: "/admin/services",
    title: "Services & fees",
    singular: "Service",
    subtitle: "Counselling services, duration and standard fee catalogue",
    description: "Keep the centre's counselling and program catalogue available to administrators in the same JSON storage.",
    columns: [
      { key: "serviceCode", label: "Service ID" },
      { key: "name", label: "Service" },
      { key: "category", label: "Category" },
      { key: "durationMinutes", label: "Duration" },
      { key: "fee", label: "Fee" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "serviceCode", label: "Service ID", placeholder: "Auto-generated if blank" },
      { key: "name", label: "Service / program name", required: true },
      { key: "category", label: "Category", type: "select", options: ["Individual", "Student", "Career", "Family", "Couple", "Parent", "Workshop", "Assessment", "Other"] },
      { key: "durationMinutes", label: "Standard duration (minutes)", type: "number" },
      { key: "fee", label: "Standard fee (₹)", type: "number" },
      { key: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
      { key: "description", label: "Description", type: "textarea", wide: true },
      { key: "notes", label: "Internal notes", type: "textarea", wide: true },
    ],
  },
  payments: {
    collection: "payments",
    path: "/admin/payments",
    title: "Payments",
    singular: "Payment",
    subtitle: "Receipts, counselling fees and payment status",
    description: "Maintain centre income records without introducing a database.",
    columns: [
      { key: "receiptNo", label: "Receipt" },
      { key: "clientName", label: "Client" },
      { key: "paymentDate", label: "Date" },
      { key: "service", label: "Service" },
      { key: "amount", label: "Amount" },
      { key: "paymentStatus", label: "Status" },
    ],
    fields: [
      { key: "clientId", label: "Client", type: "select" },
      { key: "receiptNo", label: "Receipt number", placeholder: "Auto-generated if blank" },
      { key: "paymentDate", label: "Payment date", type: "date", required: true },
      { key: "service", label: "Service / purpose", required: true },
      { key: "amount", label: "Amount (₹)", type: "number", required: true },
      { key: "discount", label: "Discount (₹)", type: "number" },
      { key: "paymentMethod", label: "Payment method", type: "select", options: ["Cash", "UPI", "Card", "Bank transfer", "Other"] },
      { key: "paymentStatus", label: "Payment status", type: "select", options: ["Paid", "Partial", "Pending", "Refunded"] },
      { key: "referenceNo", label: "Transaction / reference number" },
      { key: "collectedBy", label: "Collected by" },
      { key: "notes", label: "Notes", type: "textarea", wide: true },
    ],
  },
  expenses: {
    collection: "expenses",
    path: "/admin/expenses",
    title: "Expenses",
    singular: "Expense",
    subtitle: "Track centre operational expenses and vendor payments",
    description: "Record rent, utilities, supplies, marketing and other operational costs.",
    columns: [
      { key: "expenseDate", label: "Date" },
      { key: "category", label: "Category" },
      { key: "description", label: "Description" },
      { key: "vendor", label: "Vendor" },
      { key: "amount", label: "Amount" },
      { key: "recordedBy", label: "Recorded by" },
    ],
    fields: [
      { key: "expenseDate", label: "Expense date", type: "date", required: true },
      { key: "category", label: "Category", type: "select", options: ["Rent", "Utilities", "Staff", "Marketing", "Supplies", "Travel", "Software / subscriptions", "Maintenance", "Professional services", "Other"] },
      { key: "description", label: "Description", required: true },
      { key: "amount", label: "Amount (₹)", type: "number", required: true },
      { key: "paymentMethod", label: "Payment method", type: "select", options: ["Cash", "UPI", "Card", "Bank transfer", "Other"] },
      { key: "vendor", label: "Vendor / paid to" },
      { key: "referenceNo", label: "Reference number" },
      { key: "recordedBy", label: "Recorded by" },
      { key: "notes", label: "Notes", type: "textarea", wide: true },
    ],
  },
  inventory: {
    collection: "inventory",
    path: "/admin/inventory",
    title: "Inventory & supplies",
    singular: "Inventory item",
    subtitle: "Centre supplies, assessment materials and operational stock",
    description: "Track stock levels, minimum quantities, vendors and restocking so front-desk operations are covered too.",
    columns: [
      { key: "itemCode", label: "Item ID" },
      { key: "itemName", label: "Item" },
      { key: "category", label: "Category" },
      { key: "quantity", label: "Qty" },
      { key: "minimumStock", label: "Minimum" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "itemCode", label: "Item ID", placeholder: "Auto-generated if blank" },
      { key: "itemName", label: "Item name", required: true },
      { key: "category", label: "Category", type: "select", options: ["Office supplies", "Assessment materials", "Printed material", "Housekeeping", "Refreshments", "Electronics", "Furniture", "Other"] },
      { key: "quantity", label: "Current quantity", type: "number", required: true },
      { key: "minimumStock", label: "Minimum stock", type: "number" },
      { key: "unit", label: "Unit", placeholder: "pcs, packs, boxes…" },
      { key: "vendor", label: "Preferred vendor" },
      { key: "unitCost", label: "Unit cost (₹)", type: "number" },
      { key: "lastRestocked", label: "Last restocked", type: "date" },
      { key: "status", label: "Status", type: "select", options: ["In stock", "Low stock", "Out of stock", "Discontinued"] },
      { key: "notes", label: "Notes", type: "textarea", wide: true },
    ],
  },
  staff: {
    collection: "staff",
    path: "/admin/staff",
    title: "Staff directory",
    singular: "Staff member",
    subtitle: "Counsellors and centre team contact / work information",
    description: "Keep a simple internal directory for counsellors, coordinators and administrators.",
    columns: [
      { key: "staffCode", label: "Staff ID" },
      { key: "fullName", label: "Name" },
      { key: "role", label: "Role" },
      { key: "phone", label: "Phone" },
      { key: "specialization", label: "Specialization" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "staffCode", label: "Staff ID", placeholder: "Auto-generated if blank" },
      { key: "fullName", label: "Full name", required: true },
      { key: "role", label: "Role", required: true },
      { key: "phone", label: "Phone", type: "tel" },
      { key: "email", label: "Email", type: "email" },
      { key: "joiningDate", label: "Joining date", type: "date" },
      { key: "workingHours", label: "Working hours" },
      { key: "specialization", label: "Specialization" },
      { key: "status", label: "Status", type: "select", options: ["Active", "On leave", "Inactive"] },
      { key: "address", label: "Address", type: "textarea", wide: true },
      { key: "emergencyContact", label: "Emergency contact" },
      { key: "notes", label: "Internal notes", type: "textarea", wide: true },
    ],
  },
  tasks: {
    collection: "tasks",
    path: "/admin/tasks",
    title: "Centre tasks",
    singular: "Task",
    subtitle: "Internal work, reminders and centre administration",
    description: "Use this for non-counselling work such as document follow-up, calls, purchasing and operations.",
    columns: [
      { key: "title", label: "Task" },
      { key: "category", label: "Category" },
      { key: "dueDate", label: "Due" },
      { key: "assignedTo", label: "Assigned to" },
      { key: "priority", label: "Priority" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "title", label: "Task title", required: true, wide: true },
      { key: "category", label: "Category", type: "select", options: ["Client support", "Administration", "Finance", "Marketing", "Documents", "Facility", "Staff", "Other"] },
      { key: "dueDate", label: "Due date", type: "date" },
      { key: "dueTime", label: "Due time", type: "time" },
      { key: "assignedTo", label: "Assigned to" },
      { key: "priority", label: "Priority", type: "select", options: ["Low", "Normal", "High", "Urgent"] },
      { key: "status", label: "Status", type: "select", options: ["Pending", "In progress", "Completed", "Cancelled"] },
      { key: "relatedClientId", label: "Related client", type: "select" },
      { key: "description", label: "Description", type: "textarea", wide: true },
      { key: "notes", label: "Notes", type: "textarea", wide: true },
    ],
  },
};

export const centreRouteMeta: Record<string, { title: string; subtitle: string }> = {
  "/admin/centre": { title: "Centre overview", subtitle: "Daily operations, counselling, appointments and finance" },
  "/admin/today": { title: "Today desk", subtitle: "Appointments, follow-ups, tasks, dues and centre alerts for today" },
  "/admin/calendar": { title: "Centre calendar", subtitle: "Seven-day appointment and counselling schedule" },
  "/admin/leads": { title: configs.leads.title, subtitle: configs.leads.subtitle },
  "/admin/clients": { title: configs.clients.title, subtitle: configs.clients.subtitle },
  "/admin/sessions": { title: configs.sessions.title, subtitle: configs.sessions.subtitle },
  "/admin/appointments": { title: configs.appointments.title, subtitle: configs.appointments.subtitle },
  "/admin/follow-ups": { title: configs["follow-ups"].title, subtitle: configs["follow-ups"].subtitle },
  "/admin/care-plans": { title: configs["care-plans"].title, subtitle: configs["care-plans"].subtitle },
  "/admin/communications": { title: configs.communications.title, subtitle: configs.communications.subtitle },
  "/admin/documents": { title: configs.documents.title, subtitle: configs.documents.subtitle },
  "/admin/services": { title: configs.services.title, subtitle: configs.services.subtitle },
  "/admin/payments": { title: configs.payments.title, subtitle: configs.payments.subtitle },
  "/admin/expenses": { title: configs.expenses.title, subtitle: configs.expenses.subtitle },
  "/admin/finance": { title: "Finance command", subtitle: "Income, expenses, outstanding plan fees and cash-flow view" },
  "/admin/inventory": { title: configs.inventory.title, subtitle: configs.inventory.subtitle },
  "/admin/staff": { title: configs.staff.title, subtitle: configs.staff.subtitle },
  "/admin/tasks": { title: configs.tasks.title, subtitle: configs.tasks.subtitle },
  "/admin/reports": { title: "Centre reports", subtitle: "Operational and financial summary from JSON records" },
  "/admin/archive": { title: "Archive", subtitle: "Restorable centre records retained without data loss" },
  "/admin/data": { title: "Data & backup", subtitle: "JSON storage status and full centre export" },
};

export function isCentreAdminRoute(pathname: string) {
  return Object.prototype.hasOwnProperty.call(centreRouteMeta, pathname);
}

function formatDate(value: unknown, withTime = false) {
  if (!value) return "—";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", withTime
    ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function offsetDateKey(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return localDateKey(date);
}

function money(value: unknown) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number.isFinite(amount) ? amount : 0);
}

function textValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function searchable(record: CentreRecord) {
  return Object.values(record as unknown as Record<string, unknown>).map(textValue).join(" ").toLowerCase();
}

function statusPill(value: unknown) {
  const status = String(value || "").toLowerCase();
  if (["completed", "paid", "active", "confirmed", "received", "verified", "converted", "in stock"].includes(status)) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (["scheduled", "new", "in progress", "follow-up", "partial", "contacted", "qualified", "consultation booked"].includes(status)) return "border-sky-200 bg-sky-50 text-sky-700";
  if (["pending", "on hold", "not sent", "awaiting response", "follow-up needed", "needs update", "low stock", "draft"].includes(status)) return "border-amber-200 bg-amber-50 text-amber-800";
  if (["cancelled", "closed", "inactive", "no-show", "refunded", "lost", "out of stock", "discontinued", "no response"].includes(status)) return "border-slate-200 bg-slate-100 text-slate-600";
  return "border-slate-200 bg-white text-slate-600";
}

function isStatusKey(key: string) {
  return key === "status" || key === "stage" || key === "paymentStatus" || key === "reminderStatus" || key === "verificationStatus";
}

function CollectionDrawer({
  config,
  clients,
  store,
  initial,
  onClose,
  onSaved,
  onArchived,
}: {
  config: CollectionConfig;
  clients: ClientRecord[];
  store: CentreAdminStore;
  initial: CentreRecord | null;
  onClose: () => void;
  onSaved: () => void;
  onArchived: () => void;
}) {
  const [data, setData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const field of config.fields) {
      const value = initial ? (initial as unknown as Record<string, unknown>)[field.key] : "";
      next[field.key] = value === null || value === undefined ? "" : String(value);
    }
    if (!initial) {
      if (config.collection === "clients") next.status = "New";
      if (config.collection === "leads") { next.stage = "New"; next.priority = "Normal"; }
      if (config.collection === "sessions") next.status = "Completed";
      if (config.collection === "appointments") { next.status = "Scheduled"; next.reminderStatus = "Not sent"; }
      if (config.collection === "followUps") { next.status = "Pending"; next.priority = "Normal"; }
      if (config.collection === "carePlans") { next.status = "Active"; next.startDate = new Date().toISOString().slice(0, 10); }
      if (config.collection === "communications") { next.status = "Completed"; next.direction = "Outgoing"; next.communicationDate = new Date().toISOString().slice(0, 10); }
      if (config.collection === "documents") next.verificationStatus = "Pending";
      if (config.collection === "services") next.status = "Active";
      if (config.collection === "payments") { next.paymentStatus = "Paid"; next.paymentDate = new Date().toISOString().slice(0, 10); }
      if (config.collection === "expenses") next.expenseDate = new Date().toISOString().slice(0, 10);
      if (config.collection === "inventory") next.status = "In stock";
      if (config.collection === "staff") next.status = "Active";
      if (config.collection === "tasks") { next.status = "Pending"; next.priority = "Normal"; }
    }
    setData(next);
    setError("");
  }, [config, initial]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      for (const field of config.fields) {
        if (field.required && !String(data[field.key] || "").trim()) throw new Error(`${field.label} is required.`);
      }
      const payload: Record<string, string | number> = { ...data };
      for (const field of config.fields) if (field.type === "number") payload[field.key] = Number(data[field.key] || 0);

      const clientKey = config.collection === "tasks" ? "relatedClientId" : "clientId";
      if (payload[clientKey]) {
        const client = clients.find((item) => item.id === payload[clientKey]);
        if (client) payload[config.collection === "tasks" ? "relatedClientName" : "clientName"] = client.fullName;
      }

      const response = await fetch(initial ? `/api/centre-admin/${config.collection}/${initial.id}` : "/api/centre-admin", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initial ? payload : { collection: config.collection, data: payload }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to save record.");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save record.");
    } finally {
      setSaving(false);
    }
  };

  const convertLeadToClient = async () => {
    if (!initial || config.collection !== "leads") return;
    const lead = initial as unknown as Record<string, unknown>;
    if (String(lead.convertedClientId || "")) return;
    setConverting(true);
    setError("");
    try {
      const clientResponse = await fetch("/api/centre-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: "clients", data: {
          fullName: String(lead.fullName || ""),
          phone: String(lead.phone || ""),
          email: String(lead.email || ""),
          city: String(lead.city || ""),
          counsellingFor: String(lead.enquiryFor || ""),
          preferredSessionType: String(lead.preferredMode || ""),
          referralSource: String(lead.source || "Offline CRM"),
          assignedCounsellor: String(lead.assignedTo || ""),
          status: "New",
          consent: "Pending",
          notes: `Converted from CRM ${String(lead.leadCode || "lead")}. ${String(lead.notes || "")}`.trim(),
        } }),
      });
      const clientBody = await clientResponse.json();
      if (!clientResponse.ok) throw new Error(clientBody.error || "Unable to create client profile.");
      const clientId = String(clientBody.record?.id || "");
      const leadResponse = await fetch(`/api/centre-admin/leads/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: "Converted", convertedClientId: clientId }),
      });
      const leadBody = await leadResponse.json();
      if (!leadResponse.ok) throw new Error(leadBody.error || "Client was created, but the CRM lead could not be updated.");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to convert lead.");
    } finally {
      setConverting(false);
    }
  };

  const archive = async () => {
    if (!initial) return;
    if (!window.confirm(`Archive this ${config.singular.toLowerCase()} record? The action is recorded in the JSON activity history.`)) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/centre-admin/${config.collection}/${initial.id}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to archive record.");
      onArchived();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to archive record.");
    } finally {
      setSaving(false);
    }
  };

  const clientJourney = config.collection === "clients" && initial ? {
    sessions: store.sessions.filter((item) => item.clientId === initial.id),
    appointments: store.appointments.filter((item) => item.clientId === initial.id),
    followUps: store.followUps.filter((item) => item.clientId === initial.id),
    carePlans: store.carePlans.filter((item) => item.clientId === initial.id),
    communications: store.communications.filter((item) => item.clientId === initial.id),
    documents: store.documents.filter((item) => item.clientId === initial.id),
    payments: store.payments.filter((item) => item.clientId === initial.id),
  } : null;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/30 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="ml-auto flex h-full w-full max-w-[760px] flex-col bg-white shadow-[-30px_0_80px_rgba(15,23,42,.15)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#5d8079]"><Sparkles className="h-3.5 w-3.5" /> JSON centre record</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-900">{initial ? `Edit ${config.singular.toLowerCase()}` : `Add ${config.singular.toLowerCase()}`}</h2>
            <p className="mt-1 text-sm text-slate-500">{config.description}</p>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            {clientJourney && (
              <section className="mb-6 rounded-2xl border border-[#173f45]/10 bg-[#173f45]/[0.035] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5d8079]">Client 360°</div><h3 className="mt-1 text-sm font-bold text-slate-800">Counselling & centre activity</h3></div><HeartHandshake className="h-5 w-5 text-[#5d8079]" /></div>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    ["Sessions", clientJourney.sessions.length],
                    ["Appointments", clientJourney.appointments.length],
                    ["Pending follow-ups", clientJourney.followUps.filter((item) => !["Completed", "Cancelled"].includes(item.status)).length],
                    ["Care plans", clientJourney.carePlans.filter((item) => item.status === "Active").length],
                    ["Communications", clientJourney.communications.length],
                    ["Payments", money(clientJourney.payments.filter((item) => item.paymentStatus !== "Refunded").reduce((sum, item) => sum + Number(item.amount || 0), 0))],
                  ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-white bg-white/80 p-3"><div className="text-[10px] font-semibold text-slate-400">{label}</div><div className="mt-1 text-base font-bold text-slate-800">{value}</div></div>)}
                </div>
                {clientJourney.sessions.length > 0 && <div className="mt-4 border-t border-[#173f45]/10 pt-4"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Recent counselling</div><div className="mt-2 space-y-2">{[...clientJourney.sessions].sort((a,b) => b.sessionDate.localeCompare(a.sessionDate)).slice(0,2).map((item) => <div key={item.id} className="rounded-xl bg-white p-3"><div className="flex items-center justify-between gap-3"><div className="text-xs font-bold text-slate-700">{formatDate(item.sessionDate)} • {item.sessionType || "Counselling"}</div><span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${statusPill(item.status)}`}>{item.status}</span></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.sessionSummary || item.concern || "No session summary added."}</p></div>)}</div></div>}
                {(clientJourney.carePlans.length > 0 || clientJourney.communications.length > 0) && <div className="mt-4 grid gap-3 border-t border-[#173f45]/10 pt-4 sm:grid-cols-2">
                  <div><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Active plan</div>{[...clientJourney.carePlans].filter((item) => item.status === "Active").slice(0,1).map((item) => <div key={item.id} className="mt-2 rounded-xl bg-white p-3"><div className="text-xs font-bold text-slate-700">{item.service || item.planCode}</div><div className="mt-1 text-[11px] text-slate-400">{item.sessionsCompleted || 0}/{item.sessionsPlanned || 0} sessions • {money(Math.max(0, Number(item.totalFee || 0)-Number(item.amountPaid || 0)))} due</div></div>)}{clientJourney.carePlans.filter((item) => item.status === "Active").length === 0 && <div className="mt-2 text-xs text-slate-400">No active care plan.</div>}</div>
                  <div><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Latest communication</div>{[...clientJourney.communications].sort((a,b) => `${b.communicationDate}${b.communicationTime}`.localeCompare(`${a.communicationDate}${a.communicationTime}`)).slice(0,1).map((item) => <div key={item.id} className="mt-2 rounded-xl bg-white p-3"><div className="text-xs font-bold text-slate-700">{item.channel || "Communication"} • {formatDate(item.communicationDate)}</div><div className="mt-1 line-clamp-2 text-[11px] text-slate-400">{item.outcome || item.purpose || "No outcome noted."}</div></div>)}{clientJourney.communications.length === 0 && <div className="mt-2 text-xs text-slate-400">No communication logged.</div>}</div>
                </div>}
              </section>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {config.fields.map((field) => {
                const isClientSelect = (field.key === "clientId" || field.key === "relatedClientId") && field.type === "select";
                const options = isClientSelect ? clients.map((client) => ({ value: client.id, label: `${client.clientCode || "Client"} — ${client.fullName}` })) : (field.options || []).map((option) => ({ value: option, label: option }));
                return (
                  <label key={field.key} className={field.wide ? "sm:col-span-2" : ""}>
                    <span className="mb-1.5 block text-xs font-bold text-slate-600">{field.label}{field.required && <span className="ml-1 text-red-500">*</span>}</span>
                    {field.type === "textarea" ? (
                      <textarea value={data[field.key] || ""} onChange={(e) => setData((current) => ({ ...current, [field.key]: e.target.value }))} rows={4} placeholder={field.placeholder} className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition focus:border-[#5d8079] focus:bg-white focus:ring-4 focus:ring-[#5d8079]/10" />
                    ) : field.type === "select" ? (
                      <select value={data[field.key] || ""} onChange={(e) => setData((current) => ({ ...current, [field.key]: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-[#5d8079] focus:bg-white focus:ring-4 focus:ring-[#5d8079]/10">
                        <option value="">Select</option>
                        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    ) : (
                      <input type={field.type || "text"} value={data[field.key] || ""} onChange={(e) => setData((current) => ({ ...current, [field.key]: e.target.value }))} placeholder={field.placeholder} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm outline-none transition focus:border-[#5d8079] focus:bg-white focus:ring-4 focus:ring-[#5d8079]/10" />
                    )}
                  </label>
                );
              })}
            </div>
            {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:px-7">
            {initial ? <div className="flex flex-wrap gap-2">{config.collection === "leads" && !String((initial as unknown as Record<string, unknown>).convertedClientId || "") && <button type="button" onClick={convertLeadToClient} disabled={saving || converting} className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"><UsersRound className="h-4 w-4" /> {converting ? "Converting…" : "Convert to client"}</button>}<button type="button" onClick={archive} disabled={saving || converting} className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 px-3.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 className="h-4 w-4" /> Archive</button></div> : <span className="text-[11px] text-slate-400">Stored in centre-admin.json</span>}
            <div className="flex gap-2"><button type="button" onClick={onClose} className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-600">Cancel</button><button disabled={saving} className="h-10 rounded-xl bg-[#173f45] px-5 text-xs font-bold text-white hover:bg-[#102f34] disabled:opacity-50">{saving ? "Saving…" : "Save record"}</button></div>
          </div>
        </form>
      </aside>
    </div>
  );
}

function CollectionView({ config, store, reload }: { config: CollectionConfig; store: CentreAdminStore; reload: () => Promise<void> }) {
  const records = store[config.collection] as CentreRecord[];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<CentreRecord | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => { setSearch(""); setStatusFilter("all"); setSelected(null); setCreating(false); }, [config.collection]);

  const filterKey = config.fields.some((field) => field.key === "stage") ? "stage" : config.fields.some((field) => field.key === "paymentStatus") ? "paymentStatus" : config.fields.some((field) => field.key === "verificationStatus") ? "verificationStatus" : config.fields.some((field) => field.key === "status") ? "status" : "";
  const filterOptions = filterKey ? Array.from(new Set(records.map((record) => textValue((record as unknown as Record<string, unknown>)[filterKey])).filter((value) => value !== "—"))).sort() : [];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...records].reverse().filter((record) => {
      if (statusFilter !== "all" && filterKey && textValue((record as unknown as Record<string, unknown>)[filterKey]) !== statusFilter) return false;
      if (!term) return true;
      return searchable(record).includes(term);
    });
  }, [records, search, statusFilter, filterKey]);

  const exportCollection = () => {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), collection: config.collection, records }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `chetana-${config.collection}-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const closeAndReload = async () => { setSelected(null); setCreating(false); await reload(); };

  const leadStages = ["New", "Contacted", "Qualified", "Consultation booked", "Converted", "Lost"];
  const activePlans = store.carePlans.filter((item) => item.status === "Active");
  const planOutstanding = activePlans.reduce((sum, item) => sum + Math.max(0, Number(item.totalFee || 0) - Number(item.amountPaid || 0)), 0);
  const lowStockCount = store.inventory.filter((item) => Number(item.quantity || 0) <= Number(item.minimumStock || 0) && item.status !== "Discontinued").length;

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="inline-flex items-center gap-2 rounded-full border border-[#5d8079]/15 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#5d8079]"><Sparkles className="h-3 w-3" /> Centre management</div><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-4xl">{config.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{config.description}</p></div>
        <button onClick={() => setCreating(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#173f45] px-4 text-xs font-bold text-white shadow-lg shadow-[#173f45]/10 hover:bg-[#102f34]"><Plus className="h-4 w-4" /> Add {config.singular.toLowerCase()}</button>
      </div>

      {config.collection === "leads" && (
        <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          {leadStages.map((stage) => <div key={stage} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,.025)]"><div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{stage}</div><div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-900">{store.leads.filter((item) => item.stage === stage).length}</div></div>)}
        </div>
      )}
      {config.collection === "carePlans" && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="text-xs font-semibold text-slate-500">Active plans</div><div className="mt-2 text-2xl font-semibold text-slate-900">{activePlans.length}</div></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="text-xs font-semibold text-slate-500">Sessions delivered</div><div className="mt-2 text-2xl font-semibold text-slate-900">{activePlans.reduce((sum, item) => sum + Number(item.sessionsCompleted || 0), 0)} <span className="text-sm font-medium text-slate-400">/ {activePlans.reduce((sum, item) => sum + Number(item.sessionsPlanned || 0), 0)}</span></div></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="text-xs font-semibold text-slate-500">Outstanding plan fees</div><div className="mt-2 text-2xl font-semibold text-slate-900">{money(planOutstanding)}</div></div></div>
      )}
      {config.collection === "inventory" && lowStockCount > 0 && <div className="mt-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><AlertTriangle className="h-5 w-5 shrink-0" /><div><strong>{lowStockCount} inventory item{lowStockCount === 1 ? "" : "s"}</strong> at or below minimum stock. Update quantities after restocking.</div></div>}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_36px_rgba(15,23,42,.035)]">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="relative w-full sm:max-w-md"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${config.title.toLowerCase()}…`} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-[#5d8079] focus:bg-white focus:ring-4 focus:ring-[#5d8079]/10" /></div>
          <div className="flex flex-wrap items-center gap-2">{filterOptions.length > 0 && <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none"><option value="all">All {filterKey === "stage" ? "stages" : "statuses"}</option>{filterOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select>}<span className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">{filtered.length} / {records.length} records</span><button onClick={exportCollection} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50"><Download className="h-4 w-4" /> JSON</button></div>
        </div>

        {filtered.length === 0 ? (
          <div className="grid min-h-72 place-items-center px-6 text-center"><div><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"><FileText className="h-6 w-6" /></div><h3 className="mt-4 text-base font-semibold text-slate-800">No records yet</h3><p className="mt-1 text-sm text-slate-400">Add the first {config.singular.toLowerCase()} or change your search.</p></div></div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left">
                <thead><tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{config.columns.map((column) => <th key={column.key} className="px-5 py-3.5">{column.label}</th>)}<th className="px-5 py-3.5 text-right">Edit</th></tr></thead>
                <tbody>{filtered.map((record) => {
                  const raw = record as unknown as Record<string, unknown>;
                  return <tr key={record.id} onClick={() => setSelected(record)} className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-[#173f45]/[0.025]">{config.columns.map((column) => {
                    const value = raw[column.key];
                    const isAmount = ["amount", "fee", "totalFee", "amountPaid", "estimatedValue", "unitCost"].includes(column.key);
                    const isDate = /date$/i.test(column.key) || ["nextFollowUp", "dueDate", "nextDueDate", "expiryDate", "lastRestocked"].includes(column.key);
                    return <td key={column.key} className="max-w-[240px] px-5 py-4 text-xs"><span className={isStatusKey(column.key) ? `inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusPill(value)}` : "font-semibold text-slate-600"}>{isAmount ? money(value) : isDate ? formatDate(value) : textValue(value)}</span></td>;
                  })}<td className="px-5 py-4 text-right"><button className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400"><ChevronRight className="h-4 w-4" /></button></td></tr>;
                })}</tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-100 md:hidden">{filtered.map((record) => {
              const raw = record as unknown as Record<string, unknown>;
              const primary = textValue(raw[config.columns[1]?.key] || raw[config.columns[0]?.key]);
              const secondary = textValue(raw[config.columns[0]?.key]);
              return <button key={record.id} onClick={() => setSelected(record)} className="w-full p-4 text-left hover:bg-slate-50"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-semibold text-slate-800">{primary}</div><div className="mt-1 truncate text-xs text-slate-400">{secondary}</div></div><ChevronRight className="h-4 w-4 shrink-0 text-slate-300" /></div><div className="mt-3 flex flex-wrap gap-2">{config.columns.slice(2, 5).map((column) => <span key={column.key} className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500">{column.label}: {["amount", "fee", "totalFee", "amountPaid", "estimatedValue", "unitCost"].includes(column.key) ? money(raw[column.key]) : textValue(raw[column.key])}</span>)}</div></button>;
            })}</div>
          </>
        )}
      </section>

      {(creating || selected) && <CollectionDrawer config={config} clients={store.clients} store={store} initial={selected} onClose={() => { setCreating(false); setSelected(null); }} onSaved={closeAndReload} onArchived={closeAndReload} />}
    </>
  );
}

function TodayDesk({ store, websiteRecords }: { store: CentreAdminStore; websiteRecords: FormSubmissionRecord[] }) {
  const today = localDateKey();
  const openAppointments = [...store.appointments].filter((item) => item.date === today && !["Cancelled"].includes(item.status)).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  const todaySessions = [...store.sessions].filter((item) => item.sessionDate === today && item.status !== "Cancelled").sort((a, b) => (a.sessionTime || "").localeCompare(b.sessionTime || ""));
  const dueFollowUps = [...store.followUps].filter((item) => item.dueDate && item.dueDate <= today && !["Completed", "Cancelled"].includes(item.status)).sort((a, b) => `${a.dueDate}${a.dueTime}`.localeCompare(`${b.dueDate}${b.dueTime}`));
  const dueTasks = [...store.tasks].filter((item) => item.dueDate && item.dueDate <= today && !["Completed", "Cancelled"].includes(item.status)).sort((a, b) => `${a.dueDate}${a.dueTime}`.localeCompare(`${b.dueDate}${b.dueTime}`));
  const duePlans = [...store.carePlans].filter((item) => item.status === "Active" && item.nextDueDate && item.nextDueDate <= today && Number(item.totalFee || 0) > Number(item.amountPaid || 0)).sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
  const lowStock = store.inventory.filter((item) => item.status !== "Discontinued" && Number(item.quantity || 0) <= Number(item.minimumStock || 0));
  const newLeads = store.leads.filter((item) => item.stage === "New");
  const websiteNew = websiteRecords.filter((item) => item.formType !== "contact" && item.status === "new").length;
  const websiteFollowUp = websiteRecords.filter((item) => item.formType !== "contact" && item.status === "contacted").length;
  const websiteScheduled = websiteRecords.filter((item) => item.formType !== "contact" && item.status === "scheduled").length;
  const websiteNeedsAction = websiteNew + websiteFollowUp;
  const attention = websiteNeedsAction + dueFollowUps.length + dueTasks.length + duePlans.length + lowStock.length;

  const queueCard = (title: string, count: number, note: string, Icon: typeof Clock3) => <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,.03)] sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-slate-500">{title}</p><div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-900">{count}</div></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#173f45]/[0.07] text-[#173f45]"><Icon className="h-4 w-4" /></div></div><p className="mt-4 text-[11px] text-slate-400">{note}</p></div>;

  return <>
    <div className="relative overflow-hidden rounded-[2rem] bg-[#173f45] p-6 text-white shadow-[0_28px_70px_rgba(23,63,69,.18)] sm:p-8">
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/10" /><div className="absolute right-20 top-20 h-24 w-24 rounded-full border border-white/10" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#e3c08d]"><Sparkles className="h-3.5 w-3.5" /> Daily command centre</div><h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Good morning. Here is what needs attention today.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">A single operating desk for the front office, counsellors and centre administrator — calculated live from your JSON records.</p></div><div className="rounded-2xl border border-white/10 bg-white/[0.08] px-5 py-4"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Attention queue</div><div className="mt-1 text-3xl font-semibold">{attention}</div><div className="mt-1 text-xs text-white/55">due / overdue centre actions</div></div></div>
    </div>

    <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-5">
      {queueCard("Website actions", websiteNeedsAction, `${websiteNew} new • ${websiteFollowUp} follow-up • ${websiteScheduled} booked`, Inbox)}
      {queueCard("Today's schedule", openAppointments.length + todaySessions.length, `${openAppointments.length} appointments • ${todaySessions.length} counselling sessions`, CalendarCheck2)}
      {queueCard("Follow-ups due", dueFollowUps.length, "Client calls and follow-up actions", Clock3)}
      {queueCard("New CRM leads", newLeads.length, "CRM enquiries awaiting first action", UsersRound)}
      {queueCard("Fees due", duePlans.length, "Active plans with due balances", Wallet)}
    </div>

    <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h3 className="text-sm font-bold text-slate-900">Today's schedule</h3><p className="mt-1 text-xs text-slate-400">Appointments and counselling sessions in time order</p></div><CalendarRange className="h-5 w-5 text-[#5d8079]" /></div>{openAppointments.length + todaySessions.length === 0 ? <div className="p-10 text-center text-sm text-slate-400">Nothing is scheduled for today.</div> : <div className="divide-y divide-slate-100">{[...openAppointments.map((item) => ({ id: item.id, time: item.time, name: item.clientName, label: item.purpose || "Appointment", owner: item.counsellor, status: item.status, kind: "Appointment" })), ...todaySessions.map((item) => ({ id: item.id, time: item.sessionTime, name: item.clientName, label: item.sessionType || "Counselling", owner: item.counsellor, status: item.status, kind: "Session" }))].sort((a,b) => (a.time || "").localeCompare(b.time || "")).map((item) => <div key={`${item.kind}-${item.id}`} className="flex items-center gap-4 p-4 sm:px-5"><div className="w-16 shrink-0 text-sm font-bold text-[#173f45]">{item.time || "—"}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-slate-800">{item.name || "Client"}</div><div className="mt-1 truncate text-xs text-slate-400">{item.kind} • {item.label} • {item.owner || "Unassigned"}</div></div><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusPill(item.status)}`}>{item.status || "Scheduled"}</span></div>)}</div>}</section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h3 className="text-sm font-bold text-slate-900">Urgent work queue</h3><p className="mt-1 text-xs text-slate-400">Website pipeline actions plus overdue follow-ups, tasks, fees and stock</p></div><AlertTriangle className="h-5 w-5 text-amber-600" /></div><div className="divide-y divide-slate-100">
        {websiteNew > 0 && <Link href="/admin/new" className="flex items-center justify-between gap-4 bg-amber-50/60 p-4 transition hover:bg-amber-50 sm:px-5"><div><div className="text-sm font-semibold text-slate-800">{websiteNew} new website service {websiteNew === 1 ? "request" : "requests"}</div><p className="mt-1 text-xs text-slate-500">Already in CRM — respond and move each request to its next stage from the enquiry flow.</p></div><ChevronRight className="h-4 w-4 shrink-0 text-amber-700" /></Link>}
        {websiteFollowUp > 0 && <Link href="/admin/follow-up" className="flex items-center justify-between gap-4 bg-sky-50/60 p-4 transition hover:bg-sky-50 sm:px-5"><div><div className="text-sm font-semibold text-slate-800">{websiteFollowUp} website {websiteFollowUp === 1 ? "request needs" : "requests need"} follow-up</div><p className="mt-1 text-xs text-slate-500">Continue the same CRM record; no repeated form or duplicate client entry is required.</p></div><ChevronRight className="h-4 w-4 shrink-0 text-sky-700" /></Link>}
        {dueFollowUps.slice(0,3).map((item) => <div key={item.id} className="p-4 sm:px-5"><div className="flex items-center justify-between gap-3"><div className="truncate text-sm font-semibold text-slate-800">{item.clientName || item.purpose}</div><span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-bold text-amber-700">FOLLOW-UP</span></div><p className="mt-1 text-xs text-slate-400">Due {formatDate(item.dueDate)} • {item.assignedTo || "Unassigned"}</p></div>)}
        {dueTasks.slice(0,3).map((item) => <div key={item.id} className="p-4 sm:px-5"><div className="flex items-center justify-between gap-3"><div className="truncate text-sm font-semibold text-slate-800">{item.title}</div><span className="rounded-full bg-sky-50 px-2 py-1 text-[9px] font-bold text-sky-700">TASK</span></div><p className="mt-1 text-xs text-slate-400">Due {formatDate(item.dueDate)} • {item.assignedTo || "Unassigned"}</p></div>)}
        {duePlans.slice(0,3).map((item) => <div key={item.id} className="p-4 sm:px-5"><div className="flex items-center justify-between gap-3"><div className="truncate text-sm font-semibold text-slate-800">{item.clientName || item.planCode}</div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">FEE DUE</span></div><p className="mt-1 text-xs text-slate-400">{money(Math.max(0, Number(item.totalFee || 0) - Number(item.amountPaid || 0)))} outstanding • due {formatDate(item.nextDueDate)}</p></div>)}
        {lowStock.slice(0,3).map((item) => <div key={item.id} className="p-4 sm:px-5"><div className="flex items-center justify-between gap-3"><div className="truncate text-sm font-semibold text-slate-800">{item.itemName}</div><span className="rounded-full bg-red-50 px-2 py-1 text-[9px] font-bold text-red-700">LOW STOCK</span></div><p className="mt-1 text-xs text-slate-400">{item.quantity} {item.unit || "units"} left • minimum {item.minimumStock}</p></div>)}
        {attention === 0 && <div className="p-10 text-center"><CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500"/><div className="mt-3 text-sm font-semibold text-slate-700">Everything is under control</div><p className="mt-1 text-xs text-slate-400">No overdue centre actions right now.</p></div>}
      </div></section>
    </div>
  </>;
}

function CalendarView({ store }: { store: CentreAdminStore }) {
  const days = Array.from({ length: 7 }, (_, index) => offsetDateKey(index));
  return <>
    <div><div className="inline-flex items-center gap-2 rounded-full border border-[#5d8079]/15 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#5d8079]"><CalendarRange className="h-3.5 w-3.5" /> Seven-day planner</div><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-4xl">Centre calendar</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">A quick combined view of appointments and counselling sessions. Edit the underlying records from their dedicated sections.</p></div>
    <div className="mt-6 grid gap-3 xl:grid-cols-7">{days.map((dateKey, index) => { const appointments = store.appointments.filter((item) => item.date === dateKey && item.status !== "Cancelled"); const sessions = store.sessions.filter((item) => item.sessionDate === dateKey && item.status !== "Cancelled"); const entries = [...appointments.map((item) => ({ id: `a-${item.id}`, time: item.time, name: item.clientName, label: item.purpose || "Appointment", status: item.status })), ...sessions.map((item) => ({ id: `s-${item.id}`, time: item.sessionTime, name: item.clientName, label: item.sessionType || "Session", status: item.status }))].sort((a,b) => (a.time || "").localeCompare(b.time || "")); const date = new Date(`${dateKey}T12:00:00`); return <section key={dateKey} className={`min-h-52 rounded-2xl border bg-white p-3.5 ${index === 0 ? "border-[#5d8079]/40 shadow-[0_12px_30px_rgba(23,63,69,.08)]" : "border-slate-200"}`}><div className="flex items-center justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{index === 0 ? "Today" : new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(date)}</div><div className="mt-1 text-lg font-semibold text-slate-800">{new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(date)}</div></div><div className="grid h-8 min-w-8 place-items-center rounded-lg bg-[#173f45]/[0.07] px-2 text-xs font-bold text-[#173f45]">{entries.length}</div></div><div className="mt-4 space-y-2">{entries.slice(0,5).map((item) => <div key={item.id} className="rounded-xl bg-slate-50 p-2.5"><div className="text-[10px] font-bold text-[#173f45]">{item.time || "—"}</div><div className="mt-1 truncate text-xs font-semibold text-slate-700">{item.name || "Client"}</div><div className="mt-0.5 truncate text-[10px] text-slate-400">{item.label}</div></div>)}{entries.length === 0 && <div className="py-8 text-center text-[11px] text-slate-300">Open day</div>}{entries.length > 5 && <div className="text-center text-[10px] font-semibold text-slate-400">+{entries.length - 5} more</div>}</div></section>; })}</div>
  </>;
}

function FinanceCommand({ store }: { store: CentreAdminStore }) {
  const month = localDateKey().slice(0, 7);
  const monthPayments = store.payments.filter((item) => item.paymentDate?.startsWith(month) && item.paymentStatus !== "Refunded");
  const monthExpenses = store.expenses.filter((item) => item.expenseDate?.startsWith(month));
  const revenue = monthPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expenses = monthExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const outstandingPlans = store.carePlans.filter((item) => !["Cancelled", "Completed"].includes(item.status) && Number(item.totalFee || 0) > Number(item.amountPaid || 0));
  const outstanding = outstandingPlans.reduce((sum, item) => sum + Math.max(0, Number(item.totalFee || 0) - Number(item.amountPaid || 0)), 0);
  const categories = (Object.entries(monthExpenses.reduce<Record<string, number>>((acc, item) => { const key = item.category || "Other"; acc[key] = (acc[key] || 0) + Number(item.amount || 0); return acc; }, {})) as Array<[string, number]>).sort((a,b) => b[1]-a[1]).slice(0,6);
  const maxCategory = Math.max(1, ...categories.map(([,value]) => value));
  return <>
    <div className="relative overflow-hidden rounded-[2rem] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,.05)] ring-1 ring-slate-200/80 sm:p-8"><div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-[#173f45]/[0.05] to-transparent"/><div className="relative"><div className="inline-flex items-center gap-2 rounded-full bg-[#173f45]/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#173f45]"><Wallet className="h-3.5 w-3.5" /> Finance command</div><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-4xl">Know the centre's financial position at a glance.</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Income, expenses and package balances calculated directly from your editable JSON records.</p></div></div>
    <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">{[["Revenue this month", money(revenue), "Recorded receipts", TrendingUp],["Expenses this month", money(expenses), "Operational spending", BadgeIndianRupee],["Net this month", money(revenue-expenses), "Revenue minus expenses", IndianRupee],["Outstanding plans", money(outstanding), `${outstandingPlans.length} active balances`, Wallet]].map(([label,value,note,Icon]) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-slate-500">{String(label)}</p><div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-900">{String(value)}</div></div>{(() => { const C = Icon as typeof Wallet; return <C className="h-5 w-5 text-[#5d8079]"/>; })()}</div><p className="mt-4 text-[11px] text-slate-400">{String(note)}</p></div>)}</div>
    <div className="mt-5 grid gap-5 xl:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="text-sm font-bold text-slate-900">Outstanding care-plan balances</h3><p className="mt-1 text-xs text-slate-400">Largest unpaid package commitments</p><div className="mt-4 space-y-3">{outstandingPlans.sort((a,b) => (Number(b.totalFee)-Number(b.amountPaid))-(Number(a.totalFee)-Number(a.amountPaid))).slice(0,7).map((item) => { const due = Math.max(0, Number(item.totalFee || 0)-Number(item.amountPaid || 0)); const pct = Math.min(100, Number(item.totalFee || 0) > 0 ? (Number(item.amountPaid || 0)/Number(item.totalFee || 1))*100 : 0); return <div key={item.id}><div className="flex items-center justify-between gap-3 text-xs"><div className="truncate font-semibold text-slate-700">{item.clientName || item.planCode}</div><div className="font-bold text-slate-800">{money(due)}</div></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#5d8079]" style={{ width: `${pct}%` }}/></div><div className="mt-1 text-[10px] text-slate-400">{money(item.amountPaid)} paid of {money(item.totalFee)} • due {formatDate(item.nextDueDate)}</div></div>; })}{outstandingPlans.length === 0 && <div className="py-10 text-center text-sm text-slate-400">No outstanding plan balances.</div>}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="text-sm font-bold text-slate-900">Expense mix this month</h3><p className="mt-1 text-xs text-slate-400">Where centre operating money is going</p><div className="mt-5 space-y-4">{categories.map(([category,value]) => <div key={category}><div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-600">{category}</span><span className="font-bold text-slate-800">{money(value)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#173f45]" style={{ width: `${Math.max(4,(value/maxCategory)*100)}%` }}/></div></div>)}{categories.length === 0 && <div className="py-10 text-center text-sm text-slate-400">No expenses recorded this month.</div>}</div></section></div>
  </>;
}

function Overview({ store, websiteRecords }: { store: CentreAdminStore; websiteRecords: FormSubmissionRecord[] }) {
  const today = localDateKey();
  const month = today.slice(0, 7);
  const activeClients = store.clients.filter((item) => !["Completed", "Closed"].includes(item.status)).length;
  const todayAppointments = store.appointments.filter((item) => item.date === today && !["Cancelled", "Completed"].includes(item.status)).length;
  const pendingFollowUps = store.followUps.filter((item) => !["Completed", "Cancelled"].includes(item.status)).length;
  const openLeads = store.leads.filter((item) => !["Converted", "Lost"].includes(item.stage)).length;
  const activePlans = store.carePlans.filter((item) => item.status === "Active").length;
  const outstandingPlans = store.carePlans.filter((item) => item.status === "Active").reduce((sum, item) => sum + Math.max(0, Number(item.totalFee || 0) - Number(item.amountPaid || 0)), 0);
  const revenue = store.payments.filter((item) => item.paymentDate.startsWith(month) && item.paymentStatus !== "Refunded").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expenses = store.expenses.filter((item) => item.expenseDate.startsWith(month)).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const upcoming = [...store.appointments].filter((item) => item.date >= today && !["Cancelled", "Completed"].includes(item.status)).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).slice(0, 6);
  const dueFollowUps = [...store.followUps].filter((item) => item.dueDate <= today && !["Completed", "Cancelled"].includes(item.status)).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 6);
  const websiteCare = websiteRecords.filter((item) => item.formType !== "contact");
  const websiteWaiting = websiteCare.filter((item) => ["new", "contacted"].includes(item.status)).length;
  const websiteScheduled = websiteCare.filter((item) => item.status === "scheduled").length;
  const contactOpen = websiteRecords.filter((item) => item.formType === "contact" && item.status !== "closed").length;

  const cards = [
    { label: "Website actions", value: websiteWaiting, note: "New / contacted service requests", icon: Inbox },
    { label: "Active clients", value: activeClients, note: `${store.clients.length} total client records`, icon: UsersRound },
    { label: "Today's appointments", value: todayAppointments, note: "Open calendar items", icon: CalendarCheck2 },
    { label: "Pending follow-ups", value: pendingFollowUps, note: "Calls and follow-up work", icon: Clock3 },
    { label: "Contact inbox", value: contactOpen, note: "Separate website contact flow", icon: MessageSquare },
    { label: "Open CRM leads", value: openLeads, note: `${store.leads.length} website + offline enquiries total`, icon: TrendingUp },
    { label: "Active care plans", value: activePlans, note: `${money(outstandingPlans)} outstanding`, icon: Package },
    { label: "Revenue this month", value: money(revenue), note: `Expenses ${money(expenses)}`, icon: IndianRupee },
  ];

  return (
    <>
      <div><div className="inline-flex items-center gap-2 rounded-full border border-[#5d8079]/15 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#5d8079]"><HeartHandshake className="h-3.5 w-3.5" /> Chetana centre workspace</div><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-4xl">Run the centre from one calm workspace.</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Client profiles, CRM leads, counselling notes, care plans, communications, calendar, finance, documents, inventory, staff and centre tasks are all maintained in private editable JSON storage.</p></div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">{cards.map((item) => <div key={item.label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,.03)] sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-slate-500">{item.label}</p><div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-3xl">{item.value}</div></div><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#173f45]/[0.07] text-[#173f45]"><item.icon className="h-4 w-4" /></div></div><p className="mt-4 text-[11px] text-slate-400">{item.note}</p></div>)}</div>

      <section className="mt-6 rounded-2xl border border-[#5d8079]/20 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,.035)] sm:p-6"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex items-center gap-2 text-sm font-bold text-slate-900"><Sparkles className="h-4 w-4 text-[#5d8079]" /> Continuous website → centre flow</div><p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">No second form is required at any stage. Every service-form submission starts one CRM record automatically; New, Follow-up, Booked and Closed update that same flow. Booking creates or reuses the client and calendar item, while Contact Form messages stay in their own inbox.</p></div><Link href="/admin" className="inline-flex h-9 w-fit shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50">Open enquiry flow <ChevronRight className="h-4 w-4" /></Link></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Link href="/admin/new" className="rounded-xl bg-amber-50 p-4 transition hover:bg-amber-100/70"><div className="text-[10px] font-bold uppercase tracking-[0.13em] text-amber-700">New</div><div className="mt-1 text-2xl font-semibold text-slate-900">{websiteCare.filter((item) => item.status === "new").length}</div><div className="mt-1 text-[11px] text-slate-500">CRM live • first response</div></Link><Link href="/admin/follow-up" className="rounded-xl bg-sky-50 p-4 transition hover:bg-sky-100/70"><div className="text-[10px] font-bold uppercase tracking-[0.13em] text-sky-700">Follow-up</div><div className="mt-1 text-2xl font-semibold text-slate-900">{websiteCare.filter((item) => item.status === "contacted").length}</div><div className="mt-1 text-[11px] text-slate-500">Same lead • next action</div></Link><Link href="/admin/scheduled" className="rounded-xl bg-emerald-50 p-4 transition hover:bg-emerald-100/70"><div className="text-[10px] font-bold uppercase tracking-[0.13em] text-emerald-700">Booked</div><div className="mt-1 text-2xl font-semibold text-slate-900">{websiteScheduled}</div><div className="mt-1 text-[11px] text-slate-500">Client + calendar linked</div></Link><Link href="/admin/completed" className="rounded-xl bg-[#173f45]/[0.06] p-4 transition hover:bg-[#173f45]/[0.1]"><div className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#173f45]">Closed</div><div className="mt-1 text-2xl font-semibold text-slate-900">{websiteCare.filter((item) => item.status === "closed").length}</div><div className="mt-1 text-[11px] text-slate-500">History retained</div></Link><Link href="/admin/contact-inbox" className="rounded-xl bg-violet-50 p-4 transition hover:bg-violet-100/70"><div className="text-[10px] font-bold uppercase tracking-[0.13em] text-violet-700">Contact inbox</div><div className="mt-1 text-2xl font-semibold text-slate-900">{contactOpen}</div><div className="mt-1 text-[11px] text-slate-500">Separate message workflow</div></Link></div></section>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_36px_rgba(15,23,42,.035)]"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h3 className="text-sm font-bold text-slate-900">Upcoming appointments</h3><p className="mt-1 text-xs text-slate-400">Next scheduled client visits</p></div><CalendarCheck2 className="h-5 w-5 text-[#5d8079]" /></div>{upcoming.length ? <div className="divide-y divide-slate-100">{upcoming.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 p-4 sm:px-5"><div className="min-w-0"><div className="truncate text-sm font-semibold text-slate-800">{item.clientName || "Client"}</div><div className="mt-1 text-xs text-slate-400">{formatDate(item.date)} • {item.time || "Time not set"} • {item.counsellor || "Unassigned"}</div></div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusPill(item.status)}`}>{item.status || "Scheduled"}</span></div>)}</div> : <div className="p-8 text-center text-sm text-slate-400">No upcoming appointments.</div>}</section>

        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_36px_rgba(15,23,42,.035)]"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h3 className="text-sm font-bold text-slate-900">Follow-ups needing attention</h3><p className="mt-1 text-xs text-slate-400">Due and overdue follow-up work</p></div><ListTodo className="h-5 w-5 text-[#5d8079]" /></div>{dueFollowUps.length ? <div className="divide-y divide-slate-100">{dueFollowUps.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 p-4 sm:px-5"><div className="min-w-0"><div className="truncate text-sm font-semibold text-slate-800">{item.clientName || item.purpose || "Follow-up"}</div><div className="mt-1 text-xs text-slate-400">Due {formatDate(item.dueDate)} • {item.followUpType || "Follow-up"} • {item.assignedTo || "Unassigned"}</div></div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusPill(item.priority)}`}>{item.priority || "Normal"}</span></div>)}</div> : <div className="p-8 text-center text-sm text-slate-400">No due follow-ups.</div>}</section>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_36px_rgba(15,23,42,.035)]"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h3 className="text-sm font-bold text-slate-900">Recent centre activity</h3><p className="mt-1 text-xs text-slate-400">Latest JSON-backed record changes</p></div><DatabaseBackup className="h-5 w-5 text-[#5d8079]" /></div>{store.activity.length ? <div className="divide-y divide-slate-100">{[...store.activity].reverse().slice(0, 8).map((item) => <div key={item.id} className="flex items-center gap-3 p-4 sm:px-5"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#173f45]/[0.07] text-[#173f45]"><CheckCircle2 className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-slate-700">{item.label}</div><div className="mt-0.5 text-[11px] capitalize text-slate-400">{item.action} • {item.collection} • {formatDate(item.at, true)}</div></div></div>)}</div> : <div className="p-8 text-center text-sm text-slate-400">Activity will appear as centre records are created and edited.</div>}</section>
    </>
  );
}

function Reports({ store }: { store: CentreAdminStore }) {
  const currentMonth = localDateKey().slice(0, 7);
  const revenue = store.payments.filter((item) => item.paymentDate.startsWith(currentMonth) && item.paymentStatus !== "Refunded").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expenses = store.expenses.filter((item) => item.expenseDate.startsWith(currentMonth)).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const completedSessions = store.sessions.filter((item) => item.status === "Completed").length;
  const completedAppointments = store.appointments.filter((item) => item.status === "Completed").length;
  const pendingPayments = store.payments.filter((item) => ["Pending", "Partial"].includes(item.paymentStatus)).reduce((sum, item) => sum + Math.max(0, Number(item.amount || 0) - Number(item.discount || 0)), 0);
  const convertedLeads = store.leads.filter((item) => item.stage === "Converted").length;
  const conversionRate = store.leads.length ? Math.round((convertedLeads / store.leads.length) * 100) : 0;
  const planOutstanding = store.carePlans.filter((item) => item.status === "Active").reduce((sum, item) => sum + Math.max(0, Number(item.totalFee || 0) - Number(item.amountPaid || 0)), 0);
  const lowStock = store.inventory.filter((item) => item.status !== "Discontinued" && Number(item.quantity || 0) <= Number(item.minimumStock || 0)).length;
  const values = [
    ["Total clients", store.clients.length, "All JSON client profiles"],
    ["Completed sessions", completedSessions, `${store.sessions.length} counselling records total`],
    ["Completed appointments", completedAppointments, `${store.appointments.length} appointments total`],
    ["Pending follow-ups", store.followUps.filter((item) => !["Completed", "Cancelled"].includes(item.status)).length, "Needs centre attention"],
    ["Month revenue", money(revenue), "Recorded payments this month"],
    ["Month expenses", money(expenses), "Recorded expenses this month"],
    ["Month net", money(revenue - expenses), "Revenue minus expenses"],
    ["Pending / partial fees", money(pendingPayments), "Based on payment records"],
    ["CRM lead conversion", `${conversionRate}%`, `${convertedLeads} of ${store.leads.length} CRM leads converted`],
    ["Active care plans", store.carePlans.filter((item) => item.status === "Active").length, `${money(planOutstanding)} outstanding`],
    ["Client communications", store.communications.length, "Calls, WhatsApp, email and front desk interactions"],
    ["Low-stock items", lowStock, "Inventory at or below minimum"],
  ];
  return <><div><div className="inline-flex items-center gap-2 rounded-full border border-[#5d8079]/15 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#5d8079]"><BadgeIndianRupee className="h-3.5 w-3.5" /> Centre reports</div><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-4xl">Operational snapshot</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">A live summary calculated directly from your centre JSON records. No separate analytics database is used.</p></div><div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{values.map(([label, value, note]) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold text-slate-500">{label}</p><div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-900">{value}</div><p className="mt-4 text-[11px] text-slate-400">{note}</p></div>)}</div></>;
}

function DataBackup({ store }: { store: CentreAdminStore }) {
  const download = () => {
    const blob = new Blob([JSON.stringify({ ...store, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `chetana-centre-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const count = store.clients.length + store.leads.length + store.sessions.length + store.appointments.length + store.followUps.length + store.carePlans.length + store.communications.length + store.documents.length + store.services.length + store.payments.length + store.expenses.length + store.inventory.length + store.staff.length + store.tasks.length;
  return <><div><div className="inline-flex items-center gap-2 rounded-full border border-[#5d8079]/15 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#5d8079]"><DatabaseBackup className="h-3.5 w-3.5" /> JSON data control</div><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-4xl">Data & backup</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">All centre records are editable through the admin UI and saved to <strong>centre-admin.json</strong> with an automatic backup copy after successful writes.</p></div><div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_.9fr]"><section className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-start justify-between gap-4"><div><h3 className="text-base font-bold text-slate-900">Full centre JSON backup</h3><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Download a complete portable copy containing CRM leads, clients, counselling sessions, appointments, follow-ups, care plans, communications, document references, services, payments, expenses, inventory, staff, tasks, archives and the activity history.</p></div><DatabaseBackup className="h-6 w-6 text-[#5d8079]" /></div><button onClick={download} className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#173f45] px-4 text-xs font-bold text-white"><Download className="h-4 w-4" /> Download full JSON</button></section><section className="rounded-2xl border border-slate-200 bg-[#173f45] p-6 text-white"><div className="text-xs font-bold uppercase tracking-[0.16em] text-[#e3c08d]">Storage health</div><div className="mt-4 text-4xl font-semibold tracking-[-0.04em]">{count}</div><div className="mt-1 text-sm text-white/60">active centre records</div><div className="mt-6 space-y-2 text-xs text-white/60"><p>Primary: data/centre-admin.json</p><p>Backup: data/centre-admin.backup.json</p><p>Archived records retained: {store.archives.length}</p><p>Last updated: {store.updatedAt ? formatDate(store.updatedAt, true) : "No centre updates yet"}</p></div></section></div></>;
}

function ArchiveView({ store, reload }: { store: CentreAdminStore; reload: () => Promise<void> }) {
  const [restoring, setRestoring] = useState("");
  const restore = async (archiveId: string) => {
    setRestoring(archiveId);
    try {
      const response = await fetch(`/api/centre-admin/archive/${archiveId}`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to restore record.");
      await reload();
    } finally {
      setRestoring("");
    }
  };
  return <><div><div className="inline-flex items-center gap-2 rounded-full border border-[#5d8079]/15 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#5d8079]"><DatabaseBackup className="h-3.5 w-3.5" /> No-loss archive</div><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-4xl">Archived centre records</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Archiving removes a record from active work lists but keeps its complete JSON data here. Any archived record can be restored.</p></div><section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">{store.archives.length === 0 ? <div className="grid min-h-64 place-items-center p-8 text-center"><div><DatabaseBackup className="mx-auto h-7 w-7 text-slate-300"/><h3 className="mt-3 font-semibold text-slate-700">Archive is empty</h3><p className="mt-1 text-sm text-slate-400">Nothing has been archived from centre records.</p></div></div> : <div className="divide-y divide-slate-100">{[...store.archives].reverse().map((item) => { const record = item.record as unknown as Record<string, unknown>; const label = textValue(record.fullName || record.clientName || record.documentName || record.itemName || record.name || record.title || record.description || record.leadCode || record.planCode || record.receiptNo || record.staffCode || record.id); return <div key={item.archiveId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><div className="text-sm font-semibold text-slate-800">{label}</div><div className="mt-1 text-xs capitalize text-slate-400">{item.collection} • archived {formatDate(item.archivedAt, true)}</div></div><button onClick={() => restore(item.archiveId)} disabled={restoring === item.archiveId} className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">{restoring === item.archiveId ? "Restoring…" : "Restore record"}</button></div>; })}</div>}</section></>;
}

export default function CentreManagement({ pathname, onUnauthorized, websiteRecords }: { pathname: string; onUnauthorized: () => void; websiteRecords: FormSubmissionRecord[] }) {
  const [store, setStore] = useState<CentreAdminStore>(EMPTY_STORE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/centre-admin", { cache: "no-store" });
      if (response.status === 401) { onUnauthorized(); return; }
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load centre records.");
      setStore({ ...EMPTY_STORE, ...body });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load centre records.");
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => { load(); }, [load]);

  if (loading && !store.updatedAt && store.activity.length === 0) return <div className="grid min-h-[60vh] place-items-center"><div className="flex items-center gap-3 text-sm font-semibold text-slate-500"><RefreshCw className="h-4 w-4 animate-spin" /> Loading centre records…</div></div>;
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}<button onClick={load} className="ml-3 font-bold underline">Try again</button></div>;

  const key = pathname.split("/").pop() || "centre";
  return <div className="px-4 py-6 sm:px-7 lg:px-9 lg:py-8">{pathname === "/admin/centre" ? <Overview store={store} websiteRecords={websiteRecords} /> : pathname === "/admin/today" ? <TodayDesk store={store} websiteRecords={websiteRecords} /> : pathname === "/admin/calendar" ? <CalendarView store={store} /> : pathname === "/admin/finance" ? <FinanceCommand store={store} /> : pathname === "/admin/reports" ? <Reports store={store} /> : pathname === "/admin/archive" ? <ArchiveView store={store} reload={load} /> : pathname === "/admin/data" ? <DataBackup store={store} /> : configs[key] ? <CollectionView config={configs[key]} store={store} reload={load} /> : <Overview store={store} websiteRecords={websiteRecords} />}</div>;
}
