-- Clinical case saga engine baseline

DROP TABLE IF EXISTS case_attempt_steps;
DROP TABLE IF EXISTS case_attempts;
DROP TABLE IF EXISTS case_stage_options;
DROP TABLE IF EXISTS case_stages;
DROP TABLE IF EXISTS case_cases;
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
  UNIQUE (user_id, case_id, status)
);

CREATE UNIQUE INDEX case_attempts_user_active_idx ON case_attempts (user_id, case_id, status);
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

-- Seed showcase case with staged reasoning

WITH collection AS (
  INSERT INTO case_collections (slug, name, description, accent_color, metadata)
  VALUES (
    'global-clinical',
    'Global Clinical Reasoning',
    'Branching clinical reasoning arcs focused on high-yield decision making.',
    '#6366f1',
    '{"tagline":"Investigate, reason, manage."}'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    accent_color = EXCLUDED.accent_color,
    metadata = EXCLUDED.metadata,
    created_at = case_collections.created_at
  RETURNING id
),
subject AS (
  INSERT INTO case_subjects (collection_id, slug, name, description, position, metadata)
  SELECT id, 'endocrine', 'Endocrine reasoning', 'Cascade through endocrine investigations to land the diagnosis.', 1, '{}'::jsonb
  FROM collection
  ON CONFLICT (collection_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    position = EXCLUDED.position,
    metadata = EXCLUDED.metadata
  RETURNING id
),
base_case AS (
  INSERT INTO case_cases (subject_id, slug, title, subtitle, overview, difficulty, estimated_minutes, phase_count, metadata)
  SELECT id,
         'hypercortisolism-pathway',
         'Hypercortisolism diagnostic pathway',
         'Investigate the cortisol mystery scene by scene.',
         'A 35-year-old presents with progressive Cushing-like features. Order and interpret each action carefully to avoid premature closure.',
         'moderate',
         20,
         2,
         '{"system":"Endocrine","discipline":"Clinical reasoning","physicianTasks":["History","Order tests","Synthesize diagnosis","Management"],"skills":["Algorithm","Lab interpretation"],"tags":["endocrine","cortisol","reasoning"]}'::jsonb
  FROM subject
  ON CONFLICT (subject_id, slug) DO UPDATE SET
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    overview = EXCLUDED.overview,
    estimated_minutes = EXCLUDED.estimated_minutes,
    phase_count = EXCLUDED.phase_count,
    metadata = EXCLUDED.metadata,
    updated_at = now()
  RETURNING id
),
stages AS (
  INSERT INTO case_stages (case_id, slug, title, subtitle, phase, stage_type, order_index, allow_multiple, is_terminal, info, metadata)
  SELECT id,
         'scene-intro',
         'Initial presentation',
         'Frame the story before you act.',
         1,
         'info',
         0,
         false,
         false,
         '["35-year-old with weight gain, proximal weakness, acne, and purple striae.","Blood pressure 158/96 mmHg, heart rate 92 bpm."]'::jsonb,
         '{"scene":"history"}'::jsonb
  FROM base_case
  UNION ALL
  SELECT id,
         'scene-initial-action',
         'First investigative step',
         'Choose your opening move.',
         1,
         'decision',
         1,
         false,
         false,
         '[]'::jsonb,
         '{"scene":"planning"}'::jsonb
  FROM base_case
  UNION ALL
  SELECT id,
         'scene-labs',
         'Focused testing',
         'Pick the most informative lab next.',
         1,
         'order',
         2,
         false,
         false,
         '["You confirmed ACTH-dependent hypercortisolism."]'::jsonb,
         '{"scene":"labs"}'::jsonb
  FROM base_case
  UNION ALL
  SELECT id,
         'scene-diagnosis',
         'Synthesize the evidence',
         'Lock in the most likely diagnosis.',
         1,
         'diagnosis',
         3,
         false,
         false,
         '["Pituitary MRI reveals a 6 mm microadenoma."]'::jsonb,
         '{"scene":"diagnosis"}'::jsonb
  FROM base_case
  UNION ALL
  SELECT id,
         'scene-management-intro',
         'Management briefing',
         'Phase change into definitive care.',
         2,
         'info',
         0,
         false,
         false,
         '["Endocrine consult confirms pituitary source.","Patient stable and ready for definitive management."]'::jsonb,
         '{"scene":"transition"}'::jsonb
  FROM base_case
  UNION ALL
  SELECT id,
         'scene-management',
         'Definitive management',
         'Select the best intervention.',
         2,
         'management',
         1,
         false,
         false,
         '[]'::jsonb,
         '{"scene":"management"}'::jsonb
  FROM base_case
  UNION ALL
  SELECT id,
         'scene-summary',
         'Case summary',
         'Bank the learning points and plan follow-up.',
         2,
         'summary',
         2,
         false,
         true,
         '["High-yield ladder: confirm excess -> localize -> manage.","Track long-term risk of recurrence."]'::jsonb,
         '{"scene":"summary"}'::jsonb
  FROM base_case
  RETURNING id, slug
)
INSERT INTO case_stage_options (stage_id, value, label, description, detail, is_correct, advance_to, cost_time, score_delta, reveals, outcomes)
SELECT stages.id,
       data.value,
       data.label,
       data.description,
       data.detail,
       data.is_correct,
       data.advance_to,
       data.cost_time,
       data.score_delta,
       data.reveals,
       data.outcomes
FROM stages
JOIN (
  VALUES
    ('scene-initial-action', 'baseline-eval', 'Order low-dose dex suppression and baseline labs', 'Confirm cortisol excess and gather metabolic clues.', 'Returns cortisol, ACTH, glucose, potassium.', true, 'scene-labs', 30, 6, '["Lab: Morning cortisol 28 ug/dL","Lab: ACTH 78 pg/mL","Lab: Glucose 198 mg/dL","Lab: Potassium 3.1 mEq/L"]'::jsonb, '{"feedback":"Appropriate stewardship - verified hypercortisolism before localization."}'::jsonb),
    ('scene-initial-action', 'start-therapy', 'Start ketoconazole immediately', 'Treating before confirming etiology hides the signal.', 'Temporary relief but delays localization.', false, 'scene-labs', 15, -4, '[]'::jsonb, '{"feedback":"Therapy before diagnosis risks masking key data.","funStatus":"You lost precious minutes medicating a mystery -- the attending scribbled \"treat the cause, not the vibes\" in your notes.","tone":"snark"}'::jsonb),
    ('scene-initial-action', 'early-mri', 'Order pituitary MRI now', 'Imaging before biochemical proof can mislead.', 'Incidentalomas may confuse localization.', false, 'scene-labs', 25, -2, '[]'::jsonb, '{"feedback":"Image after biochemical confirmation to avoid false leads.","funStatus":"That premature MRI uncovered an incidentaloma and a very unimpressed radiologist.","tone":"snark"}'::jsonb),
    ('scene-labs', 'high-dose-dex', 'Perform high-dose dexamethasone suppression', 'Differentiate pituitary from ectopic ACTH sources.', 'Suppression over 50 percent supports pituitary source.', true, 'scene-diagnosis', 45, 6, '["Suppression: 60 percent drop in cortisol","Supports pituitary ACTH source"]'::jsonb, '{"feedback":"Targeted localization accomplished."}'::jsonb),
    ('scene-labs', 'inferior-petrosal', 'Schedule inferior petrosal sinus sampling', 'Invasive and premature with positive MRI pending.', 'High resource cost when not yet indicated.', false, 'scene-diagnosis', 90, -5, '[]'::jsonb, '{"feedback":"Reserve sinus sampling for discordant labs.","funStatus":"IR cancelled the room and left you a bill for the consult that never should have happened.","tone":"snark"}'::jsonb),
    ('scene-labs', 'repeat-baseline', 'Repeat the low-dose dex test', 'Redundant testing wastes time.', 'No additional insight gained.', false, 'scene-diagnosis', 20, -3, '[]'::jsonb, '{"feedback":"Redundant testing adds fatigue and no clarity.","funStatus":"The lab tech labeled this tube \"deja vu cortisol\" and the attending is giving you side-eye.","tone":"snark"}'::jsonb),
    ('scene-diagnosis', 'cushing-disease', 'Pituitary ACTH-secreting adenoma', 'Lab suppression plus MRI support this diagnosis.', 'Phase one complete.', true, 'scene-management-intro', 10, 8, '["Diagnosis locked: pituitary ACTH adenoma"]'::jsonb, '{"feedback":"Correct localization achieved.","phaseComplete":true}'::jsonb),
    ('scene-diagnosis', 'ectopic-acth', 'Ectopic ACTH production', 'Would not suppress with high-dose dex.', 'Consider only if labs fail to suppress.', false, 'scene-management-intro', 15, -6, '[]'::jsonb, '{"feedback":"Lab pattern argues against ectopic source.","funStatus":"You paged the thoracic surgery team for no reason. They sent back a GIF of a shrug.","tone":"snark"}'::jsonb),
    ('scene-diagnosis', 'adrenal-adenoma', 'Adrenal cortisol adenoma', 'Typically ACTH suppressed in adrenal disease.', 'Data does not support this path.', false, 'scene-management-intro', 15, -5, '[]'::jsonb, '{"feedback":"ACTH-dependent labs make adrenal source unlikely.","funStatus":"Endocrine clinic is now calling security on your adrenalectomy dreams.","tone":"snark"}'::jsonb),
    ('scene-management-intro', 'advance-management', 'Advance to management planning', 'Move into the management cascade.', 'Transition to phase two.', true, 'scene-management', 5, 2, '[]'::jsonb, '{"feedback":"Shift into definitive management."}'::jsonb),
    ('scene-management', 'transsphenoidal', 'Refer for transsphenoidal resection', 'Definitive therapy for pituitary microadenoma.', 'Arrange peri-operative plan.', true, 'scene-summary', 30, 10, '["Plan: transsphenoidal surgery","Add peri-operative steroid coverage"]'::jsonb, '{"feedback":"Definitive management selected.","caseComplete":true}'::jsonb),
    ('scene-management', 'ketoconazole-bridge', 'Bridge with ketoconazole', 'Useful temporizing step but not definitive.', 'Best reserved when surgery delayed.', false, 'scene-summary', 20, -4, '[]'::jsonb, '{"feedback":"Medical therapy is a bridge, not the finish line.","funStatus":"You prescribed a bridge and forgot to build the destination. The attending slid you a sticky note that says \"OR?\".","tone":"snark"}'::jsonb),
    ('scene-management', 'adrenalectomy', 'Schedule bilateral adrenalectomy', 'High morbidity salvage for refractory disease.', 'Not first-line for surgical candidates.', false, 'scene-summary', 45, -6, '[]'::jsonb, '{"feedback":"Reserve adrenalectomy for refractory cases.","funStatus":"Both adrenal glands are filing a formal grievance and the malpractice team is warming up.","tone":"snark"}'::jsonb)
) AS data(slug, value, label, description, detail, is_correct, advance_to, cost_time, score_delta, reveals, outcomes)
ON stages.slug = data.slug;

