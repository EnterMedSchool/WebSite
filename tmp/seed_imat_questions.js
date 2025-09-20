const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_YgJuKaCj6ny3@ep-bold-mode-a2sorydk-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const sections = [
  {
    slug: 'logical-reasoning',
    name: 'Logical Reasoning & Problem Solving',
    description: 'Critical reasoning, arguments, pattern puzzles, and situational logic.',
    orderIndex: 0,
  },
  {
    slug: 'general-knowledge',
    name: 'General Knowledge',
    description: 'Humanities, current affairs, cultural literacy.',
    orderIndex: 1,
  },
  {
    slug: 'biology',
    name: 'Biology',
    description: 'Cell biology, physiology, genetics, evolution, and ecology.',
    orderIndex: 2,
  },
  {
    slug: 'chemistry',
    name: 'Chemistry',
    description: 'General, organic, and physical chemistry essentials.',
    orderIndex: 3,
  },
  {
    slug: 'physics-maths',
    name: 'Physics & Mathematics',
    description: 'Mechanics, waves, electricity, statistics, and applied maths.',
    orderIndex: 4,
  },
];

const topics = [
  {
    slug: 'logical-argument-analysis',
    title: 'Argument Analysis',
    sectionSlug: 'logical-reasoning',
    blueprintCode: 'IMAT-LR-1',
    orderIndex: 0,
  },
  {
    slug: 'logical-syllogisms',
    title: 'Syllogisms & Deduction',
    sectionSlug: 'logical-reasoning',
    blueprintCode: 'IMAT-LR-2',
    orderIndex: 1,
  },
  {
    slug: 'biology-cell-structure',
    title: 'Cell Structure & Function',
    sectionSlug: 'biology',
    blueprintCode: 'IMAT-BIO-1',
    orderIndex: 0,
  },
  {
    slug: 'biology-genetics',
    title: 'Genetics & Inheritance',
    sectionSlug: 'biology',
    blueprintCode: 'IMAT-BIO-3',
    orderIndex: 1,
  },
  {
    slug: 'chemistry-equilibria',
    title: 'Chemical Equilibria',
    sectionSlug: 'chemistry',
    blueprintCode: 'IMAT-CHEM-2',
    orderIndex: 0,
  },
  {
    slug: 'physics-kinematics',
    title: 'Kinematics & Dynamics',
    sectionSlug: 'physics-maths',
    blueprintCode: 'IMAT-PHY-1',
    orderIndex: 0,
  },
];

const questions = [
  {
    publicId: 'imat-lr-0001',
    version: 1,
    isLatest: true,
    status: 'live',
    sectionSlug: 'logical-reasoning',
    primaryTopicSlug: 'logical-syllogisms',
    questionType: 'sba',
    difficulty: 'medium',
    cognitiveLevel: 'Analyze',
    skillType: 'logical_reasoning',
    calculatorPolicy: 'disallowed',
    unitSystem: 'SI',
    primaryLocale: 'en',
    timeEstimateSec: 90,
    metadata: {
      blueprint: 'IMAT-LR-2',
      examYear: 2025,
      tags: ['logic', 'syllogism'],
    },
    tags: ['logic', 'pattern'],
    stemBlocks: [
      {
        kind: 'text',
        value: 'All of the fellows in the Aurora research cohort are physicians. Some of the physicians in the cohort are epidemiologists. Lucia is a fellow in the Aurora research cohort.'
      },
      {
        kind: 'text',
        value: 'Which conclusion is best supported?' 
      }
    ],
    options: [
      {
        value: 'A',
        label: 'Lucia is both a physician and an epidemiologist.',
        isCorrect: false,
        rationale: 'The premises only guarantee she is a physician, not that she falls into the subset that are epidemiologists.'
      },
      {
        value: 'B',
        label: 'Lucia is a physician but may or may not be an epidemiologist.',
        isCorrect: true,
        rationale: 'Being a fellow implies she is a physician. The statement about epidemiologists is a partial subset, so her status there is undetermined.'
      },
      {
        value: 'C',
        label: 'Lucia is not an epidemiologist.',
        isCorrect: false,
        rationale: 'There is no information that excludes her from the epidemiologist subset.'
      },
      {
        value: 'D',
        label: 'Lucia is an epidemiologist but may not be a physician.',
        isCorrect: false,
        rationale: 'All fellows are physicians, so this contradicts the first premise.'
      }
    ],
    explanation: 'The universal statement forces Lucia into the physician group. The second premise is existential: some physicians are epidemiologists, but not necessarily all. Therefore the only defensible conclusion is that Lucia is a physician, with uncertainty about epidemiology.',
    references: [
      {
        label: 'IMAT Spec: Logical Reasoning',
        url: 'https://www.cambridgeenglish.org/qualifications/medical-admissions/imat/format/'
      }
    ]
  },
  {
    publicId: 'imat-bio-0001',
    version: 1,
    isLatest: true,
    status: 'live',
    sectionSlug: 'biology',
    primaryTopicSlug: 'biology-cell-structure',
    questionType: 'sba',
    difficulty: 'easy',
    cognitiveLevel: 'Understand',
    skillType: 'recall',
    calculatorPolicy: 'disallowed',
    unitSystem: 'SI',
    primaryLocale: 'en',
    timeEstimateSec: 75,
    metadata: {
      blueprint: 'IMAT-BIO-1',
      tags: ['cell biology', 'organelles'],
    },
    tags: ['biology', 'cell'],
    stemBlocks: [
      {
        kind: 'text',
        value: 'Which organelle is primarily responsible for modifying and packaging proteins for secretion from eukaryotic cells?'
      }
    ],
    options: [
      {
        value: 'A',
        label: 'Golgi apparatus',
        isCorrect: true,
        rationale: 'Golgi stacks process, modify, and ship proteins toward secretory vesicles.'
      },
      {
        value: 'B',
        label: 'Smooth endoplasmic reticulum',
        isCorrect: false,
        rationale: 'SER focuses on lipid synthesis and detoxification, not packaging proteins for export.'
      },
      {
        value: 'C',
        label: 'Mitochondrion',
        isCorrect: false,
        rationale: 'Mitochondria generate ATP through oxidative phosphorylation.'
      },
      {
        value: 'D',
        label: 'Lysosome',
        isCorrect: false,
        rationale: 'Lysosomes digest macromolecules and cellular debris.'
      }
    ],
    explanation: 'Proteins synthesized in the rough ER are trafficked to the Golgi apparatus where they undergo post-translational modifications and are sorted into vesicles destined for secretion or other organelles.',
    references: [
      {
        label: 'Alberts et al., Molecular Biology of the Cell (7th ed.)',
        citation: 'Chapter 13, Membrane Trafficking'
      }
    ]
  },
  {
    publicId: 'imat-chem-0001',
    version: 1,
    isLatest: true,
    status: 'live',
    sectionSlug: 'chemistry',
    primaryTopicSlug: 'chemistry-equilibria',
    questionType: 'sba',
    difficulty: 'medium',
    cognitiveLevel: 'Apply',
    skillType: 'calculation',
    calculatorPolicy: 'basic',
    unitSystem: 'SI',
    primaryLocale: 'en',
    timeEstimateSec: 120,
    metadata: {
      blueprint: 'IMAT-CHEM-2',
      tags: ['equilibrium', 'Le Chatelier'],
    },
    tags: ['chemistry', 'equilibrium'],
    stemBlocks: [
      {
        kind: 'text',
        value: 'At 700 K, the reaction N2(g) + 3H2(g) ? 2NH3(g) is at equilibrium in a sealed container. The mixture is compressed, halving the volume while temperature is held constant. What qualitative change occurs to the amount of NH3?'
      }
    ],
    options: [
      {
        value: 'A',
        label: 'The amount of NH3 increases.',
        isCorrect: true,
        rationale: 'Compression favors the side with fewer moles of gas. The forward reaction produces 2 mol gas from 4 mol, so equilibrium shifts to NH3.'
      },
      {
        value: 'B',
        label: 'The amount of NH3 decreases.',
        isCorrect: false,
        rationale: 'A shift to the reactant side would increase total moles, opposing the imposed pressure change.'
      },
      {
        value: 'C',
        label: 'No net change in NH3 occurs.',
        isCorrect: false,
        rationale: 'A pressure increase creates a transient imbalance that the system counters by favoring the denser side.'
      },
      {
        value: 'D',
        label: 'NH3 initially increases then returns to its original amount.',
        isCorrect: false,
        rationale: 'The new equilibrium lies toward more NH3; it does not revert without further disturbance.'
      }
    ],
    explanation: 'For gaseous systems, decreasing volume raises pressure. According to Le Chatelier’s principle, equilibrium shifts toward the side with fewer gas moles—in this case producing more ammonia.',
    references: [
      {
        label: 'Atkins Physical Chemistry',
        citation: 'Le Chatelier Principle section'
      }
    ]
  }
];

(async () => {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query('BEGIN');
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
        'imat',
        'International Medical Admissions Test',
        'IMAT blueprint covering logical reasoning, general knowledge, sciences, and mathematics.',
        'en',
        'SI',
        JSON.stringify({ board: 'Cambridge Assessment Admissions Testing', durationMinutes: 100 }),
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
        [examId, section.slug, section.name, section.description, section.orderIndex, JSON.stringify(section.metadata ?? {})]
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
        [examId, sectionId, topic.slug, topic.title, topic.blueprintCode, topic.depth ?? 0, topic.orderIndex ?? 0, JSON.stringify(topic.metadata ?? {})]
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
           public_id, version, is_latest, status, exam_id, section_id, primary_topic_id,
           question_type, difficulty, cognitive_level, skill_type,
           calculator_policy, unit_system, primary_locale, time_estimate_sec,
           metadata, tags, security, irt_a, irt_b, irt_c, psychometrics
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7,
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

      await client.query('DELETE FROM qbank_question_stimuli WHERE question_id = $1', [questionId]);
      await client.query('DELETE FROM qbank_question_options WHERE question_id = $1', [questionId]);
      await client.query('DELETE FROM qbank_question_explanations WHERE question_id = $1', [questionId]);
      await client.query('DELETE FROM qbank_option_rationales WHERE option_id IN (SELECT id FROM qbank_question_options WHERE question_id = $1)', [questionId]);
      await client.query('DELETE FROM qbank_question_references WHERE question_id = $1', [questionId]);
      await client.query('DELETE FROM qbank_question_topic_links WHERE question_id = $1 AND topic_id <> $2', [questionId, topicId]);

      let orderIndex = 0;
      for (const block of question.stemBlocks ?? []) {
        await client.query(
          `INSERT INTO qbank_question_stimuli (question_id, locale, stimulus_type, content, order_index, metadata)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            questionId,
            question.primaryLocale,
            block.kind === 'image' ? 'image' : 'vignette',
            JSON.stringify(block),
            orderIndex,
            JSON.stringify({}),
          ]
        );
        orderIndex += 1;
      }

      const optionInsertText = `INSERT INTO qbank_question_options (question_id, value, label, content, is_correct, order_index, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`;

      for (let idx = 0; idx < question.options.length; idx += 1) {
        const option = question.options[idx];
        const optionRes = await client.query(optionInsertText, [
          questionId,
          option.value,
          option.label,
          JSON.stringify({ text: option.label }),
          option.isCorrect,
          idx,
          JSON.stringify({}),
        ]);
        const optionId = optionRes.rows[0].id;
        await client.query(
          `INSERT INTO qbank_option_rationales (option_id, rationale_type, body, metadata)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (option_id, rationale_type) DO UPDATE
           SET body = EXCLUDED.body,
               metadata = EXCLUDED.metadata,
               created_at = qbank_option_rationales.created_at`,
          [
            optionId,
            option.isCorrect ? 'why_correct' : 'why_incorrect',
            JSON.stringify({ markdown: option.rationale }),
            JSON.stringify({ tone: 'academic' }),
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
          'primary',
          question.primaryLocale,
          JSON.stringify({ markdown: question.explanation }),
          JSON.stringify({ readingTimeSec: 35 }),
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
            JSON.stringify({}),
          ]
        );
      }

      await client.query(
        `INSERT INTO qbank_question_topic_links (question_id, topic_id, coverage_weight, metadata)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (question_id, topic_id) DO UPDATE
         SET coverage_weight = EXCLUDED.coverage_weight,
             metadata = EXCLUDED.metadata`,
        [questionId, topicId, 1.0, JSON.stringify({ primary: true })]
      );
    }

    await client.query('COMMIT');
    console.log('Seeded IMAT exam, sections, topics, and sample questions.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
