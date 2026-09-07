"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentSchema } from "@/schemas/appointmentSchema";
import type { AppointmentFormValues } from "@/schemas/appointmentSchema";
import { cn, getTodayDate, getWhatsAppLink } from "@/lib/utils";
import { submitWebsiteEnquiry } from "@/lib/reliable-form-submit";
import { useFormSuccessScroll } from "@/hooks/useFormSuccessScroll";
import { siteConfig, formSubjects, successMessages, errorMessages } from "@/config/site";
import { useState } from "react";
import { CheckCircle, XCircle, Calendar, Phone, Mail, User, MessageSquare } from "lucide-react";

interface AppointmentFormProps {
  onSuccess?: (data: AppointmentFormValues) => void;
  initialService?: AppointmentFormValues["counsellingFor"];
}

export const AppointmentForm = ({ onSuccess, initialService = "individual-counselling" }: AppointmentFormProps) => {
  const [submitStatus, setSubmitStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [submittedName, setSubmittedName] = useState("");
  useFormSuccessScroll(submitStatus, "appointment-form-success");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      age: undefined,
      gender: undefined,
      counsellingFor: initialService,
      preferredLanguage: "english",
      preferredSessionType: "in-person",
      preferredDate: "",
      preferredTime: "",
      cityLocation: "",
      briefMessage: "",
      consent: false,
    },
  });

  const onSubmit = async (data: AppointmentFormValues) => {
    setSubmitStatus("sending");
    try {
      await submitWebsiteEnquiry({
        storage: {
          formType: "appointment",
          formName: "Appointment Form",
          subject: formSubjects.appointment,
          data,
        },
        email: {
          _subject: formSubjects.appointment,
          "Form Name": "Appointment Form",
          "Full Name": data.fullName,
          "Phone Number": data.phone,
          "Email Address": data.email || "",
          Age: data.age?.toString() || "",
          Gender: data.gender || "",
          "I am a": data.counsellingFor,
          "Counselling For": data.counsellingFor,
          "Preferred Language": data.preferredLanguage,
          "Preferred Session Type": data.preferredSessionType,
          "Preferred Date": data.preferredDate || "",
          "Preferred Time": data.preferredTime || "",
          "City / Location": data.cityLocation || "",
          "Brief Message": data.briefMessage,
        }
      });

      setSubmittedName(data.fullName);
      setSubmitStatus("success");
      onSuccess?.(data);
    } catch {
      setSubmitStatus("error");
    }
  };

  if (submitStatus === "success") {
    return (
      <div id="appointment-form-success" role="status" aria-live="polite" tabIndex={-1} className="text-center py-12 outline-none">
        <div className="w-16 h-16 rounded-full bg-success/10 mx-auto mb-4 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h3 className="text-xl font-bold text-primary mb-2">Thank you, {submittedName}!</h3>
        <p className="font-medium text-foreground mb-3">Your appointment request was submitted successfully.</p>
        <p className="text-muted mb-2">
          {successMessages.appointment}
        </p>
        <p className="text-sm text-muted">
          You can also contact us directly on{" "}
          <a href={`tel:${siteConfig.phoneRaw}`} className="text-primary font-medium">
            {siteConfig.phone}
          </a>{" "}
          or{" "}
          <a
            href={getWhatsAppLink(siteConfig.whatsapp, siteConfig.whatsappMessages.general)}
            className="text-primary font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
          .
        </p>
      </div>
    );
  }

  if (submitStatus === "error") {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-primary mb-3">
          {errorMessages.submit}
        </h3>
        <p className="text-muted mb-6">
          Please try again or contact us directly.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            type="button"
            onClick={() => setSubmitStatus("idle")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium",
              "border border-primary/20 bg-white text-primary hover:bg-primary/5"
            )}
          >
            Try Again
          </button>
          <a
            href={`tel:${siteConfig.phoneRaw}`}
            className={cn(
              "flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium",
              "bg-primary text-white hover:bg-primary/90"
            )}
          >
            <Phone className="w-4 h-4" />
            Call Now
          </a>
          <a
            href={getWhatsAppLink(siteConfig.whatsapp, siteConfig.whatsappMessages.general)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium",
              "bg-secondary text-white hover:bg-secondary/90"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-shell space-y-8">
      {/* Personal Information */}
      <div>
        <h3 className="text-sm font-medium text-secondary uppercase tracking-wider mb-4">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fullName" className="block text-sm text-muted mb-2">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                id="fullName"
                {...register("fullName")}
                type="text"
                className={cn(
                  "w-full rounded-xl pl-10 pr-4 py-3 bg-card border border-border/30 text-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                  "transition-colors placeholder:text-muted/40"
                )}
                placeholder="Enter your full name"
              />
            </div>
            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm text-muted mb-2">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                id="phone"
                {...register("phone")}
                type="tel"
                className={cn(
                  "w-full rounded-xl pl-10 pr-4 py-3 bg-card border border-border/30 text-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                  "transition-colors placeholder:text-muted/40"
                )}
                placeholder={siteConfig.phone}
              />
            </div>
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-muted mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                id="email"
                {...register("email")}
                type="email"
                className={cn(
                  "w-full rounded-xl pl-10 pr-4 py-3 bg-card border border-border/30 text-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                  "transition-colors placeholder:text-muted/40"
                )}
                placeholder="name@example.com"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="age" className="block text-sm text-muted mb-2">
              Age
            </label>
            <input
              id="age"
              {...register("age")}
              type="number"
              className={cn(
                "w-full rounded-xl px-4 py-3 bg-card border border-border/30 text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "transition-colors placeholder:text-muted/40"
              )}
              placeholder="25"
              min={5}
              max={100}
            />
            {errors.age && <p className="mt-1 text-xs text-red-500">{errors.age.message}</p>}
          </div>
        </div>
      </div>

      {/* Counselling Details */}
      <div>
        <h3 className="text-sm font-medium text-secondary uppercase tracking-wider mb-4">
          Session Preferences
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="gender" className="block text-sm text-muted mb-2">Gender</label>
            <select
              id="gender"
              {...register("gender")}
              className={cn(
                "w-full rounded-xl px-4 py-3 bg-card border border-border/30 text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "appearance-none pr-10"
              )}
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>

          <div>
            <label htmlFor="counsellingFor" className="block text-sm text-muted mb-2">
              I am a *
            </label>
            <select
              id="counsellingFor"
              {...register("counsellingFor")}
              className={cn(
                "w-full rounded-xl px-4 py-3 bg-card border border-border/30 text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "appearance-none pr-10"
              )}
            >
              <option value="individual-counselling">Individual Counselling</option>
              <option value="student-counselling">Student Counselling</option>
              <option value="career-counselling">Career Counselling</option>
              <option value="family-counselling">Family Counselling</option>
              <option value="parent-guidance">Parent Guidance</option>
              <option value="child-adolescent-guidance">Child & Adolescent Guidance</option>
              <option value="stress-emotional-wellbeing">Stress & Emotional Wellbeing</option>
              <option value="personal-development">Personal Development</option>
            </select>
            {errors.counsellingFor && <p className="mt-1 text-xs text-red-500">Please select a counselling service.</p>}
          </div>

          <div>
            <label htmlFor="preferredLanguage" className="block text-sm text-muted mb-2">
              Preferred Language *
            </label>
            <select
              id="preferredLanguage"
              {...register("preferredLanguage")}
              className={cn(
                "w-full rounded-xl px-4 py-3 bg-card border border-border/30 text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "appearance-none pr-10"
              )}
            >
              <option value="">Select language</option>
              {siteConfig.languages.map((lang) => (
                <option key={lang} value={lang.toLowerCase()}>{lang}</option>
              ))}
            </select>
            {errors.preferredLanguage && <p className="mt-1 text-xs text-red-500">Please select your preferred language.</p>}
          </div>

          <div>
            <label htmlFor="preferredSessionType" className="block text-sm text-muted mb-2">
              Session Type *
            </label>
            <select
              id="preferredSessionType"
              {...register("preferredSessionType")}
              className={cn(
                "w-full rounded-xl px-4 py-3 bg-card border border-border/30 text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "appearance-none pr-10"
              )}
            >
              <option value="">Select session type</option>
              <option value="in-person">In-Person Counselling</option>
              <option value="phone">Phone Consultation</option>
              <option value="online">Online Counselling</option>
            </select>
            {errors.preferredSessionType && <p className="mt-1 text-xs text-red-500">{errors.preferredSessionType.message}</p>}
          </div>
        </div>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="preferredDate" className="block text-sm text-muted mb-2">
            Preferred Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="preferredDate"
              {...register("preferredDate")}
              type="date"
              className={cn(
                "w-full rounded-xl pl-10 pr-4 py-3 bg-card border border-border/30 text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "transition-colors"
              )}
              min={getTodayDate()}
            />
          </div>
          {errors.preferredDate && <p className="mt-1 text-xs text-red-500">{errors.preferredDate.message}</p>}
        </div>
        <div>
          <label htmlFor="preferredTime" className="block text-sm text-muted mb-2">
            Preferred Time
          </label>
          <input
            id="preferredTime"
            {...register("preferredTime")}
            type="time"
            className={cn(
              "w-full rounded-xl px-4 py-3 bg-card border border-border/30 text-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
              "transition-colors"
            )}
          />
        </div>
      </div>

      {/* City/Location */}
      <div>
        <label htmlFor="cityLocation" className="block text-sm text-muted mb-2">
          City / Location
        </label>
        <input
          id="cityLocation"
          {...register("cityLocation")}
          type="text"
          className={cn(
            "w-full rounded-xl px-4 py-3 bg-card border border-border/30 text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "transition-colors placeholder:text-muted/40"
          )}
          placeholder="Your city"
        />
      </div>

      {/* Brief Message */}
      <div>
        <label htmlFor="briefMessage" className="block text-sm text-muted mb-2">
          Briefly Tell Us How We Can Help *
        </label>
        <div className="relative">
          <MessageSquare className="absolute left-3 top-4 w-4 h-4 text-muted" />
          <textarea
            id="briefMessage"
            {...register("briefMessage")}
            rows={4}
            className={cn(
              "w-full rounded-xl pl-10 pr-4 py-3 bg-card border border-border/30 text-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
              "resize-y min-h-[120px] transition-colors placeholder:text-muted/40"
            )}
            placeholder="Describe how we can help you..."
          />
        </div>
        {errors.briefMessage && <p className="mt-1 text-xs text-red-500">{errors.briefMessage.message}</p>}
      </div>

      {/* Consent */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          {...register("consent")}
          className={cn(
            "mt-1 w-4 h-4 rounded border-primary/30 text-primary",
            "focus:outline-none focus:ring-2 focus:ring-primary"
          )}
        />
        <span className="text-sm text-foreground/80">
          I agree to be contacted by Chetana Psychological Counselling Centre regarding my enquiry.
        </span>
      </div>
      {errors.consent && <p className="mt-1 text-xs text-red-500">{errors.consent.message}</p>}

      {/* Privacy Note */}
      <p className="text-xs text-muted/80">
        Your information will be used only to respond to your counselling enquiry and will be treated respectfully and confidentially.
      </p>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "w-full rounded-full px-8 py-4 text-sm font-medium text-white transition-colors",
            "bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          )}
        >
          <span className="flex items-center justify-center gap-2">
            {isSubmitting ? (
              <>
                <span>Sending</span>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.224V12a6 6 0 006 6h1.832l-.905 2.782z"></path>
                </svg>
              </>
            ) : (
              <>Book Counselling Session</>
            )}
          </span>
        </button>
      </div>
    </form>
  );
};
