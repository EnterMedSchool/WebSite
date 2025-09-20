-- Question bank adaptive practice foundation

DROP TABLE IF EXISTS qbank_question_links;
DROP TABLE IF EXISTS qbank_question_notes;
DROP TABLE IF EXISTS qbank_question_bookmarks;
DROP TABLE IF EXISTS qbank_question_feedback;
DROP TABLE IF EXISTS qbank_option_stats;
DROP TABLE IF EXISTS qbank_question_stats;
DROP TABLE IF EXISTS qbank_question_references;
DROP TABLE IF EXISTS qbank_question_explanations;
DROP TABLE IF EXISTS qbank_option_rationales;
DROP TABLE IF EXISTS qbank_question_options;
DROP TABLE IF EXISTS qbank_question_media;
DROP TABLE IF EXISTS qbank_question_stimuli;
DROP TABLE IF EXISTS qbank_question_topic_links;
DROP TABLE IF EXISTS qbank_question_variants;
DROP TABLE IF EXISTS qbank_attempt_items;
DROP TABLE IF EXISTS qbank_attempts;
DROP TABLE IF EXISTS qbank_review_queue;
DROP TABLE IF EXISTS qbank_mastery_states;
DROP TABLE IF EXISTS qbank_goal_progress;
DROP TABLE IF EXISTS qbank_user_settings;
DROP TABLE IF EXISTS qbank_questions;
DROP TABLE IF EXISTS qbank_topics;
DROP TABLE IF EXISTS qbank_sections;
DROP TABLE IF EXISTS qbank_exams;

CREATE TABLE qbank_exams (
  id serial PRIMARY KEY,
  slug varchar(80) NOT NULL UNIQUE,
  name varchar(160) NOT NULL,
  description text,
  locale varchar(16) NOT NULL DEFAULT 'en',
  default_unit_system varchar(8) NOT NULL DEFAULT 'SI',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX qbank_exams_locale_idx ON qbank_exams (locale);

CREATE TABLE qbank_sections (
  id serial PRIMARY KEY,
  exam_id integer NOT NULL REFERENCES qbank_exams(id) ON DELETE CASCADE,
  slug varchar(80) NOT NULL,
  name varchar(160) NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  UNIQUE (exam_id, slug)
);

CREATE INDEX qbank_sections_exam_order_idx ON qbank_sections (exam_id, order_index);

CREATE TABLE qbank_topics (
  id serial PRIMARY KEY,
  exam_id integer NOT NULL REFERENCES qbank_exams(id) ON DELETE CASCADE,
  section_id integer REFERENCES qbank_sections(id) ON DELETE SET NULL,
  parent_topic_id integer REFERENCES qbank_topics(id) ON DELETE CASCADE,
  slug varchar(120) NOT NULL,
  title varchar(200) NOT NULL,
  blueprint_code varchar(120),
  depth integer NOT NULL DEFAULT 0,
  order_index integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  UNIQUE (exam_id, slug)
);

CREATE INDEX qbank_topics_section_idx ON qbank_topics (section_id, order_index);
CREATE INDEX qbank_topics_parent_idx ON qbank_topics (parent_topic_id, order_index);
CREATE INDEX qbank_topics_blueprint_idx ON qbank_topics (blueprint_code);

CREATE TABLE qbank_questions (
  id serial PRIMARY KEY,
  public_id varchar(120) NOT NULL,
  version integer NOT NULL DEFAULT 1,
  is_latest boolean NOT NULL DEFAULT false,
  status varchar(24) NOT NULL DEFAULT 'draft',
  exam_id integer NOT NULL REFERENCES qbank_exams(id) ON DELETE CASCADE,
  section_id integer REFERENCES qbank_sections(id) ON DELETE SET NULL,
  primary_topic_id integer REFERENCES qbank_topics(id) ON DELETE SET NULL,
  question_type varchar(32) NOT NULL DEFAULT 'sba',
  difficulty varchar(24),
  cognitive_level varchar(32),
  skill_type varchar(32),
  calculator_policy varchar(24) NOT NULL DEFAULT 'disallowed',
  unit_system varchar(8) NOT NULL DEFAULT 'SI',
  primary_locale varchar(16) NOT NULL DEFAULT 'en',
  time_estimate_sec integer NOT NULL DEFAULT 90,
  metadata jsonb DEFAULT '{}'::jsonb,
  tags jsonb DEFAULT '[]'::jsonb,
  security jsonb DEFAULT '{}'::jsonb,
  irt_a double precision,
  irt_b double precision,
  irt_c double precision,
  psychometrics jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  published_at timestamp,
  retired_at timestamp,
  UNIQUE (public_id, version),
  CHECK (status IN ('draft', 'in_review', 'live', 'retired')),
  CHECK (question_type IN ('sba', 'multi', 'emq', 'sjt', 'drag', 'hotspot', 'data')),
  CHECK (calculator_policy IN ('disallowed', 'basic', 'scientific', 'exam_default')),
  CHECK (unit_system IN ('SI', 'US', 'dual'))
);

CREATE INDEX qbank_questions_exam_idx ON qbank_questions (exam_id, status);
CREATE INDEX qbank_questions_topic_idx ON qbank_questions (primary_topic_id);
CREATE INDEX qbank_questions_status_idx ON qbank_questions (status, updated_at);
CREATE UNIQUE INDEX qbank_questions_latest_idx ON qbank_questions (public_id) WHERE is_latest;

CREATE TABLE qbank_question_stimuli (
  id serial PRIMARY KEY,
  question_id integer NOT NULL REFERENCES qbank_questions(id) ON DELETE CASCADE,
  locale varchar(16) NOT NULL DEFAULT 'en',
  stimulus_type varchar(24) NOT NULL DEFAULT 'vignette',
  content jsonb NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  UNIQUE (question_id, locale, stimulus_type, order_index)
);

CREATE INDEX qbank_question_stimuli_question_idx ON qbank_question_stimuli (question_id);

CREATE TABLE qbank_question_media (
  id serial PRIMARY KEY,
  question_id integer NOT NULL REFERENCES qbank_questions(id) ON DELETE CASCADE,
  asset_id varchar(120) NOT NULL,
  media_kind varchar(24) NOT NULL,
  locale varchar(16) NOT NULL DEFAULT 'en',
  uri text,
  caption text,
  order_index integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  security jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now() NOT NULL,
  UNIQUE (question_id, asset_id)
);

CREATE INDEX qbank_question_media_kind_idx ON qbank_question_media (media_kind);

CREATE TABLE qbank_question_options (
  id serial PRIMARY KEY,
  question_id integer NOT NULL REFERENCES qbank_questions(id) ON DELETE CASCADE,
  value varchar(32) NOT NULL,
  label text,
  content jsonb,
  is_correct boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  UNIQUE (question_id, value)
);

CREATE INDEX qbank_question_options_question_idx ON qbank_question_options (question_id);

CREATE TABLE qbank_option_rationales (
  id serial PRIMARY KEY,
  option_id integer NOT NULL REFERENCES qbank_question_options(id) ON DELETE CASCADE,
  rationale_type varchar(24) NOT NULL DEFAULT 'why_incorrect',
  body jsonb NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now() NOT NULL,
  UNIQUE (option_id, rationale_type)
);

CREATE TABLE qbank_question_explanations (
  id serial PRIMARY KEY,
  question_id integer NOT NULL REFERENCES qbank_questions(id) ON DELETE CASCADE,
  explanation_type varchar(32) NOT NULL,
  locale varchar(16) NOT NULL DEFAULT 'en',
  body jsonb NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  UNIQUE (question_id, explanation_type, locale, order_index)
);

CREATE INDEX qbank_question_explanations_question_idx ON qbank_question_explanations (question_id);

CREATE TABLE qbank_question_references (
  id serial PRIMARY KEY,
  question_id integer NOT NULL REFERENCES qbank_questions(id) ON DELETE CASCADE,
  label text NOT NULL,
  url text,
  citation text,
  order_index integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX qbank_question_references_question_idx ON qbank_question_references (question_id);

CREATE TABLE qbank_question_variants (
  id serial PRIMARY KEY,
  question_id integer NOT NULL REFERENCES qbank_questions(id) ON DELETE CASCADE,
  variant_code varchar(80) NOT NULL,
  seed jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now() NOT NULL,
  UNIQUE (question_id, variant_code)
);

CREATE TABLE qbank_question_topic_links (
  id serial PRIMARY KEY,
  question_id integer NOT NULL REFERENCES qbank_questions(id) ON DELETE CASCADE,
  topic_id integer NOT NULL REFERENCES qbank_topics(id) ON DELETE CASCADE,
  coverage_weight double precision,
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE (question_id, topic_id)
);

CREATE INDEX qbank_question_topic_links_topic_idx ON qbank_question_topic_links (topic_id);

CREATE TABLE qbank_question_stats (
  id serial PRIMARY KEY,
  question_id integer NOT NULL REFERENCES qbank_questions(id) ON DELETE CASCADE,
  sample_size integer NOT NULL DEFAULT 0,
  p_value double precision,
  point_biserial double precision,
  exposure_count integer NOT NULL DEFAULT 0,
  dif_flags jsonb DEFAULT '[]'::jsonb,
  metrics jsonb DEFAULT '{}'::jsonb,
  last_calibrated_at timestamp,
  updated_at timestamp DEFAULT now() NOT NULL,
  UNIQUE (question_id)
);

CREATE TABLE qbank_option_stats (
  id serial PRIMARY KEY,
  option_id integer NOT NULL REFERENCES qbank_question_options(id) ON DELETE CASCADE,
  selection_count integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  misconception_notes text,
  cohorts jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp DEFAULT now() NOT NULL,
  UNIQUE (option_id)
);

CREATE TABLE qbank_question_feedback (
  id serial PRIMARY KEY,
  question_id integer NOT NULL REFERENCES qbank_questions(id) ON DELETE CASCADE,
  user_id integer REFERENCES users(id) ON DELETE SET NULL,
  feedback_type varchar(32) NOT NULL DEFAULT 'issue',
  body text NOT NULL,
  status varchar(24) NOT NULL DEFAULT 'open',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now() NOT NULL,
  resolved_at timestamp
);

CREATE INDEX qbank_question_feedback_status_idx ON qbank_question_feedback (status, created_at);
CREATE INDEX qbank_question_feedback_question_idx ON qbank_question_feedback (question_id);

CREATE TABLE qbank_question_bookmarks (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id integer NOT NULL REFERENCES qbank_questions(id) ON DELETE CASCADE,
  bookmark_type varchar(24) NOT NULL DEFAULT 'bookmark',
  note text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now() NOT NULL,
  UNIQUE (user_id, question_id, bookmark_type)
);

CREATE INDEX qbank_question_bookmarks_question_idx ON qbank_question_bookmarks (question_id);

CREATE TABLE qbank_attempts (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_id integer REFERENCES qbank_exams(id) ON DELETE SET NULL,
  section_id integer REFERENCES qbank_sections(id) ON DELETE SET NULL,
  mode varchar(24) NOT NULL,
  status varchar(24) NOT NULL DEFAULT 'in_progress',
  question_count integer NOT NULL DEFAULT 0,
  settings jsonb DEFAULT '{}'::jsonb,
  analytics jsonb DEFAULT '{}'::jsonb,
  started_at timestamp DEFAULT now() NOT NULL,
  completed_at timestamp,
  duration_sec integer,
  score_raw double precision,
  score_percent double precision,
  ability_estimate double precision,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  CHECK (mode IN ('untimed', 'timed', 'exam_sim', 'custom'))
);

CREATE INDEX qbank_attempts_user_idx ON qbank_attempts (user_id, status);
CREATE INDEX qbank_attempts_exam_idx ON qbank_attempts (exam_id, mode);

CREATE TABLE qbank_attempt_items (
  id serial PRIMARY KEY,
  attempt_id integer NOT NULL REFERENCES qbank_attempts(id) ON DELETE CASCADE,
  question_id integer REFERENCES qbank_questions(id) ON DELETE SET NULL,
  question_public_id varchar(120),
  question_version integer,
  variant_code varchar(80),
  display_order integer NOT NULL DEFAULT 0,
  prompt_seed jsonb DEFAULT '{}'::jsonb,
  response jsonb DEFAULT '{}'::jsonb,
  selected_options jsonb DEFAULT '[]'::jsonb,
  is_correct boolean,
  score_delta double precision,
  confidence_level smallint,
  why_response text,
  time_started timestamp,
  time_completed timestamp,
  time_spent_ms integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now() NOT NULL,
  UNIQUE (attempt_id, display_order)
);

CREATE INDEX qbank_attempt_items_attempt_idx ON qbank_attempt_items (attempt_id);
CREATE INDEX qbank_attempt_items_question_idx ON qbank_attempt_items (question_id);
CREATE INDEX qbank_attempt_items_confidence_idx ON qbank_attempt_items (confidence_level);

CREATE TABLE qbank_question_notes (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id integer NOT NULL REFERENCES qbank_questions(id) ON DELETE CASCADE,
  attempt_item_id integer REFERENCES qbank_attempt_items(id) ON DELETE SET NULL,
  locale varchar(16) NOT NULL DEFAULT 'en',
  body text NOT NULL,
  is_private boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX qbank_question_notes_user_idx ON qbank_question_notes (user_id, question_id);

CREATE TABLE qbank_question_links (
  id serial PRIMARY KEY,
  question_id integer NOT NULL REFERENCES qbank_questions(id) ON DELETE CASCADE,
  related_question_id integer NOT NULL REFERENCES qbank_questions(id) ON DELETE CASCADE,
  relation_type varchar(24) NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now() NOT NULL,
  UNIQUE (question_id, related_question_id, relation_type)
);

CREATE INDEX qbank_question_links_related_idx ON qbank_question_links (related_question_id);

CREATE TABLE qbank_mastery_states (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_id integer NOT NULL REFERENCES qbank_exams(id) ON DELETE CASCADE,
  topic_id integer NOT NULL REFERENCES qbank_topics(id) ON DELETE CASCADE,
  dimension varchar(32) NOT NULL DEFAULT 'overall',
  ability_estimate double precision NOT NULL DEFAULT 0,
  standard_error double precision NOT NULL DEFAULT 1,
  attempts_count integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  last_practiced_at timestamp,
  forgetting_curve jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE (user_id, exam_id, topic_id, dimension)
);

CREATE INDEX qbank_mastery_states_exam_idx ON qbank_mastery_states (exam_id, topic_id);
CREATE INDEX qbank_mastery_states_user_idx ON qbank_mastery_states (user_id, dimension);

CREATE TABLE qbank_review_queue (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id integer NOT NULL REFERENCES qbank_questions(id) ON DELETE CASCADE,
  due_at timestamp NOT NULL,
  priority integer NOT NULL DEFAULT 0,
  status varchar(24) NOT NULL DEFAULT 'pending',
  scheduler_state jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  CHECK (status IN ('pending', 'snoozed', 'completed', 'archived'))
);

CREATE UNIQUE INDEX qbank_review_queue_user_question_pending_idx ON qbank_review_queue (user_id, question_id) WHERE status = 'pending';
CREATE INDEX qbank_review_queue_due_idx ON qbank_review_queue (user_id, due_at);

CREATE TABLE qbank_goal_progress (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_id integer REFERENCES qbank_exams(id) ON DELETE SET NULL,
  week_start date NOT NULL,
  questions_target integer NOT NULL DEFAULT 0,
  questions_completed integer NOT NULL DEFAULT 0,
  minutes_target integer NOT NULL DEFAULT 0,
  minutes_completed integer NOT NULL DEFAULT 0,
  streak_count integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE (user_id, exam_id, week_start)
);

CREATE INDEX qbank_goal_progress_user_idx ON qbank_goal_progress (user_id, week_start);

CREATE TABLE qbank_user_settings (
  user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  preferred_exams jsonb DEFAULT '[]'::jsonb,
  preferences jsonb DEFAULT '{}'::jsonb,
  sync_state jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp DEFAULT now() NOT NULL
);
