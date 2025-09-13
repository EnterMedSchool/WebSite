export type Flashcard = {
  id: string;
  front: string;
  back: string;
};

export const dicDeck: Flashcard[] = [
  {
    id: "dic-1",
    front: "What is disseminated intravascular coagulation (DIC)?",
    back: "A systemic process with widespread activation of coagulation leading to microthrombi, consumption of platelets/coagulation factors, and a bleeding tendency.",
  },
  {
    id: "dic-2",
    front: "Name common triggers of DIC.",
    back: "Sepsis (especially gram-negative), severe trauma/burns, obstetric complications (placental abruption, amniotic fluid embolism), malignancy (APL, adenocarcinoma), massive transfusion, shock, snake bites.",
  },
  {
    id: "dic-3",
    front: "Core lab pattern seen in DIC?",
    back: "Prolonged PT and aPTT, thrombocytopenia, elevated D-dimer/FDPs, and low fibrinogen; often hemolytic anemia with schistocytes.",
  },
  {
    id: "dic-4",
    front: "What peripheral smear finding supports DIC?",
    back: "Schistocytes due to microangiopathic hemolytic anemia from fibrin-rich microthrombi.",
  },
  {
    id: "dic-5",
    front: "First principle of DIC management?",
    back: "Treat the underlying cause (e.g., control sepsis, manage obstetric source). Supportive care as needed.",
  },
  {
    id: "dic-6",
    front: "When to give FFP and platelets in DIC?",
    back: "If bleeding or high-risk procedures with significant coagulopathy and thrombocytopenia. FFP replaces clotting factors; platelets for counts typically <10–20k (higher if bleeding/procedure).",
  },
  {
    id: "dic-7",
    front: "Role of cryoprecipitate in DIC?",
    back: "Use for hypofibrinogenemia (e.g., fibrinogen <100–150 mg/dL). Cryo provides fibrinogen, vWF, and factor VIII/XIII.",
  },
  {
    id: "dic-8",
    front: "When might heparin be considered in DIC?",
    back: "In selected cases of chronic/low-grade DIC with predominant thrombosis and minimal bleeding risk; decision is individualized.",
  },
  {
    id: "dic-9",
    front: "Differentiate DIC from TTP using labs.",
    back: "DIC: PT/aPTT prolonged, fibrinogen low, D-dimer high. TTP: PT/aPTT usually normal; due to ADAMTS13 deficiency; prominent neuro/renal findings.",
  },
  {
    id: "dic-10",
    front: "What does an elevated D-dimer indicate in DIC?",
    back: "Increased fibrin formation and breakdown; reflects plasmin-mediated degradation of cross-linked fibrin in microthrombi.",
  },
];

