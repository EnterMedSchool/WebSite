#!/usr/bin/env node

import { Client } from "pg";

const connectionString = "postgresql://neondb_owner:npg_YgJuKaCj6ny3@ep-bold-mode-a2sorydk-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const exam = {
  slug: "imat",
  name: "International Medical Admissions Test",
  description:
    "IMAT blueprint covering logical reasoning, general knowledge, biology, chemistry, physics, and mathematics.",
  locale: "en",
  defaultUnitSystem: "SI",
  metadata: {
    board: "Cambridge Assessment Admissions Testing",
    durationMinutes: 100,
    sections: 5,
    note: "Seeded fake content for local testing",
  },
};

const sections = [
  {
    slug: "logical-reasoning",
    name: "Logical Reasoning & Problem Solving",
    description: "Critical reasoning, pattern analysis, and situational logic challenges.",
    orderIndex: 0,
  },
  {
    slug: "general-knowledge",
    name: "General Knowledge",
    description: "Humanities, current affairs, cultural literacy, and ethics.",
    orderIndex: 1,
  },
  {
    slug: "biology",
    name: "Biology",
    description: "Cell biology, physiology, genetics, evolution, and ecology.",
    orderIndex: 2,
  },
  {
    slug: "chemistry",
    name: "Chemistry",
    description: "General, organic, and physical chemistry essentials.",
    orderIndex: 3,
  },
  {
    slug: "physics-maths",
    name: "Physics & Mathematics",
    description: "Mechanics, electricity, statistics, and applied mathematics.",
    orderIndex: 4,
  },
];

const topics = [
  {
    slug: "logical-argument-analysis",
    title: "Argument Analysis",
    sectionSlug: "logical-reasoning",
    blueprintCode: "IMAT-LR-1",
    orderIndex: 0,
  },
  {
    slug: "logical-syllogisms",
    title: "Syllogisms & Deduction",
    sectionSlug: "logical-reasoning",
    blueprintCode: "IMAT-LR-2",
    orderIndex: 1,
  },
  {
    slug: "logical-data-sufficiency",
    title: "Data Sufficiency",
    sectionSlug: "logical-reasoning",
    blueprintCode: "IMAT-LR-3",
    orderIndex: 2,
  },
  {
    slug: "general-knowledge-humanities",
    title: "Humanities & Culture",
    sectionSlug: "general-knowledge",
    blueprintCode: "IMAT-GK-1",
    orderIndex: 0,
  },
  {
    slug: "general-knowledge-science-history",
    title: "Science & Medical History",
    sectionSlug: "general-knowledge",
    blueprintCode: "IMAT-GK-2",
    orderIndex: 1,
  },
  {
    slug: "biology-cell-structure",
    title: "Cell Structure & Function",
    sectionSlug: "biology",
    blueprintCode: "IMAT-BIO-1",
    orderIndex: 0,
  },
  {
    slug: "biology-genetics",
    title: "Genetics & Inheritance",
    sectionSlug: "biology",
    blueprintCode: "IMAT-BIO-3",
    orderIndex: 1,
  },
  {
    slug: "biology-physiology-homeostasis",
    title: "Human Physiology & Homeostasis",
    sectionSlug: "biology",
    blueprintCode: "IMAT-BIO-4",
    orderIndex: 2,
  },
  {
    slug: "chemistry-equilibria",
    title: "Chemical Equilibria",
    sectionSlug: "chemistry",
    blueprintCode: "IMAT-CHEM-2",
    orderIndex: 0,
  },
  {
    slug: "chemistry-organic-functional-groups",
    title: "Organic Chemistry: Functional Groups",
    sectionSlug: "chemistry",
    blueprintCode: "IMAT-CHEM-4",
    orderIndex: 1,
  },
  {
    slug: "physics-kinematics",
    title: "Kinematics & Dynamics",
    sectionSlug: "physics-maths",
    blueprintCode: "IMAT-PHY-1",
    orderIndex: 0,
  },
  {
    slug: "physics-electricity",
    title: "Electric Circuits & Fields",
    sectionSlug: "physics-maths",
    blueprintCode: "IMAT-PHY-3",
    orderIndex: 1,
  },
  {
    slug: "maths-statistics-probability",
    title: "Statistics & Probability",
    sectionSlug: "physics-maths",
    blueprintCode: "IMAT-MATH-2",
    orderIndex: 2,
  },
];

const questions = [
  {
    publicId: "imat-lr-0002",
    version: 1,
    isLatest: true,
    status: "live",
    questionType: "sba",
    difficulty: "medium",
    cognitiveLevel: "Evaluate",
    skillType: "logical_reasoning",
    calculatorPolicy: "disallowed",
    unitSystem: "SI",
    primaryLocale: "en",
    timeEstimateSec: 110,
    sectionSlug: "logical-reasoning",
    primaryTopicSlug: "logical-argument-analysis",
    metadata: {
      blueprint: "IMAT-LR-1",
      examYear: 2025,
      stimulusType: "short_passage",
    },
    tags: ["logic", "assumptions"],
    stemBlocks: [
      {
        kind: "text",
        value:
          "Clinical trial data show that patients adhering to a low-sodium diet experience fewer hypertensive crises. Therefore, reducing sodium automatically prevents cardiovascular mortality.",
      },
      {
        kind: "text",
        value: "Which option best identifies the flaw in the argument?",
      },
    ],
    options: [
      {
        value: "A",
        label: "It ignores potential confounding factors between sodium intake and hypertensive crises.",
        isCorrect: false,
        rationale: "That would critique internal validity but not the leap to mortality.",
      },
      {
        value: "B",
        label: "It assumes that fewer hypertensive crises directly translate to reduced cardiovascular mortality.",
        isCorrect: true,
        rationale:
          "The conclusion requires an extra assumption that crisis frequency is the only cause of mortality; without it the claim overreaches.",
      },
      {
        value: "C",
        label: "It fails to define what counts as \"low-sodium\" for the cohort.",
        isCorrect: false,
        rationale: "Definition vagueness is not central to the argument.",
      },
      {
        value: "D",
        label: "It ignores whether patients can realistically follow a low-sodium diet.",
        isCorrect: false,
        rationale: "Feasibility is irrelevant to the logical leap made in the conclusion.",
      },
    ],
    explanation:
      "The argument conflates a reduction in hypertensive crises with a guarantee of lower mortality. That causal link is unstated and unjustified, making option B the best critique.",
    references: [
      {
        label: "IMAT Spec: Logical Reasoning",
        url: "https://www.cambridgeenglish.org/qualifications/medical-admissions/imat/format/",
      },
    ],
  },
  {
    publicId: "imat-lr-0003",
    version: 1,
    isLatest: true,
    status: "live",
    questionType: "sba",
    difficulty: "hard",
    cognitiveLevel: "Analyze",
    skillType: "data_sufficiency",
    calculatorPolicy: "disallowed",
    unitSystem: "SI",
    primaryLocale: "en",
    timeEstimateSec: 120,
    sectionSlug: "logical-reasoning",
    primaryTopicSlug: "logical-data-sufficiency",
    metadata: {
      blueprint: "IMAT-LR-3",
      format: "data_sufficiency",
    },
    tags: ["logic", "data sufficiency"],
    stemBlocks: [
      {
        kind: "text",
        value:
          "A hospital wants to determine whether a new triage protocol reduces median waiting time in the emergency department compared with last year.",
      },
      {
        kind: "text",
        value:
          "Statement 1: The new protocol was used on 320 randomly selected patient visits, yielding a mean wait of 42 minutes with standard deviation 14 minutes.",
      },
      {
        kind: "text",
        value:
          "Statement 2: Administrative records show that last year the median wait time was 48 minutes with an interquartile range of 16 minutes.",
      },
      {
        kind: "text",
        value: "Which option correctly describes whether the statements are sufficient?",
      },
    ],
    options: [
      {
        value: "A",
        label: "Statement 1 alone is sufficient, but Statement 2 alone is not sufficient.",
        isCorrect: false,
        rationale: "Statement 1 reports mean and SD but not the median, so it cannot answer the question alone.",
      },
      {
        value: "B",
        label: "Statement 2 alone is sufficient, but Statement 1 alone is not sufficient.",
        isCorrect: false,
        rationale: "Statement 2 gives last year's median but nothing about the new protocol.",
      },
      {
        value: "C",
        label: "Both statements together are sufficient to answer the question.",
        isCorrect: true,
        rationale:
          "Together they provide the new mean/SD and last year's median; assuming approximate symmetry (which must be considered), one can infer the median change with reasonable confidence per IMAT data-sufficiency conventions.",
      },
      {
        value: "D",
        label: "Even combined, the statements are insufficient to answer the question.",
        isCorrect: false,
        rationale: "IMAT data-sufficiency treats the sample mean/SD and prior median as adequate for inference under assumed normality.",
      },
    ],
    explanation:
      "Neither statement alone answers the question, but together they supply comparable statistics for before and after, adequate to evaluate the change under the typical IMAT assumption of roughly symmetric distributions.",
    references: [
      {
        label: "Mock IMAT Review: Data Sufficiency Essentials",
        citation: "Section 2",
      },
    ],
  },
  {
    publicId: "imat-gk-0001",
    version: 1,
    isLatest: true,
    status: "live",
    questionType: "sba",
    difficulty: "easy",
    cognitiveLevel: "Remember",
    skillType: "recall",
    calculatorPolicy: "disallowed",
    unitSystem: "SI",
    primaryLocale: "en",
    timeEstimateSec: 60,
    sectionSlug: "general-knowledge",
    primaryTopicSlug: "general-knowledge-humanities",
    metadata: {
      blueprint: "IMAT-GK-1",
      theme: "Renaissance",
    },
    tags: ["history", "humanities"],
    stemBlocks: [
      {
        kind: "text",
        value: "Which city is widely considered the birthplace of the Italian Renaissance?",
      },
    ],
    options: [
      {
        value: "A",
        label: "Florence",
        isCorrect: true,
        rationale: "Florence fostered early patronage and artistic innovation that launched the Renaissance.",
      },
      {
        value: "B",
        label: "Venice",
        isCorrect: false,
        rationale: "Venice was influential later but not the birthplace.",
      },
      {
        value: "C",
        label: "Milan",
        isCorrect: false,
        rationale: "Milan thrived culturally but after Florence's initial surge.",
      },
      {
        value: "D",
        label: "Rome",
        isCorrect: false,
        rationale: "Rome became central during the High Renaissance, not at its birth.",
      },
    ],
    explanation:
      "Florence's Medici patronage and artistic workshops made it the nucleus of the early Renaissance.",
    references: [
      {
        label: "Cambridge IMAT Sample Questions",
        url: "https://www.cambridgeenglish.org/qualifications/medical-admissions/imat/preparation/",
      },
    ],
  },
  {
    publicId: "imat-gk-0002",
    version: 1,
    isLatest: true,
    status: "live",
    questionType: "multi",
    difficulty: "medium",
    cognitiveLevel: "Understand",
    skillType: "interpretation",
    calculatorPolicy: "disallowed",
    unitSystem: "SI",
    primaryLocale: "en",
    timeEstimateSec: 95,
    sectionSlug: "general-knowledge",
    primaryTopicSlug: "general-knowledge-science-history",
    metadata: {
      blueprint: "IMAT-GK-2",
      format: "select_all",
    },
    tags: ["medical history", "ethics"],
    stemBlocks: [
      {
        kind: "text",
        value: "Select BOTH statements that correctly describe milestones in medical ethics history.",
      },
    ],
    options: [
      {
        value: "A",
        label: "The Nuremberg Code (1947) emphasized voluntary consent for human experimentation.",
        isCorrect: true,
        rationale: "The Code established informed consent as central to ethical research.",
      },
      {
        value: "B",
        label: "The Belmont Report (1979) introduced the principles of beneficence, justice, and respect for persons.",
        isCorrect: true,
        rationale: "Beneficence, justice, and respect for persons are the Belmont pillars.",
      },
      {
        value: "C",
        label: "The Declaration of Geneva (1880) codified patient confidentiality in the same year as germ theory discovery.",
        isCorrect: false,
        rationale: "The Declaration of Geneva was issued in 1948, well after germ theory acceptance.",
      },
      {
        value: "D",
        label: "The Tuskegee Study (1932–1972) is notable for establishing randomized control in public health.",
        isCorrect: false,
        rationale: "Tuskegee is infamous for unethical withholding of treatment, not for RCT innovation.",
      },
    ],
    explanation:
      "Statements A and B capture foundational ethics documents. C misdates the Declaration of Geneva, and D mischaracterizes the Tuskegee Study.",
    references: [
      {
        label: "WHO Medical Ethics Timeline",
        url: "https://www.who.int/ethics",
      },
    ],
  },
  {
    publicId: "imat-bio-0002",
    version: 1,
    isLatest: true,
    status: "live",
    questionType: "sba",
    difficulty: "medium",
    cognitiveLevel: "Apply",
    skillType: "concept_application",
    calculatorPolicy: "disallowed",
    unitSystem: "SI",
    primaryLocale: "en",
    timeEstimateSec: 100,
    sectionSlug: "biology",
    primaryTopicSlug: "biology-genetics",
    metadata: {
      blueprint: "IMAT-BIO-3",
      scenario: "autosomal_recessive",
    },
    tags: ["genetics", "inheritance"],
    stemBlocks: [
      {
        kind: "text",
        value:
          "Two carriers of an autosomal recessive condition have three children. What is the probability that exactly two of the children express the phenotype?",
      },
    ],
    options: [
      {
        value: "A",
        label: "3/64",
        isCorrect: false,
        rationale: "Misapplies binomial coefficients; probability of affecteds is 1/4 each child.",
      },
      {
        value: "B",
        label: "9/64",
        isCorrect: true,
        rationale:
          "Use binomial distribution with p = 1/4 for being affected: C(3,2)*(1/4)^2*(3/4) = 3*(1/16)*(3/4) = 9/64.",
      },
      {
        value: "C",
        label: "27/64",
        isCorrect: false,
        rationale: "Corresponds to probability all are unaffected (3/4)^3.",
      },
      {
        value: "D",
        label: "3/16",
        isCorrect: false,
        rationale: "Omitted one power of 1/4 in binomial calculation.",
      },
    ],
    explanation:
      "With independent offspring, apply the binomial formula for exactly two successes where success probability is 1/4.",
    references: [
      {
        label: "Alberts et al., Molecular Biology of the Cell (7th ed.)",
        citation: "Chapter 19",
      },
    ],
  },
  {
    publicId: "imat-bio-0003",
    version: 1,
    isLatest: true,
    status: "live",
    questionType: "sba",
    difficulty: "medium",
    cognitiveLevel: "Analyze",
    skillType: "interpretation",
    calculatorPolicy: "disallowed",
    unitSystem: "SI",
    primaryLocale: "en",
    timeEstimateSec: 105,
    sectionSlug: "biology",
    primaryTopicSlug: "biology-physiology-homeostasis",
    metadata: {
      blueprint: "IMAT-BIO-4",
      pathway: "endocrine",
    },
    tags: ["physiology", "homeostasis"],
    stemBlocks: [
      {
        kind: "text",
        value:
          "A patient's blood glucose spikes rapidly after meals despite normal insulin secretion. Which mechanism best explains the observation?",
      },
    ],
    options: [
      {
        value: "A",
        label: "Reduced GLUT4 transporter translocation in skeletal muscle.",
        isCorrect: true,
        rationale:
          "If GLUT4 fails to insert into membranes, tissues cannot uptake glucose efficiently, causing spikes despite insulin presence.",
      },
      {
        value: "B",
        label: "Enhanced hepatic gluconeogenesis during fasting.",
        isCorrect: false,
        rationale: "Gluconeogenesis occurs during fasting, not postprandial spikes.",
      },
      {
        value: "C",
        label: "Increased insulin clearance by the kidneys.",
        isCorrect: false,
        rationale: "Faster clearance would reduce insulin levels, contradicting the prompt's 'normal secretion'.",
      },
      {
        value: "D",
        label: "Pancreatic alpha cell hyperplasia raising glucagon.",
        isCorrect: false,
        rationale: "High glucagon opposes insulin but the scenario highlights normal insulin levels and meal-time spikes, pointing to peripheral resistance.",
      },
    ],
    explanation:
      "Impaired GLUT4 trafficking is a hallmark of insulin resistance, leading to postprandial hyperglycemia even when insulin secretion appears normal.",
    references: [
      {
        label: "Guyton & Hall, Textbook of Medical Physiology",
        citation: "Chapter on Insulin and Glucagon",
      },
    ],
  },
  {
    publicId: "imat-chem-0002",
    version: 1,
    isLatest: true,
    status: "live",
    questionType: "sba",
    difficulty: "medium",
    cognitiveLevel: "Apply",
    skillType: "calculation",
    calculatorPolicy: "basic",
    unitSystem: "SI",
    primaryLocale: "en",
    timeEstimateSec: 130,
    sectionSlug: "chemistry",
    primaryTopicSlug: "chemistry-equilibria",
    metadata: {
      blueprint: "IMAT-CHEM-2",
      theme: "LeChatelier",
    },
    tags: ["chemistry", "equilibrium"],
    stemBlocks: [
      {
        kind: "text",
        value:
          "For the endothermic reaction CaCO3(s) ? CaO(s) + CO2(g), which change decreases the amount of CaO at equilibrium?",
      },
    ],
    options: [
      {
        value: "A",
        label: "Increasing the temperature.",
        isCorrect: false,
        rationale: "Endothermic forward reaction would be favored, increasing CaO.",
      },
      {
        value: "B",
        label: "Removing CO2 gas from the container.",
        isCorrect: false,
        rationale: "Removing product drives reaction forward, increasing CaO.",
      },
      {
        value: "C",
        label: "Adding CO2 gas to the system at constant temperature.",
        isCorrect: true,
        rationale:
          "Adding CO2 increases partial pressure, shifting equilibrium toward reactants and consuming CaO to form CaCO3.",
      },
      {
        value: "D",
        label: "Decreasing the total system pressure by expanding volume.",
        isCorrect: false,
        rationale: "More volume favors gas formation, thus more CaO.",
      },
    ],
    explanation:
      "Adding CO2 pushes the equilibrium left, re-forming CaCO3 and consuming CaO.",
    references: [
      {
        label: "Atkins Physical Chemistry",
        citation: "Le Chatelier Principle section",
      },
    ],
  },
  {
    publicId: "imat-chem-0003",
    version: 1,
    isLatest: true,
    status: "live",
    questionType: "sba",
    difficulty: "medium",
    cognitiveLevel: "Understand",
    skillType: "concept_application",
    calculatorPolicy: "disallowed",
    unitSystem: "SI",
    primaryLocale: "en",
    timeEstimateSec: 105,
    sectionSlug: "chemistry",
    primaryTopicSlug: "chemistry-organic-functional-groups",
    metadata: {
      blueprint: "IMAT-CHEM-4",
      theme: "functional_groups",
    },
    tags: ["organic", "functional groups"],
    stemBlocks: [
      {
        kind: "text",
        value:
          "Which compound would give a positive result with Tollens' reagent (ammoniacal silver nitrate)?",
      },
    ],
    options: [
      {
        value: "A",
        label: "2-propanol",
        isCorrect: false,
        rationale: "Secondary alcohols are not oxidized by Tollens' reagent.",
      },
      {
        value: "B",
        label: "ethanoic acid",
        isCorrect: false,
        rationale: "Carboxylic acids are already oxidized and do not reduce Tollens' reagent.",
      },
      {
        value: "C",
        label: "propionaldehyde",
        isCorrect: true,
        rationale: "Aldehydes reduce Tollens' reagent forming silver mirror.",
      },
      {
        value: "D",
        label: "methoxybenzene",
        isCorrect: false,
        rationale: "Ethers lack the carbonyl group required for Tollens' reaction.",
      },
    ],
    explanation:
      "Tollens' reagent oxidizes aldehydes to acids while depositing silver; propionaldehyde fits this behavior.",
    references: [
      {
        label: "Clayden Organic Chemistry",
        citation: "Chapter on Carbonyl Chemistry",
      },
    ],
  },
  {
    publicId: "imat-phys-0001",
    version: 1,
    isLatest: true,
    status: "live",
    questionType: "sba",
    difficulty: "medium",
    cognitiveLevel: "Apply",
    skillType: "calculation",
    calculatorPolicy: "basic",
    unitSystem: "SI",
    primaryLocale: "en",
    timeEstimateSec: 120,
    sectionSlug: "physics-maths",
    primaryTopicSlug: "physics-kinematics",
    metadata: {
      blueprint: "IMAT-PHY-1",
      scenario: "projectile",
    },
    tags: ["physics", "mechanics"],
    stemBlocks: [
      {
        kind: "text",
        value:
          "A ball is launched horizontally at 20 m/s from a 45 m high cliff. Ignoring air resistance, how far from the base does it land?",
      },
    ],
    options: [
      {
        value: "A",
        label: "30 m",
        isCorrect: false,
        rationale: "Underestimates time of flight.",
      },
      {
        value: "B",
        label: "42 m",
        isCorrect: false,
        rationale: "Corresponds to travel time ~2.1 s (incorrect).",
      },
      {
        value: "C",
        label: "60 m",
        isCorrect: true,
        rationale:
          "Time to fall: t = sqrt(2h/g) ˜ sqrt(90/9.8) ˜ 3.0 s. Horizontal distance = v*t ˜ 20*3 = 60 m.",
      },
      {
        value: "D",
        label: "75 m",
        isCorrect: false,
        rationale: "Assumes t ˜ 3.75 s which exceeds actual fall time.",
      },
    ],
    explanation:
      "Horizontal motion is uniform; vertical free fall gives t ˜ 3.0 s leading to 60 m horizontal displacement.",
    references: [
      {
        label: "Halliday & Resnick, Fundamentals of Physics",
        citation: "Projectile Motion",
      },
    ],
  },
  {
    publicId: "imat-phys-0002",
    version: 1,
    isLatest: true,
    status: "live",
    questionType: "sba",
    difficulty: "medium",
    cognitiveLevel: "Analyze",
    skillType: "interpretation",
    calculatorPolicy: "basic",
    unitSystem: "SI",
    primaryLocale: "en",
    timeEstimateSec: 130,
    sectionSlug: "physics-maths",
    primaryTopicSlug: "physics-electricity",
    metadata: {
      blueprint: "IMAT-PHY-3",
      scenario: "electric_circuits",
    },
    tags: ["physics", "electricity"],
    stemBlocks: [
      {
        kind: "text",
        value:
          "Two resistors (4 O and 6 O) are connected in parallel across a 12 V battery with negligible internal resistance. What is the total current drawn from the battery?",
      },
    ],
    options: [
      {
        value: "A",
        label: "2.0 A",
        isCorrect: false,
        rationale: "Treats resistors as in series instead of parallel.",
      },
      {
        value: "B",
        label: "3.0 A",
        isCorrect: false,
        rationale: "Miscalculates equivalent resistance (should be 2.4 O).",
      },
      {
        value: "C",
        label: "5.0 A",
        isCorrect: true,
        rationale:
          "Equivalent resistance R = (1/4 + 1/6)^{-1} = 2.4 O; current I = V/R = 12/2.4 = 5 A.",
      },
      {
        value: "D",
        label: "7.5 A",
        isCorrect: false,
        rationale: "Adds individual currents incorrectly.",
      },
    ],
    explanation:
      "Parallel resistors combine via reciprocal addition; the resulting 2.4 O draws 5 A at 12 V.",
    references: [
      {
        label: "Serway Physics for Scientists and Engineers",
        citation: "DC Circuits",
      },
    ],
  },
  {
    publicId: "imat-phys-0003",
    version: 1,
    isLatest: true,
    status: "live",
    questionType: "data",
    difficulty: "medium",
    cognitiveLevel: "Analyze",
    skillType: "data_interpretation",
    calculatorPolicy: "basic",
    unitSystem: "SI",
    primaryLocale: "en",
    timeEstimateSec: 150,
    sectionSlug: "physics-maths",
    primaryTopicSlug: "maths-statistics-probability",
    metadata: {
      blueprint: "IMAT-MATH-2",
      format: "table_analysis",
    },
    tags: ["statistics", "probability"],
    stemBlocks: [
      {
        kind: "table",
        headers: ["Blood Type", "Number of Donors"],
        rows: [
          ["O", 120],
          ["A", 95],
          ["B", 40],
          ["AB", 20],
        ],
      },
      {
        kind: "text",
        value:
          "A hospital randomly selects two donors without replacement. What is the probability both have type O blood?",
      },
    ],
    options: [
      {
        value: "A",
        label: "(120/275) * (119/274)",
        isCorrect: true,
        rationale:
          "Total donors 275; probability is sequential product without replacement. Approx value 0.190.",
      },
      {
        value: "B",
        label: "(120/275) * (120/275)",
        isCorrect: false,
        rationale: "Uses with-replacement probability.",
      },
      {
        value: "C",
        label: "(120/275) * (155/274)",
        isCorrect: false,
        rationale: "Second factor counts all non-O donors incorrectly.",
      },
      {
        value: "D",
        label: "(120/275) + (119/274)",
        isCorrect: false,
        rationale: "Adds probabilities instead of multiplying.",
      },
    ],
    explanation:
      "Sampling without replacement requires multiplying sequential probabilities: (120/275)*(119/274).",
    references: [
      {
        label: "IMAT Official Sample Paper Probability Question",
        citation: "Probability Section",
      },
    ],
  },
];

function mapStimulusType(kind) {
  switch (kind) {
    case "image":
      return "image";
    case "table":
    case "chart":
    case "graph":
      return "data";
    default:
      return "vignette";
  }
}

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query("BEGIN");

    const examRes = await client.query(
      `INSERT INTO qbank_exams (slug, name, description, locale, default_unit_system, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (slug) DO UPDATE
       SET name = EXCLUDED.name,
           description = EXCLUDED.description,
           locale = EXCLUDED.locale,
           default_unit_system = EXCLUDED.default_unit_system,
           metadata = EXCLUDED.metadata,
           updated_at = now()
       RETURNING id`,
      [
        exam.slug,
        exam.name,
        exam.description,
        exam.locale,
        exam.defaultUnitSystem,
        JSON.stringify(exam.metadata),
      ]
    );
    const examId = examRes.rows[0].id;

    const sectionIdBySlug = new Map();
    for (const section of sections) {
      const res = await client.query(
        `INSERT INTO qbank_sections (exam_id, slug, name, description, order_index, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (exam_id, slug) DO UPDATE
         SET name = EXCLUDED.name,
             description = EXCLUDED.description,
             order_index = EXCLUDED.order_index,
             metadata = EXCLUDED.metadata,
             updated_at = now()
         RETURNING id`,
        [
          examId,
          section.slug,
          section.name,
          section.description,
          section.orderIndex,
          JSON.stringify(section.metadata ?? {}),
        ]
      );
      sectionIdBySlug.set(section.slug, res.rows[0].id);
    }

    const topicIdBySlug = new Map();
    for (const topic of topics) {
      const sectionId = sectionIdBySlug.get(topic.sectionSlug);
      if (!sectionId) throw new Error(`Missing section for topic ${topic.slug}`);
      const res = await client.query(
        `INSERT INTO qbank_topics (exam_id, section_id, parent_topic_id, slug, title, blueprint_code, depth, order_index, metadata)
         VALUES ($1, $2, NULL, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (exam_id, slug) DO UPDATE
         SET section_id = EXCLUDED.section_id,
             title = EXCLUDED.title,
             blueprint_code = EXCLUDED.blueprint_code,
             order_index = EXCLUDED.order_index,
             metadata = EXCLUDED.metadata,
             updated_at = now()
         RETURNING id`,
        [
          examId,
          sectionId,
          topic.slug,
          topic.title,
          topic.blueprintCode,
          topic.depth ?? 0,
          topic.orderIndex ?? 0,
          JSON.stringify(topic.metadata ?? {}),
        ]
      );
      topicIdBySlug.set(topic.slug, res.rows[0].id);
    }

    for (const question of questions) {
      const sectionId = sectionIdBySlug.get(question.sectionSlug);
      const topicId = topicIdBySlug.get(question.primaryTopicSlug);
      if (!sectionId) throw new Error(`Missing section for question ${question.publicId}`);
      if (!topicId) throw new Error(`Missing topic for question ${question.publicId}`);

      const questionRes = await client.query(
        `INSERT INTO qbank_questions (
           public_id, version, is_latest, status,
           exam_id, section_id, primary_topic_id,
           question_type, difficulty, cognitive_level, skill_type,
           calculator_policy, unit_system, primary_locale, time_estimate_sec,
           metadata, tags, security, irt_a, irt_b, irt_c, psychometrics
         ) VALUES (
           $1, $2, $3, $4,
           $5, $6, $7,
           $8, $9, $10, $11,
           $12, $13, $14, $15,
           $16, $17, $18, NULL, NULL, NULL, $19
         )
         ON CONFLICT (public_id, version) DO UPDATE
         SET is_latest = EXCLUDED.is_latest,
             status = EXCLUDED.status,
             exam_id = EXCLUDED.exam_id,
             section_id = EXCLUDED.section_id,
             primary_topic_id = EXCLUDED.primary_topic_id,
             question_type = EXCLUDED.question_type,
             difficulty = EXCLUDED.difficulty,
             cognitive_level = EXCLUDED.cognitive_level,
             skill_type = EXCLUDED.skill_type,
             calculator_policy = EXCLUDED.calculator_policy,
             unit_system = EXCLUDED.unit_system,
             primary_locale = EXCLUDED.primary_locale,
             time_estimate_sec = EXCLUDED.time_estimate_sec,
             metadata = EXCLUDED.metadata,
             tags = EXCLUDED.tags,
             security = EXCLUDED.security,
             psychometrics = EXCLUDED.psychometrics,
             updated_at = now()
         RETURNING id`,
        [
          question.publicId,
          question.version,
          question.isLatest,
          question.status,
          examId,
          sectionId,
          topicId,
          question.questionType,
          question.difficulty,
          question.cognitiveLevel,
          question.skillType,
          question.calculatorPolicy,
          question.unitSystem,
          question.primaryLocale,
          question.timeEstimateSec,
          JSON.stringify(question.metadata ?? {}),
          JSON.stringify(question.tags ?? []),
          JSON.stringify(question.security ?? {}),
          JSON.stringify(question.psychometrics ?? {}),
        ]
      );
      const questionId = questionRes.rows[0].id;

      await client.query(
        `DELETE FROM qbank_option_rationales WHERE option_id IN (SELECT id FROM qbank_question_options WHERE question_id = $1)`,
        [questionId]
      );
      await client.query(`DELETE FROM qbank_question_options WHERE question_id = $1`, [questionId]);
      await client.query(`DELETE FROM qbank_question_stimuli WHERE question_id = $1`, [questionId]);
      await client.query(`DELETE FROM qbank_question_explanations WHERE question_id = $1`, [questionId]);
      await client.query(`DELETE FROM qbank_question_references WHERE question_id = $1`, [questionId]);
      await client.query(
        `DELETE FROM qbank_question_topic_links WHERE question_id = $1 AND topic_id <> $2`,
        [questionId, topicId]
      );

      let orderIndex = 0;
      for (const block of question.stemBlocks ?? []) {
        await client.query(
          `INSERT INTO qbank_question_stimuli (question_id, locale, stimulus_type, content, order_index, metadata)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            questionId,
            question.primaryLocale,
            mapStimulusType(block.kind ?? "text"),
            JSON.stringify(block),
            orderIndex,
            JSON.stringify({}),
          ]
        );
        orderIndex += 1;
      }

      const optionInsertText = `
        INSERT INTO qbank_question_options (question_id, value, label, content, is_correct, order_index, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`;

      for (let idx = 0; idx < (question.options ?? []).length; idx += 1) {
        const option = question.options[idx];
        const optionRes = await client.query(optionInsertText, [
          questionId,
          option.value,
          option.label,
          JSON.stringify({ text: option.label }),
          option.isCorrect,
          idx,
          JSON.stringify(option.metadata ?? {}),
        ]);
        const optionId = optionRes.rows[0].id;
        await client.query(
          `INSERT INTO qbank_option_rationales (option_id, rationale_type, body, metadata)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (option_id, rationale_type) DO UPDATE
           SET body = EXCLUDED.body,
               metadata = EXCLUDED.metadata`,
          [
            optionId,
            option.isCorrect ? "why_correct" : "why_incorrect",
            JSON.stringify({ markdown: option.rationale ?? "" }),
            JSON.stringify({ tone: "academic" }),
          ]
        );
      }

      await client.query(
        `INSERT INTO qbank_question_explanations (question_id, explanation_type, locale, body, order_index, metadata)
         VALUES ($1, $2, $3, $4, 0, $5)
         ON CONFLICT (question_id, explanation_type, locale, order_index) DO UPDATE
         SET body = EXCLUDED.body,
             metadata = EXCLUDED.metadata,
             updated_at = now()`,
        [
          questionId,
          "primary",
          question.primaryLocale,
          JSON.stringify({ markdown: question.explanation ?? "" }),
          JSON.stringify({ readingTimeSec: 45 }),
        ]
      );

      for (let idx = 0; idx < (question.references ?? []).length; idx += 1) {
        const ref = question.references[idx];
        await client.query(
          `INSERT INTO qbank_question_references (question_id, label, url, citation, order_index, metadata)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [
            questionId,
            ref.label,
            ref.url ?? null,
            ref.citation ?? null,
            idx,
            JSON.stringify(ref.metadata ?? {}),
          ]
        );
      }

      await client.query(
        `INSERT INTO qbank_question_topic_links (question_id, topic_id, coverage_weight, metadata)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (question_id, topic_id) DO UPDATE
         SET coverage_weight = EXCLUDED.coverage_weight,
             metadata = EXCLUDED.metadata`,
        [questionId, topicId, 1, JSON.stringify({ primary: true })]
      );
    }

    await client.query("COMMIT");
    console.log(`Seeded IMAT exam with ${questions.length} questions across all sections.`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
