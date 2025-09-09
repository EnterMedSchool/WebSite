// IMAT 8-week study planner data (54 days + optional revision buffer)
// Each day has a title and a list of task strings. "rest" marks rest days.

export type PlannerDay = {
  day: number;
  title: string;
  tasks: string[];
  rest?: boolean;
};

export type ImatPlanner = {
  title: string;
  totalDays: number;
  days: PlannerDay[];
};

// Helper to compress repeated phrases
const ANKI = "Create Anki flashcards";
const DAILY = "Daily dose: general knowledge + logic";
const REVISE = "Revise previous days' flashcards";

export const IMAT_PLANNER: ImatPlanner = {
  title: "IMAT 8-Week Study Planner",
  // 54 scheduled days + 6 optional revision buffer days
  totalDays: 60,
  days: [
    // Week 1
    { day: 1, title: "DAY 1", tasks: [
      "Pearson’s Biology: Chapters 1–2 (pp. 52–64, 76–89). Solve Concept Checks",
      ANKI,
      DAILY,
    ]},
    { day: 2, title: "DAY 2", tasks: [
      REVISE,
      "Pearson’s Biology: Chapters 3–4 (pp. 92–101, 104–110). Solve Concept Checks",
      ANKI,
      DAILY,
    ]},
    { day: 3, title: "DAY 3", tasks: [
      REVISE,
      "Pearson’s Biology: Chapter 7 (pp. 163–195). Solve Concept Checks",
      "Cambridge Biology: Chapter 1 (pp. 2–26). Solve end‑of‑chapter questions",
      ANKI,
      DAILY,
    ]},
    { day: 4, title: "DAY 4", tasks: [
      REVISE,
      "Pearson’s Biology: Chapter 5 (pp. 114–139). Solve Concept Checks",
      "Cambridge Biology: Chapter 2 (pp. 27–52). Solve end‑of‑chapter questions",
      ANKI,
      DAILY,
    ]},
    { day: 5, title: "DAY 5", tasks: [
      REVISE,
      "Pearson’s Biology: Chapter 6 (pp. 141–161). Solve Concept Checks",
      "Cambridge Biology: Chapter 3 (pp. 53–71). Solve end‑of‑chapter questions",
      ANKI,
      DAILY,
    ]},
    { day: 6, title: "DAY 6", tasks: ["Rest day (optional light review)", DAILY], rest: true },
    { day: 7, title: "DAY 7", tasks: ["Rest day (optional light review)", DAILY], rest: true },

    // Week 2
    { day: 8, title: "DAY 8", tasks: [
      REVISE,
      "Pearson’s Biology: Chapter 8 (pp. 196–212). Solve Concept Checks",
      "Cambridge Biology: Chapter 4 (pp. 73–92). Solve end‑of‑chapter questions",
      ANKI,
      DAILY,
    ]},
    { day: 9, title: "DAY 9", tasks: [
      REVISE,
      "Pearson’s Biology: Chapter 16 (pp. 364–384). Solve Concept Checks",
      "Cambridge Biology: Chapter 6 (pp. 111–125). Solve end‑of‑chapter questions",
      ANKI,
      DAILY,
    ]},
    { day: 10, title: "DAY 10", tasks: [
      REVISE,
      "Pearson’s Biology: Chapter 12 (pp. 284–302). Solve Concept Checks",
      "Cambridge Biology: Chapter 5 (pp. 94–109). Solve end‑of‑chapter questions",
      ANKI,
      DAILY,
    ]},
    { day: 11, title: "DAY 11", tasks: [
      `${REVISE} (recommended to revise both Day 9 and 10)`,
      "Pearson’s Biology: Chapter 13 (pp. 304–318). Solve Concept Checks",
      ANKI,
      DAILY,
    ]},
    { day: 12, title: "DAY 12", tasks: [
      REVISE,
      "Pearson’s Biology: Chapters 9, 40, and 41 (pp. 214–232, 925–967). Solve Concept Checks",
      ANKI,
      DAILY,
    ]},
    { day: 13, title: "DAY 13", tasks: ["Rest day (optional light review)", DAILY], rest: true },
    { day: 14, title: "DAY 14", tasks: ["Rest day (optional light review)", DAILY], rest: true },

    // Week 3
    { day: 15, title: "DAY 15", tasks: [
      REVISE,
      "Pearson’s Biology: Chapter 43 (pp. 995–1011). Solve Concept Checks",
      "Cambridge Biology: Chapter 8 (pp. 157–184, 133–135). Solve end‑of‑chapter questions",
      ANKI,
      DAILY,
    ]},
    { day: 16, title: "DAY 16", tasks: [
      REVISE,
      "Pearson’s Biology: Chapter 43 (pp. 1013–1023). Solve Concept Checks",
      "Cambridge Biology: Chapter 9 (pp. 185–190, 194–198). Solve end‑of‑chapter questions",
      ANKI,
      DAILY,
    ]},
    { day: 17, title: "DAY 17", tasks: [
      REVISE,
      "Pearson’s Biology: Chapter 42 (pp. 972–991). Solve Concept Checks",
      ANKI,
      DAILY,
    ]},
    { day: 18, title: "DAY 18", tasks: [
      REVISE,
      "Pearson’s Biology: Chapter 44 (pp. 1027–1044). Solve Concept Checks",
      ANKI,
      DAILY,
    ]},
    { day: 19, title: "DAY 19", tasks: [
      REVISE,
      "Pearson’s Biology: Chapter 49 (pp. 1141–1160). Solve Concept Checks",
      ANKI,
      DAILY,
    ]},
    { day: 20, title: "DAY 20", tasks: ["Rest day (optional light review)", DAILY], rest: true },
    { day: 21, title: "DAY 21", tasks: ["Rest day (optional light review)", DAILY], rest: true },

    // Week 4
    { day: 22, title: "DAY 22", tasks: [
      REVISE,
      "Pearson’s Biology: Chapter 50 (pp. 1163–1191). Solve Concept Checks",
      ANKI,
      DAILY,
    ]},
    { day: 23, title: "DAY 23", tasks: [
      REVISE,
      "Pearson’s Biology: Chapter 47 (pp. 1098–1120). Solve Concept Checks",
      "Cambridge Biology: Chapter 10 (pp. 198–221). Solve end‑of‑chapter questions",
      ANKI,
      DAILY,
    ]},
    { day: 24, title: "DAY 24", tasks: [
      REVISE,
      "Pearson’s Biology: Chapter 10 (pp. 236–255). Solve Concept Checks",
      "Cambridge Biology: Chapter 12 (pp. 268–285). Solve end‑of‑chapter questions",
      ANKI,
      DAILY,
    ]},
    { day: 25, title: "DAY 25", tasks: [
      REVISE,
      "Pearson’s Biology: Chapter 11 (pp. 259–278). Solve Concept Checks",
      "Cambridge Biology: Chapter 13 (pp. 133–135, 286–298). Solve end‑of‑chapter questions",
      ANKI,
      DAILY,
    ]},
    { day: 26, title: "DAY 26", tasks: [
      REVISE,
      "Pearson’s Biology: Chapter 48 (pp. 1123–1136). Solve Concept Checks",
      "Cambridge Biology: Chapter 15 (pp. 330–352, 357–363) — skip plants. Solve end‑of‑chapter questions",
      ANKI,
      DAILY,
    ]},
    { day: 27, title: "DAY 27", tasks: ["Rest day (optional light review)", DAILY], rest: true },
    { day: 28, title: "DAY 28", tasks: ["Rest day (optional light review)", DAILY], rest: true },

    // Week 5
    { day: 29, title: "DAY 29", tasks: [
      REVISE,
      "Pearson’s Biology: Chapter 14 (pp. 319–338). Solve Concept Checks",
      "Cambridge Biology: Chapter 16 (pp. 364–396). Solve end‑of‑chapter questions",
      ANKI,
      DAILY,
    ]},
    { day: 30, title: "DAY 30", tasks: [
      REVISE,
      "Pearson’s Biology: Chapter 45 (pp. 1049–1069). Solve Concept Checks (skip embryo and structure of flowers)",
      ANKI,
      DAILY,
    ]},
    { day: 31, title: "DAY 31", tasks: [
      REVISE,
      "Pearson’s Biology: Chapter 21 (pp. 500–515). Solve Concept Checks",
      "Cambridge Biology: Chapter 17 (pp. 397–422). Solve end‑of‑chapter questions",
      ANKI,
      DAILY,
    ]},
    { day: 32, title: "DAY 32", tasks: [
      REVISE,
      "Pearson’s Biology: Chapters 22–23 (pp. 519–555). Solve Concept Checks",
      ANKI,
      DAILY,
    ]},
    { day: 33, title: "DAY 33", tasks: [
      REVISE,
      "Pearson’s Biology: Chapters 24 and 26 (pp. 560–602). Solve Concept Checks",
      ANKI,
      DAILY,
    ]},
    { day: 34, title: "DAY 34", tasks: ["Rest day (optional light review)", DAILY], rest: true },
    { day: 35, title: "DAY 35", tasks: ["Rest day (optional light review)", DAILY], rest: true },

    // Week 6 (Revision + wrap Biology)
    { day: 36, title: "DAY 36", tasks: [
      REVISE,
      "Pearson’s Biology: Chapter 19 (pp. 447–470). Solve Concept Checks",
      "Cambridge Biology: Chapter 19 (pp. 440, 463–488). Solve end‑of‑chapter questions",
      ANKI,
      DAILY,
    ]},
    { day: 37, title: "DAY 37", tasks: [
      REVISE,
      "Pearson’s Biology: Chapters 17, 18, and 26 (pp. 385–442, 608–622). Solve Concept Checks",
      ANKI,
      DAILY,
    ]},
    { day: 38, title: "DAY 38 — REVISION", tasks: [
      "Verify and reexamine what you’ve learned",
      "Study Anki flashcards and summarise accomplishments",
      "Review the syllabus to ensure full coverage",
    ]},
    { day: 39, title: "DAY 39 — REVISION", tasks: [
      "Gain different visuals and perspectives for each topic",
      "Recommended channels: Ninja Nerd, Armando Biology, Amoeba Sisters, Khan Academy, Organic Chemistry Tutor, AK Lectures",
    ]},
    { day: 40, title: "DAY 40 — REVISION", tasks: [
      "You’ve completed the IMAT Biology syllabus",
      "Ensure confidence in your knowledge — Chemistry starts next",
    ]},

    // Week 7 (Chemistry)
    { day: 41, title: "DAY 41", tasks: [
      "Cambridge IGCSE Chemistry: Chapters 1–2 (pp. 2–24). Solve end‑of‑chapter questions (skip chromatography)",
      ANKI,
      DAILY,
    ]},
    { day: 42, title: "DAY 42", tasks: [
      "Cambridge IGCSE Chemistry: Chapter 3 (pp. 26–40). Solve end‑of‑chapter questions",
      "Pearson’s Chemistry: Chapter 2 (pp. 58–85). Solve exercises",
      ANKI,
      DAILY,
    ]},
    { day: 43, title: "DAY 43", tasks: [
      "Cambridge IGCSE Chemistry: Chapter 4 (pp. 42–60). Solve end‑of‑chapter questions",
      "Pearson’s Chemistry: Chapter 4 (pp. 140–199). Solve exercises",
      ANKI,
      DAILY,
    ]},
    { day: 44, title: "DAY 44", tasks: [
      "Cambridge IGCSE Chemistry: Chapter 13 (pp. 178–186). Solve end‑of‑chapter questions",
      "Pearson’s Chemistry: Chapter 3 (pp. 98–130). Solve exercises",
      ANKI,
      DAILY,
    ]},
    { day: 45, title: "DAY 45", tasks: [
      "Cambridge IGCSE Chemistry: Chapter 4 (pp. 72–86). Solve end‑of‑chapter questions",
      "Pearson’s Chemistry: Chapter 1 (pp. 3–28). Solve exercises",
      ANKI,
      DAILY,
    ]},
    { day: 46, title: "DAY 46", tasks: ["Rest day (optional light review)", DAILY], rest: true },
    { day: 47, title: "DAY 47", tasks: ["Rest day (optional light review)", DAILY], rest: true },

    // Final Week
    { day: 48, title: "DAY 48", tasks: [
      "Cambridge IGCSE Chemistry: Chapters 5 and 7 (pp. 62–70, 88–96, 104–107). Solve end‑of‑chapter questions",
      "Pearson’s Chemistry: Chapter 9 (pp. 406–425). Solve exercises",
      ANKI,
      DAILY,
    ]},
    { day: 49, title: "DAY 49", tasks: [
      "Cambridge IGCSE Chemistry: Chapter 9 (skip 9.4) (pp. 110–124). Solve end‑of‑chapter questions",
      "Pearson’s Chemistry: Chapters 7 and 5 (pp. 311–330, 211–247). Solve exercises",
      ANKI,
      DAILY,
    ]},
    { day: 50, title: "DAY 50", tasks: [
      "Cambridge IGCSE Chemistry: Chapter 10 (pp. 126–142). Solve end‑of‑chapter questions",
      "Pearson’s Chemistry: Chapter 6 (pp. 272–300). Solve exercises",
      ANKI,
      DAILY,
    ]},
    { day: 51, title: "DAY 51", tasks: [
      "(Recommended to revise Day 44)",
      "Cambridge IGCSE Chemistry: Chapter 16 (skip 16.3) (pp. 220–238, 214–215). Solve end‑of‑chapter questions",
      ANKI,
      DAILY,
    ]},
    { day: 52, title: "DAY 52", tasks: [
      "Cambridge IGCSE Chemistry: Chapter 17.3 to 18 (pp. 244–272). Solve end‑of‑chapter questions",
      "Pearson’s Chemistry: Chapter 10 (pp. 464–514). Solve exercises",
      ANKI,
      DAILY,
    ]},
    { day: 53, title: "DAY 53", tasks: ["Rest day (optional light review)", DAILY], rest: true },
    { day: 54, title: "DAY 54", tasks: ["Rest day (optional light review)", DAILY], rest: true },

    // Optional revision buffer (55–60)
    { day: 55, title: "DAY 55 — REVISION (Chemistry)", tasks: [
      "Verify and reexamine what you’ve learned",
      "Study Anki flashcards and summarise accomplishments",
      "Review syllabus coverage (Chemistry)",
    ]},
    { day: 56, title: "DAY 56 — REVISION (Chemistry)", tasks: [
      "Target weak areas; review notes and worked examples",
      "Timed practice on priority topics",
    ]},
    { day: 57, title: "DAY 57 — PRACTICE", tasks: [
      "Mixed problem sets under time constraints",
      "Error log: analyse mistakes and re‑attempt",
    ]},
    { day: 58, title: "DAY 58 — MOCK", tasks: [
      "Full‑length mock under exam conditions",
      "Analyse results and patch gaps",
    ]},
    { day: 59, title: "DAY 59 — LIGHT REVIEW", tasks: [
      "Key formulas, reactions, and high‑yield summaries",
      "Light practice and rest early",
    ]},
    { day: 60, title: "DAY 60 — FINAL TOUCH", tasks: [
      "Final confidence check and logistics",
      "Be proud of your progress!",
    ]},
  ],
};

