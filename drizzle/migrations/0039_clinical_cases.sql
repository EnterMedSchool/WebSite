-- Clinical case collections with interactive reasoning scenes

DROP TABLE IF EXISTS case_attempt_steps;
DROP TABLE IF EXISTS case_attempts;
DROP TABLE IF EXISTS case_stage_options;
DROP TABLE IF EXISTS case_stages;
DROP TABLE IF EXISTS clinical_cases;
DROP TABLE IF EXISTS case_subjects;
DROP TABLE IF EXISTS case_collections;

CREATE TABLE case_collections (
  id serial PRIMARY KEY,
  slug varchar(80) NOT NULL UNIQUE,
  name varchar(160) NOT NULL,
  description text,
  accent_color varchar(32),
  metadata jsonb,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX case_collections_slug_idx ON case_collections (slug);

CREATE TABLE case_subjects (
  id serial PRIMARY KEY,
  collection_id integer NOT NULL REFERENCES case_collections(id) ON DELETE CASCADE,
  slug varchar(80) NOT NULL,
  name varchar(160) NOT NULL,
  description text,
  position integer NOT NULL DEFAULT 0,
  metadata jsonb,
  created_at timestamp DEFAULT now() NOT NULL,
  UNIQUE (collection_id, slug)
);

CREATE INDEX case_subjects_collection_idx ON case_subjects (collection_id);
CREATE INDEX case_subjects_position_idx ON case_subjects (collection_id, position);

CREATE TABLE case_cases (
  id serial PRIMARY KEY,
  subject_id integer NOT NULL REFERENCES case_subjects(id) ON DELETE CASCADE,
  slug varchar(120) NOT NULL,
  title varchar(200) NOT NULL,
  subtitle text,
  overview text,
  difficulty varchar(24) NOT NULL DEFAULT 'moderate',
  estimated_minutes integer NOT NULL DEFAULT 15,
  phase_count integer NOT NULL DEFAULT 2,
  metadata jsonb,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  UNIQUE (subject_id, slug)
);

CREATE INDEX case_cases_subject_idx ON case_cases (subject_id);

CREATE TABLE case_stages (
  id serial PRIMARY KEY,
  case_id integer NOT NULL REFERENCES case_cases(id) ON DELETE CASCADE,
  slug varchar(120) NOT NULL,
  title varchar(200) NOT NULL,
  subtitle text,
  phase integer NOT NULL DEFAULT 1,
  stage_type varchar(32) NOT NULL DEFAULT 'info',
  order_index integer NOT NULL DEFAULT 0,
  allow_multiple boolean NOT NULL DEFAULT false,
  is_terminal boolean NOT NULL DEFAULT false,
  info jsonb,
  metadata jsonb,
  UNIQUE (case_id, slug)
);

CREATE INDEX case_stages_case_order_idx ON case_stages (case_id, phase, order_index);

CREATE TABLE case_stage_options (
  id serial PRIMARY KEY,
  stage_id integer NOT NULL REFERENCES case_stages(id) ON DELETE CASCADE,
  value varchar(80) NOT NULL,
  label text NOT NULL,
  description text,
  detail text,
  is_correct boolean NOT NULL DEFAULT false,
  advance_to varchar(120),
  cost_time integer,
  score_delta integer NOT NULL DEFAULT 0,
  reveals jsonb,
  outcomes jsonb,
  metadata jsonb,
  UNIQUE (stage_id, value)
);

CREATE INDEX case_stage_options_stage_idx ON case_stage_options (stage_id);

CREATE TABLE case_attempts (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  case_id integer NOT NULL REFERENCES case_cases(id) ON DELETE CASCADE,
  status varchar(24) NOT NULL DEFAULT 'in_progress',
  phase integer NOT NULL DEFAULT 1,
  current_stage_slug varchar(120),
  score integer NOT NULL DEFAULT 0,
  evidence jsonb DEFAULT '[]'::jsonb,
  state jsonb DEFAULT '{}'::jsonb,
  started_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  completed_at timestamp,
  UNIQUE (user_id, case_id, status) WHERE status = 'in_progress'
);

CREATE INDEX case_attempts_user_idx ON case_attempts (user_id, case_id);

CREATE TABLE case_attempt_steps (
  id serial PRIMARY KEY,
  attempt_id integer NOT NULL REFERENCES case_attempts(id) ON DELETE CASCADE,
  stage_id integer NOT NULL REFERENCES case_stages(id) ON DELETE CASCADE,
  option_id integer NOT NULL REFERENCES case_stage_options(id) ON DELETE CASCADE,
  option_value varchar(80) NOT NULL,
  correct boolean NOT NULL DEFAULT false,
  time_spent integer,
  evidence jsonb,
  state jsonb,
  taken_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX case_attempt_steps_attempt_idx ON case_attempt_steps (attempt_id);

-- Seed primary collection, subjects, and one multi-phase case

WITH upsert_collection AS (
  INSERT INTO case_collections (slug, name, description, accent_color, metadata)
  VALUES ('integrated', 'Integrated Diagnostic Lab', 'Stepwise clinical reasoning scenarios with management follow-up.', '#6366F1', '{}'::jsonb)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id
),
upsert_subject AS (
  INSERT INTO case_subjects (collection_id, slug, name, description, position, metadata)
  SELECT id, 'endocrine', 'Endocrine reasoning', 'ACTH-dependent cortisol evaluation with stewardship focus.', 1, '{}'::jsonb FROM upsert_collection
  ON CONFLICT (collection_id, slug) DO UPDATE SET name = EXCLUDED.name RETURNING id
),
insert_case AS (
  INSERT INTO case_cases (subject_id, slug, title, subtitle, overview, difficulty, estimated_minutes, phase_count, metadata)
  SELECT id,
         'hypercortisolism-pathway',
         'Hypercortisolism diagnostic pathway',
         'Uncover the cortisol source through deliberate testing.',
         'Investigate progressive hypercortisolism in a 35-year-old with Cushingoid features. Each action consumes time; choose wisely to avoid premature closure.',
         'moderate',
         20,
         2,
         '{}'::jsonb
  FROM upsert_subject
  ON CONFLICT (subject_id, slug) DO UPDATE SET title = EXCLUDED.title RETURNING id
),
stage_intro AS (
  INSERT INTO case_stages (case_id, slug, title, subtitle, phase, stage_type, order_index, info)
  SELECT id,
         'scene-intro',
         'Initial presentation',
         'Decide how to start the workup.',
         1,
         'info',
         0,
         '["35-year-old presents with weight gain, proximal weakness, acne, purple striae, hypertension."]'::jsonb
  FROM insert_case RETURNING id
),
stage_initial AS (
  INSERT INTO case_stages (case_id, slug, title, subtitle, phase, stage_type, order_index, info)
  SELECT id,
         'scene-initial-action',
         'First investigative step',
         'What is your next action?',
         1,
         'decision',
         1,
         '[]'::jsonb
  FROM insert_case RETURNING id
),
stage_labs AS (
  INSERT INTO case_stages (case_id, slug, title, subtitle, phase, stage_type, order_index, info)
  SELECT id,
         'scene-labs',
         'Focused testing',
         'Select the highest yield follow-up test.',
         1,
         'order',
         2,
         '[]'::jsonb
  FROM insert_case RETURNING id
),
stage_diagnosis AS (
  INSERT INTO case_stages (case_id, slug, title, subtitle, phase, stage_type, order_index, info)
  SELECT id,
         'scene-diagnosis',
         'Synthesize findings',
         'Commit to the most likely diagnosis.',
         1,
         'diagnosis',
         3,
         '[]'::jsonb
  FROM insert_case RETURNING id
),
stage_management_intro AS (
  INSERT INTO case_stages (case_id, slug, title, subtitle, phase, stage_type, order_index, info)
  SELECT id,
         'scene-management-intro',
         'Management briefing',
         'Transition to definitive therapy.',
         2,
         'info',
         0,
         '["Endocrine consult confirms ACTH-dependent Cushing disease.", "Patient remains hemodynamically stable; no acute decompensation."]'::jsonb
  FROM insert_case RETURNING id
),
stage_management AS (
  INSERT INTO case_stages (case_id, slug, title, subtitle, phase, stage_type, order_index, info)
  SELECT id,
         'scene-management',
         'Definitive management',
         'Choose the best next step in management.',
         2,
         'management',
         1,
         '[]'::jsonb
  FROM insert_case RETURNING id
),
stage_summary AS (
  INSERT INTO case_stages (case_id, slug, title, subtitle, phase, stage_type, order_index, info, is_terminal)
  SELECT id,
         'scene-summary',
         'Case summary',
         'Reflect on your decisions.',
         2,
         'summary',
         2,
         '["Highlight: high-dose dexamethasone suppression pinpointed the pituitary source.", "Management: neurosurgical referral plus pre-op medical optimization."]'::jsonb,
         true
  FROM insert_case RETURNING id
)
INSERT INTO case_stage_options (stage_id, value, label, description, detail, is_correct, advance_to, cost_time, score_delta, reveals, outcomes)
SELECT stage_initial.id,
       'order-basic-labs',
       'Order low-dose dexamethasone suppression and baseline labs',
       'Confirms cortisol excess before localization.',
       'Adds glucose, WBC, eosinophils, potassium results to your evidence log.',
       true,
       'scene-labs',
       30,
       5,
       '["Lab: Glucose 198 mg/dL", "Lab: WBC 14.2 k/uL", "Lab: Eosinophils 0.1 k/uL", "Lab: Potassium 3.1 mEq/L"]'::jsonb,
       '{"feedback":"Appropriate: confirm cortisol excess before localization."}'::jsonb
FROM stage_initial
UNION ALL
SELECT stage_initial.id,
       'start-treatment',
       'Start ketoconazole to block cortisol synthesis',
       'Premature without confirming etiology.',
       'Delay progression and risk missing localization data.',
       false,
       NULL,
       20,
       -5,
       '[]'::jsonb,
       '{"feedback":"Premature therapy: confirm biochemical diagnosis first."}'::jsonb
FROM stage_initial
UNION ALL
SELECT stage_initial.id,
       'order-mri',
       'Order pituitary MRI immediately',
       'Imaging before biochemical confirmation can mislead.',
       'You lose time and still need biochemical proof.',
       false,
       NULL,
       25,
       -3,
       '[]'::jsonb,
       '{"feedback":"Image after biochemical work-up to avoid incidental findings."}'::jsonb
FROM stage_initial
UNION ALL
SELECT stage_labs.id,
       'high-dose-dex',
       'Perform high-dose dexamethasone suppression',
       'Differentiates pituitary from ectopic ACTH sources.',
       'Suppression favours a pituitary source.',
       true,
       'scene-diagnosis',
       60,
       6,
       '["High-dose dex test: cortisol suppresses >50%", "Supports pituitary source"]'::jsonb,
       '{"feedback":"Excellent stewardship: targeted test gave you localization."}'::jsonb
FROM stage_labs
UNION ALL
SELECT stage_labs.id,
       'ct-adrenal',
       'Order adrenal CT now',
       'Low yield when ACTH is likely high.',
       'Adds little value and costs time.',
       false,
       NULL,
       45,
       -4,
       '[]'::jsonb,
       '{"feedback":"Adrenal imaging is low yield until ACTH-independent disease suspected."}'::jsonb
FROM stage_labs
UNION ALL
SELECT stage_labs.id,
       'repeat-low-dose',
       'Repeat the low-dose dexamethasone test',
       'Redundant testing without new information.',
       'No new data gained.',
       false,
       NULL,
       20,
       -2,
       '[]'::jsonb,
       '{"feedback":"Redundant testing wastes precious time."}'::jsonb
FROM stage_labs
UNION ALL
SELECT stage_diagnosis.id,
       'cushing-disease',
       'Pituitary ACTH-secreting adenoma',
       'High-dose suppression plus ACTH-dependent labs point here.',
       'Phase 1 complete.',
       true,
       'scene-management-intro',
       10,
       8,
       '["Diagnosis locked: Pituitary ACTH adenoma"]'::jsonb,
       '{"feedback":"Correct localization achieved.", "phaseComplete":true}'::jsonb
FROM stage_diagnosis
UNION ALL
SELECT stage_diagnosis.id,
       'ectopic-acth',
       'Ectopic ACTH (small cell lung carcinoma)',
       'Would not suppress with high-dose dex.',
       'Consider smoking history but data argue against it.',
       false,
       NULL,
       15,
       -5,
       '[]'::jsonb,
       '{"feedback":"High-dose dex suppression argues against ectopic source."}'::jsonb
FROM stage_diagnosis
UNION ALL
SELECT stage_management.id,
       'transsphenoidal-surgery',
       'Refer for transsphenoidal resection',
       'Definitive therapy for Cushing disease.',
       'Arrange neurosurgery and prep medically if needed.',
       true,
       'scene-summary',
       30,
       10,
       '["Plan: Transsphenoidal surgery", "Arrange peri-operative cortisol management"]'::jsonb,
       '{"feedback":"Definitive management selected.", "caseComplete":true}'::jsonb
FROM stage_management
UNION ALL
SELECT stage_management.id,
       'ketoconazole-bridge',
       'Start ketoconazole long term',
       'Useful as bridge but not definitive.',
       'Stabilises cortisol but does not cure.',
       false,
       NULL,
       30,
       -2,
       '[]'::jsonb,
       '{"feedback":"Medical therapy can bridge but surgery is definitive."}'::jsonb
FROM stage_management
UNION ALL
SELECT stage_management.id,
       'adrenalectomy',
       'Proceed to bilateral adrenalectomy',
       'Reserved for refractory or non-surgical candidates.',
       'High morbidity option.',
       false,
       NULL,
       40,
       -4,
       '[]'::jsonb,
       '{"feedback":"Adrenalectomy is salvage for uncontrolled disease."}'::jsonb
FROM stage_management;