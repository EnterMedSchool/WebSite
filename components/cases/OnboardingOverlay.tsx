"use client";

import { usePractice } from "./PracticeProvider";

const baselineItems = [
  {
    id: "baseline-endo",
    system: "Endocrine",
    stem: "24-year-old with amenorrhea, galactorrhea, and headaches. Next best step?",
    choices: ["MRI brain", "Serum prolactin", "Start cabergoline", "Beta-hCG"],
  },
  {
    id: "baseline-cardio",
    system: "Cardiovascular",
    stem: "65-year-old with syncope while mowing lawn. ECG shows prolonged PR with dropped beats.",
    choices: ["Atropine", "Permanent pacemaker", "Observation", "IV adenosine"],
  },
  {
    id: "baseline-pulm",
    system: "Respiratory",
    stem: "Smoker presents with hemoptysis and 2.5 cm cavitary lesion in upper lobe. Next diagnostic step?",
    choices: ["Sputum cytology", "Bronchoscopy", "CT-guided biopsy", "Empiric antibiotics"],
  },
  {
    id: "baseline-neuro",
    system: "Neurology",
    stem: "Patient with sudden severe headache, neck stiffness. CT normal. Next?",
    choices: ["LP", "MRI", "Carotid Dopplers", "EEG"],
  },
  {
    id: "baseline-renal",
    system: "Renal",
    stem: "Young woman with flank pain, hematuria, and calcium oxalate crystals. Prevent recurrence?",
    choices: ["Thiazide", "Increase vitamin C", "Restrict fluids", "Allopurinol"],
  },
];

const confidenceOptions = [
  { key: "low" as const, label: "Low" },
  { key: "medium" as const, label: "Medium" },
  { key: "high" as const, label: "High" },
];

export default function OnboardingOverlay() {
  const {
    state,
    dismissOnboarding,
    setOnboardingStep,
    updateGoals,
    recordBaselineResponse,
    completeOnboarding,
  } = usePractice();
  const { onboarding } = state;
  if (!onboarding.active || onboarding.completed) return null;

  const nextDisabled = (() => {
    if (onboarding.stepIndex === 0) {
      const { examDate, targetDailyMinutes, weeklyAvailability } = onboarding.goals;
      return !examDate || targetDailyMinutes < 15 || weeklyAvailability <= 0;
    }
    if (onboarding.stepIndex === 1) {
      return baselineItems.some((item) => {
        const resp = onboarding.baselineResponses[item.id];
        return !resp?.choiceId || !resp?.confidence;
      });
    }
    return false;
  })();

  const goNext = () => {
    if (onboarding.stepIndex === 2) {
      completeOnboarding();
      return;
    }
    setOnboardingStep(onboarding.stepIndex + 1);
  };

  const goBack = () => {
    if (onboarding.stepIndex === 0) {
      dismissOnboarding();
      return;
    }
    setOnboardingStep(onboarding.stepIndex - 1);
  };

  const summary = onboarding.stepIndex === 2
    ? {
        correctApprox: Object.values(onboarding.baselineResponses).filter((resp) => resp?.confidence === "high").length,
        weakSystems: baselineItems
          .filter((item) => onboarding.baselineResponses[item.id]?.confidence === "low")
          .map((item) => item.system),
      }
    : null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500" />
        <div className="flex items-center justify-between pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-300">USMLE setup</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {onboarding.stepIndex === 0 && "Tell us about your exam goals"}
              {onboarding.stepIndex === 1 && "Quick calibration sprint"}
              {onboarding.stepIndex === 2 && "Your personalized starting point"}
            </h2>
          </div>
          <button
            onClick={dismissOnboarding}
            className="rounded-full px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            aria-label="Skip onboarding"
          >
            Skip for now
          </button>
        </div>

        {onboarding.stepIndex === 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            <label className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-sm font-medium text-white">Exam step</span>
              <select
                value={onboarding.goals.examStep}
                onChange={(event) => updateGoals({ examStep: event.target.value as "Step 1" | "Step 2 CK" })}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="Step 1">USMLE Step 1</option>
                <option value="Step 2 CK">USMLE Step 2 CK</option>
              </select>
              <span className="text-xs text-slate-400">We tailor systems and skills weighting for your exam.</span>
            </label>
            <label className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-sm font-medium text-white">Exam date</span>
              <input
                type="date"
                value={onboarding.goals.examDate}
                onChange={(event) => updateGoals({ examDate: event.target.value })}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400">We pace your plan to land ready, not burned out.</span>
            </label>
            <label className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-sm font-medium text-white">Weekly availability</span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={7}
                  value={onboarding.goals.weeklyAvailability}
                  onChange={(event) => updateGoals({ weeklyAvailability: Number(event.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm text-slate-200">{onboarding.goals.weeklyAvailability} days</span>
              </div>
              <span className="text-xs text-slate-400">We balance rest days with deliberate practice reps.</span>
            </label>
            <label className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-sm font-medium text-white">Target minutes per day</span>
              <input
                type="number"
                min={30}
                max={240}
                value={onboarding.goals.targetDailyMinutes}
                onChange={(event) => updateGoals({ targetDailyMinutes: Number(event.target.value) })}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400">We scale warm-ups, cases, and reviews to this load.</span>
            </label>
          </div>
        )}

        {onboarding.stepIndex === 1 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-300">
              Five fast items across systems. Use <kbd className="rounded bg-slate-800 px-1">1-5</kbd> to answer, <kbd className="rounded bg-slate-800 px-1">C</kbd> for confidence. We log decision speed, answer changes, and confidence to calibrate your first sessions.
            </p>
            <div className="flex flex-col gap-4 max-h-[360px] overflow-y-auto pr-2">
              {baselineItems.map((item, idx) => {
                const response = onboarding.baselineResponses[item.id] || { choiceId: null, confidence: null };
                return (
                  <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-indigo-300">
                      <span>
                        {idx + 1} - {item.system}
                      </span>
                      <span>Confidence</span>
                    </div>
                    <p className="mt-2 text-sm text-white">{item.stem}</p>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {item.choices.map((choice, choiceIdx) => {
                        const isActive = response.choiceId === choice;
                        return (
                          <button
                            key={choice}
                            onClick={() => recordBaselineResponse(item.id, choice, response.confidence ?? "medium")}
                            className={`group flex items-start gap-3 rounded-xl border px-3 py-2 text-left text-sm transition ${
                              isActive
                                ? "border-indigo-400 bg-indigo-500/15 text-white"
                                : "border-slate-800 bg-slate-900 text-slate-200 hover:border-indigo-500/60"
                            }`}
                          >
                            <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-600 text-xs text-slate-300">
                              {choiceIdx + 1}
                            </span>
                            <span>{choice}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex gap-2">
                      {confidenceOptions.map((option) => {
                        const isActive = response.confidence === option.key;
                        return (
                          <button
                            key={option.key}
                            onClick={() => recordBaselineResponse(item.id, response.choiceId, option.key)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                              isActive ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {onboarding.stepIndex === 2 && summary && (
          <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h3 className="text-lg font-semibold text-white">Here is your launch plan</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                <li>
                  We will start with <span className="text-white">3 cases/day</span> plus <span className="text-white">10 minute warm-up</span> to fit your {onboarding.goals.targetDailyMinutes} minute target.
                </li>
                <li>
                  {summary.weakSystems.length > 0
                    ? `${summary.weakSystems.join(", ")} need reps, so expect 60 percent of cases there this week.`
                    : "We detected balanced strengths, mixing systems to stress decision rules."}
                </li>
                <li>
                  Tutor mode stays on until calibration (confidence versus correctness) tightens.
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-indigo-500/40 bg-indigo-950/40 p-6 text-sm text-indigo-100">
              <span className="text-xs uppercase tracking-[0.25em] text-indigo-300">Signals captured</span>
              <p>Confidence spread: {summary.correctApprox} items answered with high confidence.</p>
              <p>We will nudge against premature closure if you submit before scanning labs.</p>
              <p className="text-xs text-indigo-300/80">Edit later from Settings -&gt; Personalization.</p>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={goBack}
            className="rounded-full px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
          >
            {onboarding.stepIndex === 0 ? "Skip" : "Back"}
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((idx) => (
                <span
                  key={idx}
                  className={`h-1.5 w-12 rounded-full ${idx <= onboarding.stepIndex ? "bg-indigo-400" : "bg-slate-800"}`}
                />
              ))}
            </div>
            <button
              onClick={goNext}
              disabled={nextDisabled}
              className="rounded-full bg-indigo-500 px-6 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {onboarding.stepIndex === 2 ? "Start today" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
