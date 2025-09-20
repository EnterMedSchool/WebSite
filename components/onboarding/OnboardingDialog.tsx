"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import type { DashboardContext, DashboardExamTrack, DashboardOnboarding } from "@/lib/dashboard/context";
import { ONBOARDING_VERSION } from "@/lib/onboarding/constants";

const EXAM_OPTIONS: Array<{ id: string; label: string }> = [
  { id: "imat", label: "IMAT (Italy)" },
  { id: "other", label: "Other international admission exam" },
];

const YEARS = Array.from({ length: 7 }, (_, index) => index + 1);

const PERSONA_OPTIONS: Array<{ id: Persona; title: string; description: string; accent: string; emoji: string }> = [
  { id: "premed", title: "Premed student", description: "Preparing for medical admission exams.", accent: "from-pink-500 via-fuchsia-500 to-indigo-500", emoji: "📚" },
  { id: "medical", title: "Medical student", description: "Already studying in medical school.", accent: "from-emerald-500 via-teal-500 to-sky-500", emoji: "🩺" },
  { id: "resident", title: "Resident", description: "Training in residency programs.", accent: "from-orange-500 via-amber-500 to-rose-500", emoji: "⚕️" },
  { id: "doctor", title: "Doctor", description: "Already practicing medicine.", accent: "from-slate-500 via-gray-500 to-indigo-500", emoji: "🌟" },
];

type Persona = "premed" | "medical" | "resident" | "doctor";
type StepId = "persona" | "premedExam" | "medicalDetails" | "summary";

type Option = { id: number; name: string; slug?: string };

type OnboardingDialogProps = {
  context: DashboardContext;
  status: DashboardOnboarding;
  forced: boolean;
  onClose: () => void;
  onCompleted: () => void;
};

export default function OnboardingDialog({ context, status, forced, onClose, onCompleted }: OnboardingDialogProps) {
  const initialPersona = useMemo<Persona | null>(() => {
    const userPersona = parsePersona(status.userType);
    if (userPersona) return userPersona;
    switch (context.stage) {
      case "admissions":
      case "multi":
        return "premed";
      case "medical":
        return "medical";
      case "resident":
        return "resident";
      default:
        return null;
    }
  }, [context.stage, status.userType]);

  const [persona, setPersona] = useState<Persona | null>(initialPersona);
  const [currentStep, setCurrentStep] = useState<StepId>("persona");
  const [examId, setExamId] = useState<string>(() => resolveInitialExam(context.examTracks));

  const [universities, setUniversities] = useState<Option[]>([]);
  const [schools, setSchools] = useState<Option[]>([]);
  const [courses, setCourses] = useState<Option[]>([]);
  const [medicalLoading, setMedicalLoading] = useState(false);
  const [medicalError, setMedicalError] = useState<string | null>(null);

  const [medicalSelection, setMedicalSelection] = useState({
    universityId: null as number | null,
    schoolId: null as number | null,
    courseId: null as number | null,
    studyYear: 1,
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setPersona(initialPersona);
  }, [initialPersona]);

  useEffect(() => {
    const order = buildFlow(persona);
    if (!order.includes(currentStep)) {
      setCurrentStep(order[0]);
    }
  }, [persona, currentStep]);

  const stepOrder = useMemo(() => buildFlow(persona), [persona]);
  const currentIndex = stepOrder.indexOf(currentStep);
  const isFirstStep = currentIndex <= 0;
  const isLastStep = currentIndex === stepOrder.length - 1;

  const canContinue = useMemo(() => {
    switch (currentStep) {
      case "persona":
        return persona !== null;
      case "premedExam":
        return !!examId;
      case "medicalDetails":
        return Boolean(medicalSelection.universityId && medicalSelection.schoolId && medicalSelection.courseId && medicalSelection.studyYear);
      case "summary":
      default:
        return true;
    }
  }, [currentStep, persona, examId, medicalSelection]);

  const handleNext = () => {
    if (!canContinue) return;
    if (isLastStep) return;
    setCurrentStep(stepOrder[currentIndex + 1]);
  };

  const handleBack = () => {
    if (isFirstStep) return;
    setCurrentStep(stepOrder[currentIndex - 1]);
  };

  const summaryItems = useMemo(() => buildSummary(persona, examId, medicalSelection, universities, schools, courses), [persona, examId, medicalSelection, universities, schools, courses]);

  const finishDisabled = submitting || !persona || (persona === "premed" && !examId) || (persona === "medical" && !summaryItems.validMedical);

  const loadUniversities = useCallback(async () => {
    setMedicalError(null);
    setMedicalLoading(true);
    try {
      const response = await fetch("/api/onboarding/medical", { credentials: "include" });
      if (!response.ok) throw new Error("Unable to load universities");
      const data = await response.json();
      setUniversities(Array.isArray(data?.universities) ? data.universities : []);
    } catch (error: any) {
      setMedicalError(String(error?.message || error));
    } finally {
      setMedicalLoading(false);
    }
  }, []);

  const loadSchools = useCallback(async (universityId: number) => {
    setMedicalError(null);
    setMedicalLoading(true);
    try {
      const response = await fetch(`/api/onboarding/medical?universityId=${universityId}`, { credentials: "include" });
      if (!response.ok) throw new Error("Unable to load schools");
      const data = await response.json();
      setSchools(Array.isArray(data?.schools) ? data.schools : []);
      setCourses(Array.isArray(data?.courses) ? data.courses : []);
    } catch (error: any) {
      setMedicalError(String(error?.message || error));
    } finally {
      setMedicalLoading(false);
    }
  }, []);

  const loadCourses = useCallback(async (universityId: number | null, schoolId: number) => {
    setMedicalError(null);
    setMedicalLoading(true);
    try {
      const qp = new URLSearchParams();
      if (universityId) qp.set("universityId", String(universityId));
      qp.set("schoolId", String(schoolId));
      const response = await fetch(`/api/onboarding/medical?${qp.toString()}`, { credentials: "include" });
      if (!response.ok) throw new Error("Unable to load courses");
      const data = await response.json();
      setCourses(Array.isArray(data?.courses) ? data.courses : []);
    } catch (error: any) {
      setMedicalError(String(error?.message || error));
    } finally {
      setMedicalLoading(false);
    }
  }, []);


  useEffect(() => {
    if (currentStep === "medicalDetails" && persona === "medical" && universities.length === 0) {
      void loadUniversities();
    }
  }, [currentStep, persona, universities.length, loadUniversities]);

  const handleUniversityChange = async (value: string) => {
    const id = Number(value) || null;
    setMedicalSelection({ universityId: id, schoolId: null, courseId: null, studyYear: 1 });
    setSchools([]);
    setCourses([]);
    if (id) await loadSchools(id);
  };

  const handleSchoolChange = async (value: string) => {
    const id = Number(value) || null;
    setMedicalSelection((prev) => ({ ...prev, schoolId: id, courseId: null }));
    setCourses([]);
    if (id) await loadCourses(medicalSelection.universityId, id);
  };

  const handleCourseChange = (value: string) => {
    const id = Number(value) || null;
    setMedicalSelection((prev) => ({ ...prev, courseId: id }));
  };

  const handleStudyYearChange = (value: string) => {
    const year = Number(value) || 1;
    setMedicalSelection((prev) => ({ ...prev, studyYear: year }));
  };

  const handleComplete = async () => {
    if (finishDisabled) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: Record<string, unknown> = {
        userType: persona,
        onboardingVersion: ONBOARDING_VERSION,
      };

      if (persona === "premed") {
        payload.premed = { examId };
      } else if (persona === "medical") {
        payload.medical = {
          universityId: medicalSelection.universityId,
          schoolId: medicalSelection.schoolId,
          courseId: medicalSelection.courseId,
          studyYear: medicalSelection.studyYear,
        };
      }

      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.message || error?.error || "Unable to save onboarding");
      }

      onCompleted();
      window.location.reload();
    } catch (error: any) {
      setSubmitError(String(error?.message || error));
      setSubmitting(false);
    }
  };

  const allowClose = !forced;

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-slate-950/80 backdrop-blur">
      <div className="relative h-full w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/20 bg-gradient-to-br from-white/10 via-white/15 to-white/5 shadow-[0_50px_140px_rgba(24,24,95,0.55)] backdrop-blur-xl md:h-auto">
        {allowClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-white/70 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-white"
            aria-label="Close onboarding"
          >
            Skip for now
          </button>
        )}

        <div className="grid h-full gap-0 md:grid-cols-[1.1fr,1fr]">
          <div className="relative flex flex-col justify-between border-r border-white/10 bg-white/10 p-8">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/80">Welcome to EnterMedSchool</p>
              <h1 className="text-3xl font-semibold text-white md:text-4xl">Lets personalize your experience</h1>
              <p className="text-sm text-white/80">This quick setup helps us tailor timelines, cohorts, and resources just for you. It takes less than a minute.</p>
            </div>
            <Illustration step={currentStep} persona={persona} />
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Onboarding v{ONBOARDING_VERSION}</p>
          </div>

          <div className="flex flex-col gap-6 p-6 md:p-8">
            <StepProgress stepOrder={stepOrder} currentStep={currentStep} />
            {currentStep === "persona" && (
              <PersonaStep persona={persona} onSelect={setPersona} />
            )}
            {currentStep === "premedExam" && (
              <PremedExamStep examId={examId} onSelect={setExamId} />
            )}
            {currentStep === "medicalDetails" && (
              <MedicalStep
                universities={universities}
                schools={schools}
                courses={courses}
                selection={medicalSelection}
                loading={medicalLoading}
                error={medicalError}
                onUniversityChange={handleUniversityChange}
                onSchoolChange={handleSchoolChange}
                onCourseChange={handleCourseChange}
                onYearChange={handleStudyYearChange}
              />
            )}
            {currentStep === "summary" && (
              <SummaryStep persona={persona} summary={summaryItems} />
            )}

            {submitError && (
              <div className="rounded-xl border border-rose-200/60 bg-rose-100/10 px-4 py-3 text-sm text-rose-100">
                {submitError}
              </div>
            )}

            <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-white/65">
                Need help? <Link href="/support" className="font-semibold text-white hover:underline">Contact support</Link>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBack}
                  disabled={isFirstStep}
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white/85 transition disabled:opacity-50"
                >
                  Back
                </button>
                {!isLastStep && (
                  <button
                    onClick={handleNext}
                    disabled={!canContinue}
                    className="rounded-xl bg-white px-5 py-2 text-sm font-semibold text-indigo-700 shadow-lg transition hover:bg-indigo-50 disabled:opacity-60"
                  >
                    Continue
                  </button>
                )}
                {isLastStep && (
                  <button
                    onClick={handleComplete}
                    disabled={finishDisabled}
                    className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {submitting ? "Saving..." : "Finish onboarding"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

}

type PersonaStepProps = {
  persona: Persona | null;
  onSelect: (value: Persona) => void;
};

function PersonaStep({ persona, onSelect }: PersonaStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Choose your current stage</h2>
      <p className="text-sm text-white/75">Well tailor study plans and communities to where you are on your journey.</p>
      <div className="grid gap-3">
        {PERSONA_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${persona === option.id ? "border-white/70 bg-white/15" : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"}`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${option.accent} text-lg text-white`}>{option.emoji}</span>
                <span className="text-base font-semibold text-white">{option.title}</span>
              </div>
              <p className="mt-1 text-sm text-white/70">{option.description}</p>
            </div>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${persona === option.id ? "border-white bg-white text-indigo-600" : "border-white/30 text-white/60"}`}>
              {persona === option.id ? "✓" : ""}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

type PremedExamStepProps = {
  examId: string;
  onSelect: (value: string) => void;
};

function PremedExamStep({ examId, onSelect }: PremedExamStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Which admission exam are you preparing for?</h2>
      <p className="text-sm text-white/75">This helps us schedule the right timelines and surface relevant communities.</p>
      <div className="grid gap-3">
        {EXAM_OPTIONS.map((option) => (
          <label key={option.id} className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 transition ${examId === option.id ? "border-white/70 bg-white/15" : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"}`}>
            <div>
              <p className="text-base font-semibold text-white">{option.label}</p>
            </div>
            <input
              type="radio"
              name="exam"
              value={option.id}
              checked={examId === option.id}
              onChange={(e) => onSelect(e.target.value)}
              className="h-4 w-4"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

type MedicalStepProps = {
  universities: Option[];
  schools: Option[];
  courses: Option[];
  selection: { universityId: number | null; schoolId: number | null; courseId: number | null; studyYear: number };
  loading: boolean;
  error: string | null;
  onUniversityChange: (value: string) => void;
  onSchoolChange: (value: string) => void;
  onCourseChange: (value: string) => void;
  onYearChange: (value: string) => void;
};

function MedicalStep({ universities, schools, courses, selection, loading, error, onUniversityChange, onSchoolChange, onCourseChange, onYearChange }: MedicalStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Tell us about your medical school</h2>
      <p className="text-sm text-white/75">Well connect you with verified classmates, events, and curated resources.</p>
      <div className="space-y-3">
        <SelectField
          label="University"
          value={selection.universityId ? String(selection.universityId) : ""}
          onChange={onUniversityChange}
          options={universities}
          placeholder="Select university"
        />
        <SelectField
          label="School"
          value={selection.schoolId ? String(selection.schoolId) : ""}
          onChange={onSchoolChange}
          options={schools}
          placeholder="Select school"
          disabled={!selection.universityId || loading}
        />
        <SelectField
          label="Course"
          value={selection.courseId ? String(selection.courseId) : ""}
          onChange={onCourseChange}
          options={courses}
          placeholder="Select course"
          disabled={!selection.schoolId || loading}
        />
        <div>
          <label className="block text-sm font-semibold text-white/80">Year of study</label>
          <select
            value={selection.studyYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-indigo-200 focus:outline-none"
            disabled={!selection.courseId || loading}
          >
            {YEARS.map((year) => (
              <option key={year} value={year} className="text-slate-900">Year {year}</option>
            ))}
          </select>
        </div>
        {loading && <p className="text-xs text-white/70">Loading options...</p>}
        {error && <p className="text-xs text-rose-200">{error}</p>}
        <p className="text-xs text-white/60">We use this information to place you in the correct course-mates cohort. Verification may still be required afterwards to unlock all features.</p>
      </div>
    </div>
  );
}

type SummaryEntry = { label: string; value: string | null };

function SummaryStep({ persona, summary }: { persona: Persona | null; summary: ReturnType<typeof buildSummary> }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Review your setup</h2>
      <p className="text-sm text-white/75">Heres what well use to personalize your dashboards.</p>
      <div className="space-y-3">
        {summary.entries.map((entry) => (
          <div key={entry.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <span className="text-sm font-semibold text-white/80">{entry.label}</span>
            <span className="text-sm text-white">{entry.value ?? "Not set"}</span>
          </div>
        ))}
      </div>
      {persona === "medical" && (
        <p className="text-xs text-white/65">You can update these details later from your profile or course-mates settings.</p>
      )}
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  disabled?: boolean;
};

function SelectField({ label, value, onChange, options, placeholder, disabled }: SelectFieldProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-white/80">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-indigo-200 focus:outline-none disabled:opacity-60"
        disabled={disabled}
      >
        <option value="" className="text-slate-900">
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.id} value={option.id} className="text-slate-900">
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function StepProgress({ stepOrder, currentStep }: { stepOrder: StepId[]; currentStep: StepId }) {
  return (
    <ol className="flex items-center gap-2 text-xs text-white/60">
      {stepOrder.map((step, index) => {
        const active = step === currentStep;
        const completed = stepOrder.indexOf(currentStep) > index;
        return (
          <li key={step} className="flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${active ? "bg-white text-indigo-700" : completed ? "bg-white/70 text-indigo-700" : "bg-white/20 text-white/70"}`}>
              {index + 1}
            </span>
            <span className={active ? "font-semibold text-white" : "text-white/65"}>{labelForStep(step)}</span>
            {index < stepOrder.length - 1 && <span className="text-white/30">/</span>}
          </li>
        );
      })}
    </ol>
  );
}

function Illustration({ step, persona }: { step: StepId; persona: Persona | null }) {
  const { gradient, title, message, emoji } = useMemo(() => {
    switch (step) {
      case "persona":
        return { gradient: "from-indigo-500/60 via-fuchsia-500/50 to-rose-500/60", title: "Choose your path", message: "Tell us where you are so we can guide you forward.", emoji: "🧭" };
      case "premedExam":
        return { gradient: "from-sky-500/60 via-emerald-500/50 to-cyan-500/60", title: "Lock in your exam", message: "Well align tasks and cohorts to your exam day.", emoji: "📝" };
      case "medicalDetails":
        return { gradient: "from-emerald-500/60 via-teal-500/50 to-blue-500/60", title: "Find your cohort", message: "Connect with verified classmates and mentor rooms.", emoji: "🏥" };
      case "summary":
      default:
        return { gradient: "from-violet-500/60 via-indigo-500/50 to-blue-500/60", title: "Ready to launch", message: "Well apply these preferences across your dashboards.", emoji: "🚀" };
    }
  }, [step]);

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-6 text-white shadow-[0_18px_60px_rgba(15,23,42,0.35)]`}>
      <div className="relative z-10 space-y-2">
        <span className="text-3xl">{emoji}</span>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-sm text-white/80">{message}</p>
        {persona && step !== "persona" && (
          <p className="text-xs text-white/70">Current focus: <span className="font-semibold text-white">{labelForPersona(persona)}</span></p>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 animate-[pulse_6s_ease-in-out_infinite] bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
    </div>
  );
}

function labelForPersona(persona: Persona) {
  switch (persona) {
    case "premed":
      return "Premed student";
    case "medical":
      return "Medical student";
    case "resident":
      return "Resident";
    case "doctor":
      return "Doctor";
    default:
      return "";
  }
}

function labelForStep(step: StepId) {
  switch (step) {
    case "persona":
      return "Stage";
    case "premedExam":
      return "Exam";
    case "medicalDetails":
      return "School";
    case "summary":
      return "Summary";
    default:
      return "Step";
  }
}

function buildFlow(persona: Persona | null): StepId[] {
  switch (persona) {
    case "premed":
      return ["persona", "premedExam", "summary"];
    case "medical":
      return ["persona", "medicalDetails", "summary"];
    case "resident":
    case "doctor":
      return ["persona", "summary"];
    default:
      return ["persona"];
  }
}

function parsePersona(value: string | null | undefined): Persona | null {
  if (value === "premed" || value === "medical" || value === "resident" || value === "doctor") return value;
  return null;
}

function resolveInitialExam(tracks: DashboardExamTrack[]): string {
  if (tracks && tracks.length > 0) {
    return tracks[0].id ?? "imat";
  }
  return "imat";
}

function buildSummary(persona: Persona | null, examId: string, medical: { universityId: number | null; schoolId: number | null; courseId: number | null; studyYear: number }, universities: Option[], schools: Option[], courses: Option[]) {
  const entries: SummaryEntry[] = [];
  let validMedical = true;

  entries.push({ label: "Stage", value: persona ? labelForPersona(persona) : null });

  if (persona === "premed") {
    const exam = EXAM_OPTIONS.find((option) => option.id === examId);
    entries.push({ label: "Admission exam", value: exam ? exam.label : "Not selected" });
  }

  if (persona === "medical") {
    const uniName = universities.find((u) => u.id === medical.universityId)?.name ?? null;
    const schoolName = schools.find((s) => s.id === medical.schoolId)?.name ?? null;
    const courseName = courses.find((c) => c.id === medical.courseId)?.name ?? null;
    entries.push({ label: "University", value: uniName });
    entries.push({ label: "School", value: schoolName });
    entries.push({ label: "Course", value: courseName });
    entries.push({ label: "Year", value: medical.courseId ? `Year ${medical.studyYear}` : null });
    validMedical = Boolean(medical.universityId && medical.schoolId && medical.courseId);
  }

  return { entries, validMedical };
}
