"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { studentCounsellingSchema } from "@/schemas/studentCounsellingSchema";
import type { StudentCounsellingFormValues } from "@/schemas/studentCounsellingSchema";
import { cn } from "@/lib/utils";
import { submitWebsiteEnquiry } from "@/lib/reliable-form-submit";
import { useFormSuccessScroll } from "@/hooks/useFormSuccessScroll";
import { formSubjects, successMessages } from "@/config/site";
import { useState } from "react";
import { CheckCircle, User, Phone, Mail, GraduationCap, MessageSquare } from "lucide-react";

interface StudentFormProps {
  onSuccess?: () => void;
}

export const StudentForm = ({ onSuccess }: StudentFormProps) => {
  const [submitStatus, setSubmitStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [submittedName, setSubmittedName] = useState("");
  useFormSuccessScroll(submitStatus, "student-form-success");
  const methods = useForm<StudentCounsellingFormValues>({
    resolver: zodResolver(studentCounsellingSchema),
  });

  const onSubmit = async (data: StudentCounsellingFormValues) => {
    setSubmitStatus("sending");
    try {
      await submitWebsiteEnquiry({
        storage: {
          formType: "student",
          formName: "Student Counselling Form",
          subject: formSubjects.student,
          data,
        },
        email: {
          _subject: formSubjects.student,
          "Form Name": "Student Counselling Form",
          "Student Name": data.studentName,
          Age: data.age || "",
          "Current Class": data.currentClass,
          "Parent / Guardian Name": data.parentName,
          "Mobile Number": data.phone,
          "Email Address": data.email || "",
          "Primary Concern": data.primaryConcern,
          Message: data.message,
        }
      });

      setSubmittedName(data.studentName);
      setSubmitStatus("success");
      onSuccess?.();
    } catch {
      setSubmitStatus("error");
    }
  };

  if (submitStatus === "success") {
    return (
      <div id="student-form-success" role="status" aria-live="polite" tabIndex={-1} className="text-center py-12 outline-none">
        <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
        <h3 className="text-xl font-bold text-primary mb-2">Thank you, {submittedName}!</h3>
        <p className="font-medium text-foreground mb-3">Your student counselling enquiry was submitted successfully.</p>
        <p className="text-muted">{successMessages.student}</p>
      </div>
    );
  }

  return (
    <form onSubmit={methods.handleSubmit(onSubmit)} className="form-shell space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-muted mb-2">Student Name *</label>
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            {...methods.register("studentName")}
            type="text"
            className={cn("w-full rounded-xl pl-10 pr-4 py-3 bg-card border border-border/30", "focus:outline-none focus:ring-2 focus:ring-primary")}
            placeholder="Enter student name"
          />
          {methods.formState.errors.studentName && <p className="text-xs text-red-500 mt-1">{methods.formState.errors.studentName.message}</p>}
        </div>

        <div>
          <label className="block text-sm text-muted mb-2">Age</label>
          <input
            {...methods.register("age")}
            type="number"
            className={cn("w-full rounded-xl px-4 py-3 bg-card border border-border/30", "focus:outline-none focus:ring-2 focus:ring-primary")}
            placeholder="15"
            min={5}
            max={100}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm text-muted mb-2">Current Class *</label>
          <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            {...methods.register("currentClass")}
            type="text"
            className={cn("w-full rounded-xl pl-10 pr-4 py-3 bg-card border border-border/30", "focus:outline-none focus:ring-2 focus:ring-primary")}
            placeholder="e.g. 10th, 12th, B.Com, etc."
          />
          {methods.formState.errors.currentClass && <p className="text-xs text-red-500 mt-1">{methods.formState.errors.currentClass.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm text-muted mb-2">Parent / Guardian Name *</label>
          <input
            {...methods.register("parentName")}
            type="text"
            className={cn("w-full rounded-xl px-4 py-3 bg-card border border-border/30", "focus:outline-none focus:ring-2 focus:ring-primary")}
            placeholder="Parent/guardian name"
          />
          {methods.formState.errors.parentName && <p className="text-xs text-red-500 mt-1">{methods.formState.errors.parentName.message}</p>}
        </div>

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

        <div className="sm:col-span-2">
          <label className="block text-sm text-muted mb-2">Primary Concern *</label>
          <select
            {...methods.register("primaryConcern")}
            className={cn("w-full rounded-xl px-4 py-3 bg-card border border-border/30", "focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-10")}
          >
            <option value="">Select primary concern</option>
            <option value="academic-stress">Academic Stress</option>
            <option value="concentration">Concentration</option>
            <option value="exam-fear">Exam Fear</option>
            <option value="motivation">Motivation</option>
            <option value="confidence">Confidence</option>
            <option value="career-confusion">Career Confusion</option>
            <option value="peer-pressure">Peer Pressure</option>
            <option value="behavioural-concern">Behavioural Concern</option>
            <option value="communication">Communication</option>
            <option value="other">Other</option>
          </select>
          {methods.formState.errors.primaryConcern && <p className="text-xs text-red-500 mt-1">{methods.formState.errors.primaryConcern.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm text-muted mb-2">Message *</label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-4 w-4 h-4 text-muted" />
            <textarea
              {...methods.register("message")}
              rows={4}
              className={cn("w-full rounded-xl pl-10 pr-4 py-3 bg-card border border-border/30 resize-y", "focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]")}
              placeholder="How can we help?"
            />
          </div>
          {methods.formState.errors.message && <p className="text-xs text-red-500 mt-1">{methods.formState.errors.message.message}</p>}
        </div>
      </div>

      <p className="text-xs text-muted/80">Your information will be used only to respond to your counselling enquiry and will be treated respectfully and confidentially.</p>

      <button
        type="submit"
        disabled={methods.formState.isSubmitting}
        className={cn("w-full rounded-full px-8 py-4 text-sm font-medium text-white", "bg-primary hover:bg-primary/90 disabled:opacity-60", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary")}
      >
        {methods.formState.isSubmitting ? "Sending..." : "Request Student Counselling"}
      </button>
    </form>
  );
};
