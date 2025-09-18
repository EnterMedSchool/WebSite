import type { PracticeBundle, PracticeNotification, ReviewQueueItem } from "./types";

const today = new Date();
const iso = (d: Date) => d.toISOString();

const futureDate = (offsetDays: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offsetDays);
  return iso(d);
};

const reviewDue = (offset: number, urgency: ReviewQueueItem["urgency"]): ReviewQueueItem => ({
  id: `review-${offset}`,
  caseId: offset % 2 === 0 ? "case-cushing" : "case-hf",
  due: futureDate(offset),
  mode: offset % 3 === 0 ? "variant" : offset % 2 === 0 ? "re-case" : "recall",
  urgency,
});

const notifications: PracticeNotification[] = [
  {
    id: "notif-1",
    message: "2 reviews due—5 minutes total.",
    detail: "Finish the short recall reps to keep your streak.",
    scheduledFor: futureDate(0),
    actionLabel: "Open Review Queue",
    actionHref: "/usmle/review",
  },
  {
    id: "notif-2",
    message: "Endocrine labs trip you up—today's first case emphasizes test selection.",
    scheduledFor: futureDate(0),
    actionLabel: "Start Guided Case",
    actionHref: "/usmle/practice/case/case-cushing",
  },
];

export const fakePracticeBundle: PracticeBundle = {
  user: {
    id: 101,
    name: "Jules Carter",
    examDate: futureDate(120),
    targetDailyMinutes: 120,
    weeklyAvailability: 5,
    preferredMode: "study",
  },
  todayPlan: [
    {
      id: "block-warmup",
      label: "Warm-up",
      description: "Quick recall to activate differentials.",
      items: [
        { id: "warmup-1", type: "warmup", title: "Renal physiology flash recall", durationMinutes: 5, status: "pending" },
        { id: "warmup-2", type: "warmup", title: "Buzzwords lightning round", durationMinutes: 5, status: "pending" },
      ],
    },
    {
      id: "block-cases",
      label: "Clinical Cases",
      description: "Deep reasoning reps for endocrine and cardio systems.",
      items: [
        { id: "case-cushing", type: "case", title: "Endocrine: Cushing syndrome", durationMinutes: 18, status: "pending" },
        { id: "case-hf", type: "case", title: "Cardio: ADHF workup", durationMinutes: 16, status: "pending" },
      ],
    },
    {
      id: "block-review",
      label: "Spaced Review",
      description: "Keep core algorithms fresh.",
      items: [
        { id: "review-endo", type: "review", title: "Dexamethasone ladder", durationMinutes: 6, status: "pending" },
      ],
    },
  ],
  paceStatus: {
    plannedMinutes: 120,
    completedMinutes: 45,
    pace: "behind",
  },
  weaknessNudges: [
    {
      id: "nudge-respiratory",
      message: "Respiratory diagnostics lagging—2 targeted cases queued.",
      systems: ["Respiratory"],
      recommendedCases: ["case-hf"],
    },
  ],
  modes: ["study", "exam", "rapid", "adaptive", "custom"],
  cases: [
    {
      id: "case-cushing",
      title: "Hypercortisolism workup",
      subtitle: "Identify the ACTH source with targeted testing",
      system: "Endocrine",
      discipline: "Pathology",
      physicianTasks: ["Diagnosis", "Interpret Labs"],
      skills: ["Algorithm", "CT"],
      difficulty: "moderate",
      format: "multi-step",
      estimatedMinutes: 18,
      steps: [
        {
          title: "Presentation",
          body:
            "35-year-old woman with progressive weight gain, proximal muscle weakness, acne, and purple abdominal striae.",
          highlights: ["purple striae", "proximal weakness"],
        },
        {
          title: "History",
          body: "Irregular menses, mood changes, easy bruising. No exogenous steroid use. Family history negative for endocrine tumors.",
          highlights: ["irregular menses", "no exogenous steroids"],
        },
        {
          title: "Exam",
          body: "BP 152/92 mmHg, HR 82 bpm. Facial rounding, dorsocervical fat pad, scattered acne. No focal neurologic deficits.",
          image: {
            src: "/images/cases/cushing-face.png",
            alt: "Patient with cushingoid facies",
          },
        },
        {
          title: "Labs",
          body: "Baseline labs available. Additional tests can be ordered from the panel.",
          highlights: ["hyperglycemia", "neutrophilia"],
        },
        {
          title: "Question",
          body: "Most likely source of hypercortisolism?",
        },
      ],
      labs: [
        { id: "lab-glucose", name: "Glucose", value: "198", unit: "mg/dL", reference: "70-99", flag: "high" },
        { id: "lab-wbc", name: "WBC", value: "14.2", unit: "k/µL", reference: "4.0-11.0", flag: "high" },
        { id: "lab-eos", name: "Eosinophils", value: "0.1", unit: "k/µL", reference: "0.05-0.5", flag: "low" },
        { id: "lab-potassium", name: "Potassium", value: "3.1", unit: "mEq/L", reference: "3.5-5.1", flag: "low" },
      ],
      orderableTests: [
        {
          id: "test-low-dose-dex",
          name: "Overnight low-dose dexamethasone suppression",
          cost: "moderate",
          durationMinutes: 720,
          yieldScore: 65,
          rationale: "Screens for hypercortisolism; suppression suggests pseudo-Cushing.",
        },
        {
          id: "test-acth",
          name: "Plasma ACTH level",
          cost: "low",
          durationMinutes: 30,
          yieldScore: 70,
          rationale: "Differentiates ACTH-dependent versus independent causes.",
        },
        {
          id: "test-high-dose-dex",
          name: "High-dose dexamethasone suppression",
          cost: "moderate",
          durationMinutes: 720,
          yieldScore: 80,
          rationale: "Suppression favors pituitary source over ectopic ACTH.",
        },
        {
          id: "test-crh",
          name: "CRH stimulation",
          cost: "high",
          durationMinutes: 90,
          yieldScore: 60,
          rationale: "Helps distinguish pituitary from ectopic ACTH if dexamethasone equivocal.",
        },
        {
          id: "test-mri-pituitary",
          name: "MRI pituitary",
          cost: "high",
          durationMinutes: 60,
          yieldScore: 55,
          rationale: "Anatomic confirmation after biochemical localization.",
        },
        {
          id: "test-ct-adrenal",
          name: "CT adrenal glands",
          cost: "high",
          durationMinutes: 45,
          yieldScore: 40,
          rationale: "Useful if labs suggest ACTH-independent cortisol excess.",
        },
      ],
      question: {
        prompt: "Which source best explains this patient's hypercortisolism given the testing pattern?",
        choices: [
          {
            id: "choice-pituitary",
            label: "A",
            text: "Pituitary ACTH-secreting adenoma",
            rationale: "High ACTH with suppression by high-dose dexamethasone indicates pituitary source.",
          },
          {
            id: "choice-ectopic",
            label: "B",
            text: "Ectopic ACTH from small cell lung carcinoma",
            rationale: "Ectopic ACTH does not suppress with high-dose dexamethasone.",
          },
          {
            id: "choice-adrenal",
            label: "C",
            text: "Autonomous adrenal adenoma",
            rationale: "Would produce low ACTH due to feedback suppression.",
          },
          {
            id: "choice-steroid",
            label: "D",
            text: "Exogenous corticosteroid therapy",
            rationale: "External steroids suppress ACTH and often show iatrogenic clues in history.",
          },
        ],
        answerId: "choice-pituitary",
        metadata: {
          task: "Diagnosis",
          timeBudgetSeconds: 120,
        },
      },
      hints: [
        {
          id: "hint-clue",
          tier: "clue",
          title: "Check what the ACTH level shows",
          description: "If ACTH is high, you are dealing with an ACTH-dependent process.",
          masteryCost: 0.33,
        },
        {
          id: "hint-process",
          tier: "process",
          title: "Think about the dexamethasone ladder",
          description: "Low-dose screens for hypercortisolism; high-dose differentiates pituitary from ectopic.",
          masteryCost: 0.33,
        },
        {
          id: "hint-knowledge",
          tier: "knowledge",
          title: "Pituitary tumors partially suppress",
          description: "Pituitary ACTH cells still have some negative feedback sensitivity compared to ectopic sources.",
          masteryCost: 0.33,
        },
      ],
      reasoningMap: {
        id: "root",
        label: "Hyper- cortisolism pathway",
        detail: "Integrate data to localize the source of cortisol excess.",
        supportingEvidence: ["Persistent Cushingoid features", "Hypertension"],
        children: [
          {
            id: "branch-acth",
            label: "ACTH-dependent",
            detail: "Elevated ACTH narrows differential to pituitary vs ectopic.",
            supportingEvidence: ["ACTH level high"],
            children: [
              {
                id: "node-dex",
                label: "High-dose dexamethasone response",
                detail: "Suppression indicates pituitary origin.",
                supportingEvidence: ["High-dose dex suppressed cortisol"],
              },
            ],
          },
          {
            id: "branch-independent",
            label: "ACTH-independent",
            detail: "Would show low ACTH with adrenal imaging abnormalities.",
            supportingEvidence: [],
          },
        ],
      },
      biasTags: [
        {
          id: "bias-anchoring",
          label: "Anchoring",
          description: "Answering before reviewing lab pathway risks anchoring on initial impression.",
        },
      ],
      artifacts: [
        {
          id: "artifact-flashcard",
          type: "flashcard",
          title: "High-dose dexamethasone discriminator",
          body: "Pituitary ACTH secreting adenomas suppress; ectopic sources stay elevated.",
        },
        {
          id: "artifact-flowchart",
          type: "flowchart",
          title: "Cushing algorithm",
          body: "1) Confirm hypercortisolism → 2) Check ACTH → 3) High-dose dex vs ectopic workup.",
        },
        {
          id: "artifact-variant",
          type: "variant",
          title: "Ectopic ACTH variant",
          body: "Same presentation but high-dose dex fails to suppress and patient has 40-pack-year smoking history.",
        },
      ],
      resources: [
        {
          id: "res-clip",
          label: "Course clip",
          href: "https://example.com/course/hypercortisolism#t=190",
          description: "3:10 clip: high-dose dex test ladder.",
          timestamp: "03:10",
        },
        {
          id: "res-note",
          label: "One-pager",
          href: "https://example.com/resources/dexamethasone-ladder.pdf",
          description: "Dexamethasone suppression steps with triggers.",
        },
      ],
    },
    {
      id: "case-hf",
      title: "Acute decompensated heart failure",
      subtitle: "Stabilize and identify precipitating factors",
      system: "Cardiovascular",
      discipline: "Internal Medicine",
      physicianTasks: ["Management", "Interpret Labs"],
      skills: ["EKG", "Ultrasound"],
      difficulty: "hard",
      format: "multi-step",
      estimatedMinutes: 16,
      steps: [
        {
          title: "Presentation",
          body: "67-year-old man with dyspnea at rest, orthopnea, and bilateral leg swelling.",
          highlights: ["orthopnea", "bilateral edema"],
        },
        {
          title: "History",
          body: "History of ischemic cardiomyopathy (EF 25%), missed diuretics this week, viral URI 5 days ago.",
        },
        {
          title: "Exam",
          body: "BP 96/58 mmHg, HR 108 bpm, RR 24, O2 sat 90% on room air. Bibasilar crackles, S3 gallop, cool extremities.",
        },
        {
          title: "Studies",
          body: "Portable CXR shows pulmonary edema. Point-of-care ultrasound: plethoric IVC.",
        },
        {
          title: "Question",
          body: "Next best step in management?",
        },
      ],
      labs: [
        { id: "lab-bnp", name: "BNP", value: "1420", unit: "pg/mL", reference: "<100", flag: "high" },
        { id: "lab-na", name: "Na", value: "129", unit: "mEq/L", reference: "135-145", flag: "low" },
        { id: "lab-creatinine", name: "Creatinine", value: "2.1", unit: "mg/dL", reference: "0.6-1.2", flag: "high" },
      ],
      orderableTests: [
        {
          id: "test-arterial-blood-gas",
          name: "Arterial blood gas",
          cost: "low",
          durationMinutes: 15,
          yieldScore: 70,
          rationale: "Assesses ventilation and guides escalation decisions.",
        },
        {
          id: "test-echo",
          name: "Transthoracic echocardiogram",
          cost: "moderate",
          durationMinutes: 30,
          yieldScore: 60,
          rationale: "Evaluates cardiac function changes or new valvular issues.",
        },
        {
          id: "test-coronary-angiogram",
          name: "Urgent coronary angiogram",
          cost: "high",
          durationMinutes: 120,
          yieldScore: 30,
          rationale: "Reserved if suspicion for acute coronary syndrome precipitant.",
        },
      ],
      question: {
        prompt: "What is the next best step in management?",
        choices: [
          {
            id: "choice-diuresis",
            label: "A",
            text: "Initiate IV loop diuretics and vasodilators",
            rationale: "Relieves congestion but may worsen hypotension; still necessary if perfusion acceptable.",
          },
          {
            id: "choice-inotrope",
            label: "B",
            text: "Start IV dobutamine infusion",
            rationale: "Low output signs with hypotension favor inotrope support while monitoring perfusion.",
          },
          {
            id: "choice-fluid",
            label: "C",
            text: "Administer 1 L normal saline bolus",
            rationale: "Would worsen pulmonary edema in ADHF.",
          },
          {
            id: "choice-beta-blocker",
            label: "D",
            text: "Increase home beta-blocker dose",
            rationale: "Not indicated in acute decompensation with hypotension.",
          },
        ],
        answerId: "choice-inotrope",
      },
      hints: [
        {
          id: "hint-hf-clue",
          tier: "clue",
          title: "Assess perfusion",
          description: "Cool extremities and hypotension suggest low output.",
          masteryCost: 0.33,
        },
        {
          id: "hint-hf-process",
          tier: "process",
          title: "Use the wet/dry warm/cold quadrant",
          description: "This patient is wet and cold → needs inotrope and diuresis after perfusion improves.",
          masteryCost: 0.33,
        },
      ],
      reasoningMap: {
        id: "root",
        label: "ADHF pathway",
        detail: "Determine perfusion and congestion to guide therapy.",
        supportingEvidence: ["Hypotension", "Cool extremities"],
        children: [
          {
            id: "node-wet",
            label: "Wet profile",
            detail: "Volume overload evident by pulmonary edema and elevated JVP/BNP.",
            supportingEvidence: ["Pulmonary edema", "Plethoric IVC"],
          },
          {
            id: "node-cold",
            label: "Cold profile",
            detail: "Signs of low output and hypoperfusion.",
            supportingEvidence: ["Cool extremities", "Low BP"],
            children: [
              {
                id: "node-intervention",
                label: "Inotropic support",
                detail: "Dobutamine improves cardiac output while allowing cautious diuresis.",
                supportingEvidence: ["Low systolic BP"],
              },
            ],
          },
        ],
      },
      biasTags: [
        {
          id: "bias-therapeutic-inertia",
          label: "Therapeutic inertia",
          description: "Continuing chronic therapy despite decompensation can worsen outcomes.",
        },
      ],
      artifacts: [
        {
          id: "artifact-hf-flashcard",
          type: "flashcard",
          title: "Wet-cold quadrant",
          body: "Wet + cold ADHF → inotrope support, then diuresis.",
        },
        {
          id: "artifact-hf-variant",
          type: "variant",
          title: "Warm and wet variant",
          body: "Same patient but normotensive with warm extremities → high-dose IV diuretics + vasodilators.",
        },
      ],
      resources: [
        {
          id: "res-hf-clip",
          label: "Course clip",
          href: "https://example.com/course/adhf#t=420",
          description: "7:00 clip: wet/dry warm/cold quadrant walk-through.",
          timestamp: "07:00",
        },
      ],
    },
  ],
  reviewQueue: {
    due: [reviewDue(0, "today"), reviewDue(-1, "overdue")],
    upcoming: [reviewDue(1, "tomorrow"), reviewDue(3, "this_week")],
    suspended: [],
  },
  sessionSummary: {
    sessionId: "session-0423",
    accuracy: 0.67,
    averageTimeSeconds: 155,
    confidenceCurve: [
      { confidence: "low", correct: 4, total: 6 },
      { confidence: "medium", correct: 5, total: 7 },
      { confidence: "high", correct: 6, total: 9 },
    ],
    heatmap: [
      { system: "Endocrine", discipline: "Pathology", value: 0.6 },
      { system: "Cardiovascular", discipline: "Internal Medicine", value: 0.45 },
      { system: "Respiratory", discipline: "Physiology", value: 0.35 },
    ],
    errorFingerprint: {
      knowledge: 0.4,
      dataInterpretation: 0.55,
      prematureClosure: 0.3,
      math: 0.2,
      imaging: 0.45,
      timePressure: 0.5,
    },
    paceReport: [
      { caseId: "case-cushing", timeSeconds: 220, budgetSeconds: 180 },
      { caseId: "case-hf", timeSeconds: 160, budgetSeconds: 150 },
    ],
    peerPercentile: 72,
  },
  dashboard: {
    masteryTrend: [
      { date: futureDate(-14), value: 45 },
      { date: futureDate(-7), value: 52 },
      { date: futureDate(-3), value: 55 },
      { date: futureDate(0), value: 58 },
    ],
    streak: 9,
    minutes: {
      id: "minutes",
      label: "Minutes practiced (7d)",
      description: "Total focused minutes logged this week.",
      value: 410,
      trend: [
        { date: futureDate(-6), value: 60 },
        { date: futureDate(-5), value: 75 },
        { date: futureDate(-4), value: 55 },
        { date: futureDate(-3), value: 65 },
        { date: futureDate(-2), value: 72 },
        { date: futureDate(-1), value: 60 },
        { date: futureDate(0), value: 23 },
      ],
    },
    examReadiness: {
      id: "readiness",
      label: "Exam readiness",
      description: "Composite of coverage, calibration, and pace.",
      value: 68,
    },
    coverageHeatmap: [
      { system: "Endocrine", discipline: "Pathology", value: 0.62 },
      { system: "Cardiovascular", discipline: "Internal Medicine", value: 0.48 },
      { system: "Neurology", discipline: "Pharmacology", value: 0.33 },
    ],
    biggestMovers: [
      { area: "Endocrine algorithms", delta: 12 },
      { area: "Respiratory radiology", delta: -6 },
    ],
    biasMonitor: [
      { label: "Answer changes", impact: "Switching answers late reduces accuracy by 8%" },
      { label: "Guessing under time", impact: "Low confidence rush decisions drop accuracy by 12%" },
    ],
    timeBudget: {
      id: "time-budget",
      label: "Median time per item",
      description: "Compare to goal of 90 seconds",
      value: 104,
    },
    imageSkills: {
      id: "image-skills",
      label: "Image interpretation",
      description: "% correct across CT, CXR, EKG this month",
      value: 71,
    },
    studyQuality: {
      id: "study-quality",
      label: "Study quality",
      description: "Active days × average session length × review completion",
      value: 78,
    },
    resourceLeverage: [
      { resource: "Cushing algorithm video", effect: "+18% accuracy next day" },
      { resource: "Wet/dry cheat sheet", effect: "+2 case/day throughput" },
    ],
    insights: [
      "Your endocrine diagnosis improves 24h after watching clips; schedule 2 short videos after case practice.",
      "When you mark low confidence, take 30 sec pause—reduces premature closure by 10%.",
    ],
  },
  notifications,
  resources: [
    {
      id: "alg-dex",
      category: "algorithm",
      title: "Dexamethasone suppression ladder",
      description: "Flowchart for low vs high-dose interpretation and follow up tests.",
    },
    {
      id: "onepager-hf",
      category: "one-pager",
      title: "Wet vs dry | warm vs cold cheat sheet",
      description: "Printable quadrant card for bedside decisions.",
    },
    {
      id: "atlas-ct",
      category: "atlas",
      title: "Thoracic CT pearls",
      description: "Common findings and differentials with micro-quizzes.",
      media: { src: "/images/resources/thoracic-ct.png", alt: "Annotated CT image" },
    },
  ],
};
