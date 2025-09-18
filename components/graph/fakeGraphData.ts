export type MindmapNode = {
  id: string;
  label: string;
  slug: string;
  courseId: number;
  area: string;
  tier: number;
  summary: string;
  minutes: number;
  color: string;
  dimColor: string;
};

export type MindmapEdge = {
  id: string;
  source: string;
  target: string;
  type: "scaffold" | "bridge";
};

export type MindmapGraph = {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
};

type TopicSpec = {
  slug: string;
  title: string;
  summary?: string;
  minutes?: number;
  requires?: string[];
};

type TrackSpec = {
  key: string;
  title: string;
  courseId: number;
  color: string;
  levels: TopicSpec[][];
};

function mixWithAlpha(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const TRACKS: TrackSpec[] = [
  {
    key: "bio",
    title: "Core Biology Foundations",
    courseId: 101,
    color: "#22c55e",
    levels: [
      [
        { slug: "bio-orientation", title: "Orientation to the Learning Graph" },
        { slug: "bio-scientific-method", title: "Scientific Thinking & Experiment Design" }
      ],
      [
        { slug: "bio-cell-structure", title: "Cells & Organelles Primer" },
        { slug: "bio-membrane-transport", title: "Membrane Transport Mechanisms" },
        { slug: "bio-metabolism-overview", title: "Metabolism Overview" }
      ],
      [
        { slug: "bio-dna-replication", title: "DNA Replication Essentials" },
        { slug: "bio-gene-expression", title: "Gene Expression Pipeline" },
        { slug: "bio-cell-cycle", title: "Cell Cycle Checkpoints" }
      ],
      [
        { slug: "bio-signal-transduction", title: "Cell Signaling Networks" },
        { slug: "bio-cell-communication", title: "Intercellular Communication" },
        { slug: "bio-apoptosis", title: "Apoptosis & Cell Fate Decisions" }
      ],
      [
        { slug: "bio-microbiology-foundations", title: "Microbiology Foundations" },
        { slug: "bio-tissue-organization", title: "Tissue Organization & Histology" },
        { slug: "bio-host-pathogen", title: "Host–Pathogen Interactions" }
      ],
      [
        { slug: "bio-immune-primers", title: "Immune System Primer" },
        { slug: "bio-lab-interpretation", title: "Baseline Lab Interpretation" },
        { slug: "bio-problem-solving", title: "Biology Problem-Solving Drills" }
      ]
    ]
  },
  {
    key: "chem",
    title: "Chemistry & Biochemistry",
    courseId: 102,
    color: "#6366f1",
    levels: [
      [
        { slug: "chem-math-refresh", title: "Math & Measurement Refresher" },
        { slug: "chem-atomic-structure", title: "Atomic Structure Basics" },
        { slug: "chem-periodic-overview", title: "Periodic Table Orientation" }
      ],
      [
        { slug: "chem-periodic-trends", title: "Periodic Trends & Bonding" },
        { slug: "chem-chemical-bonding", title: "Chemical Bonding Profiles" },
        { slug: "chem-stoichiometry", title: "Stoichiometry Practice Sets" }
      ],
      [
        { slug: "chem-thermodynamics", title: "Thermodynamics & Energetics" },
        { slug: "chem-kinetics", title: "Reaction Kinetics" },
        { slug: "chem-equilibrium", title: "Dynamic Equilibrium" }
      ],
      [
        { slug: "chem-acid-base", title: "Acid–Base Systems" },
        { slug: "chem-solutions", title: "Solutions & Concentrations" },
        { slug: "chem-redox", title: "Redox & Electrochemistry" }
      ],
      [
        { slug: "chem-biochem-building", title: "Biochemical Building Blocks", requires: ["bio-metabolism-overview"] },
        { slug: "chem-protein-structure", title: "Protein Structure & Function", requires: ["chem-biochem-building"] },
        { slug: "chem-enzyme-kinetics", title: "Enzyme Kinetics Applications", requires: ["chem-thermodynamics"] }
      ],
      [
        { slug: "chem-glycolysis", title: "Glycolysis Control Points", requires: ["chem-enzyme-kinetics"] },
        { slug: "chem-oxidative-phosphorylation", title: "Oxidative Phosphorylation", requires: ["chem-glycolysis"] },
        { slug: "chem-metabolic-integration", title: "Metabolic Integration Cases", requires: ["chem-oxidative-phosphorylation"] }
      ]
    ]
  },
  {
    key: "phys",
    title: "Systems Physiology",
    courseId: 103,
    color: "#0ea5e9",
    levels: [
      [
        { slug: "phys-orientation", title: "Physiology Orientation" },
        { slug: "phys-homeostasis", title: "Homeostasis Overview" }
      ],
      [
        { slug: "phys-membrane-potentials", title: "Membrane Potentials", requires: ["bio-membrane-transport"] },
        { slug: "phys-neuronal-signaling", title: "Neuronal Signaling", requires: ["phys-membrane-potentials"] },
        { slug: "phys-muscle-physiology", title: "Muscle Physiology", requires: ["phys-membrane-potentials"] }
      ],
      [
        { slug: "phys-respiratory-basics", title: "Respiratory Basics" },
        { slug: "phys-cardiac-cells", title: "Cardiac Cellular Physiology", requires: ["chem-solutions"] },
        { slug: "phys-renal-overview", title: "Renal Filtration Overview" }
      ],
      [
        { slug: "phys-cardiovascular-circuit", title: "Cardiovascular Circuit Dynamics", requires: ["phys-cardiac-cells"] },
        { slug: "phys-blood-pressure", title: "Blood Pressure Regulation", requires: ["phys-cardiovascular-circuit"] },
        { slug: "phys-respiratory-control", title: "Ventilation Control", requires: ["phys-respiratory-basics"] }
      ],
      [
        { slug: "phys-fluid-balance", title: "Fluid Compartments & Balance", requires: ["phys-renal-overview"] },
        { slug: "phys-endocrine-integration", title: "Endocrine Integration", requires: ["phys-homeostasis"] },
        { slug: "phys-coagulation-hemodynamics", title: "Hemodynamics of Coagulation", requires: ["immune-platelet-function"] }
      ],
      [
        { slug: "phys-shock", title: "Systemic Shock Physiology", requires: ["phys-blood-pressure", "immune-inflammation"] },
        { slug: "phys-microcirculation", title: "Microcirculation in Crisis", requires: ["phys-cardiovascular-circuit"] },
        { slug: "phys-critical-care", title: "Critical Care Physiology", requires: ["phys-respiratory-control", "phys-fluid-balance"] }
      ]
    ]
  },
  {
    key: "immune",
    title: "Immunology & Hemostasis",
    courseId: 104,
    color: "#f97316",
    levels: [
      [
        { slug: "immune-barriers", title: "Physical & Chemical Barriers" },
        { slug: "immune-innate", title: "Innate Immune Cells" }
      ],
      [
        { slug: "immune-adaptive", title: "Adaptive Immunity Overview", requires: ["immune-innate"] },
        { slug: "immune-lymphoid-organs", title: "Lymphoid Organs Tour" },
        { slug: "immune-clonal-selection", title: "Clonal Selection Mechanics", requires: ["immune-adaptive"] }
      ],
      [
        { slug: "immune-immunoglobulins", title: "Immunoglobulin Classes", requires: ["chem-protein-structure"] },
        { slug: "immune-mhc", title: "MHC & Antigen Presentation", requires: ["immune-adaptive"] },
        { slug: "immune-complement", title: "Complement System", requires: ["immune-innate"] }
      ],
      [
        { slug: "immune-inflammation", title: "Inflammation Mediators", requires: ["bio-signal-transduction"] },
        { slug: "immune-cytokines", title: "Cytokine Networks", requires: ["immune-inflammation"] },
        { slug: "immune-hypersensitivity", title: "Hypersensitivity Patterns", requires: ["immune-immunoglobulins"] }
      ],
      [
        { slug: "immune-hematopoiesis", title: "Hematopoiesis Overview", requires: ["bio-tissue-organization"] },
        { slug: "immune-platelet-function", title: "Platelet Function Essentials", requires: ["chem-biochem-building"] },
        { slug: "immune-coagulation-cascade", title: "Coagulation Cascade Deep Dive", requires: ["chem-glycolysis", "phys-coagulation-hemodynamics"] }
      ],
      [
        { slug: "immune-sepsis", title: "Sepsis Pathophysiology", requires: ["immune-inflammation", "phys-shock"] },
        { slug: "immune-coagulopathy", title: "Coagulopathy Patterns", requires: ["immune-coagulation-cascade"] },
        { slug: "immune-hyperinflammation", title: "Hyperinflammation Syndromes", requires: ["immune-cytokines"] }
      ]
    ]
  },
  {
    key: "clinical",
    title: "Clinical Integration",
    courseId: 105,
    color: "#facc15",
    levels: [
      [
        { slug: "clinical-case-approach", title: "Case-Based Reasoning Skills" },
        { slug: "clinical-labs", title: "Core Laboratory Panels" }
      ],
      [
        { slug: "clinical-history", title: "Targeted History Taking", requires: ["clinical-case-approach"] },
        { slug: "clinical-physical", title: "Focused Physical Examination", requires: ["clinical-case-approach"] },
        { slug: "clinical-triage", title: "Emergency Triage Systems", requires: ["phys-homeostasis"] }
      ],
      [
        { slug: "clinical-anemia-workup", title: "Anemia Workup Strategy", requires: ["immune-hematopoiesis"] },
        { slug: "clinical-bleeding-evaluation", title: "Bleeding Evaluation Toolkit", requires: ["immune-platelet-function"] },
        { slug: "clinical-infection-risk", title: "Infection Risk Assessment", requires: ["immune-innate"] }
      ],
      [
        { slug: "clinical-critical-values", title: "Critical Lab Values", requires: ["clinical-labs"] },
        { slug: "clinical-hemostasis-clinic", title: "Hemostasis in the Clinic", requires: ["immune-coagulation-cascade"] },
        { slug: "clinical-ic-management", title: "Intensive Care Monitoring", requires: ["phys-critical-care"] }
      ],
      [
        { slug: "clinical-massive-transfusion", title: "Massive Transfusion Protocols", requires: ["clinical-hemostasis-clinic"] },
        { slug: "clinical-multi-organ-dysfunction", title: "Multi-Organ Dysfunction Management", requires: ["phys-shock", "immune-sepsis"] },
        { slug: "clinical-vascular-failure", title: "Vascular Failure Rescue", requires: ["phys-microcirculation"] }
      ],
      [
        { slug: "clinical-dic-overview", title: "DIC Overview & Patterns", requires: ["immune-coagulopathy"] },
        { slug: "clinical-dic", title: "Disseminated Intravascular Coagulation Pathway", requires: ["clinical-dic-overview", "clinical-massive-transfusion", "immune-hyperinflammation", "phys-shock"] },
        { slug: "clinical-recovery-pathways", title: "Recovery Pathways & Follow-up", requires: ["clinical-multi-organ-dysfunction"] }
      ]
    ]
  }
];

export function buildFakeMindmap(): MindmapGraph {
  const nodes: MindmapNode[] = [];
  const edges: MindmapEdge[] = [];
  const slugToId = new Map<string, string>();
  const pendingBridges: Array<{ from: string; to: string }> = [];
  const seenEdge = new Set<string>();
  let edgeIndex = 0;

  for (const track of TRACKS) {
    let previousLevelIds: string[] = [];
    for (let tier = 0; tier < track.levels.length; tier++) {
      const level = track.levels[tier];
      const currentLevelIds: string[] = [];
      for (let i = 0; i < level.length; i++) {
        const topic = level[i];
        const nodeId = `${track.key}-${tier}-${i}`;
        const summary = topic.summary ?? `${topic.title} within ${track.title}. Focus on core mechanisms and IMAT-style connections.`;
        const minutes = topic.minutes ?? 25 + tier * 10;

        nodes.push({
          id: nodeId,
          label: topic.title,
          slug: topic.slug,
          courseId: track.courseId,
          area: track.title,
          tier,
          summary,
          minutes,
          color: track.color,
          dimColor: mixWithAlpha(track.color, 0.18)
        });

        slugToId.set(topic.slug, nodeId);
        currentLevelIds.push(nodeId);

        if (topic.requires?.length) {
          for (const req of topic.requires) pendingBridges.push({ from: req, to: topic.slug });
        }

        if (previousLevelIds.length) {
          const pickCount = Math.min(2, previousLevelIds.length);
          for (let k = 0; k < pickCount; k++) {
            const sourceId = previousLevelIds[(i + k) % previousLevelIds.length];
            const key = `${sourceId}->${nodeId}`;
            if (seenEdge.has(key)) continue;
            seenEdge.add(key);
            edges.push({ id: `edge-${edgeIndex++}`, source: sourceId, target: nodeId, type: "scaffold" });
          }
        }
      }
      previousLevelIds = currentLevelIds;
    }
  }

  for (const bridge of pendingBridges) {
    const sourceId = slugToId.get(bridge.from);
    const targetId = slugToId.get(bridge.to);
    if (!sourceId || !targetId) continue;
    const key = `${sourceId}->${targetId}`;
    if (seenEdge.has(key)) continue;
    seenEdge.add(key);
    edges.push({ id: `edge-${edgeIndex++}`, source: sourceId, target: targetId, type: "bridge" });
  }

  return { nodes, edges };
}

export type { TrackSpec };
export { TRACKS };
